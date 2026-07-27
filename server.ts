import express from 'express';
import path from 'path';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import * as dotenv from 'dotenv';
// NOTE: createRequire(import.meta.url) was previously here to support require()
// inside route handlers, but nothing in this file actually calls require() anymore
// (Gemini is invoked via raw fetch() to its REST API instead). It was removed because
// esbuild's CJS bundle output (dist/server.cjs) doesn't reliably rewrite import.meta.url,
// which caused a boot-time crash: "TypeError [ERR_INVALID_ARG_VALUE]: The argument
// 'filename' must be a file URL object" on Render.

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { Agent, setGlobalDispatcher } from 'undici';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// ESM explicit imports
import { db, verifyDatabaseConnection, withDbRetry } from './db/index.ts';
import { requireAuth, requireAdmin, AuthRequest } from './middleware/auth.ts';
import { adminAuth } from './lib/firebase-admin.ts';
import { predictionHistory, users, questions, attempts, streaks, doubts, chapterImages, dailyDose, dailyDoseAttempts, chapterLectures, userLectureProgress, pitStops, pitStopQuestions, payments, platformSettings, samplePapers, samplePaperSolutions } from './db/schema.ts';

dotenv.config();

// Set undici global dispatcher to prevent Headers Timeout Error during AI PDF parsing
setGlobalDispatcher(new Agent({
  headersTimeout: 600000, // 10 minutes for slow/large content generation of structured arrays
  bodyTimeout: 600000,
  connectTimeout: 60000
}));

// AI calls handled via require() inside route handlers

// Initialize Razorpay client (test mode keys from .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Server-side source of truth for payment amounts (in rupees).
// NEVER trust an amount sent from the client - always look it up here.
const PAYMENT_AMOUNTS: Record<string, number> = {
  premium_upgrade: 1000,
  doubt_question: 50,
  mentorship: 500,
};


async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  await verifyDatabaseConnection();
  console.log('PostgreSQL connection verified.');

  // Set substantial limits to support base64 uploads for PDFs and parsed material
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  // Helper to recompute and save user passport progress based on attempts, accuracy, streak, chapters
  async function refreshUserPassportStats(uid: string) {
    try {
      // 1. Total Solved attempts
      const totalAttempts = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(eq(attempts.userId, uid));
      const totalSolved = totalAttempts[0]?.count || 0;

      // 2. Correct count
      const correctAttempts = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, uid),
            eq(attempts.isCorrect, true)
          )
        );
      const correctCount = correctAttempts[0]?.count || 0;
      const overallAccuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

      // 3. Unique chapters
      const chapterQuery = await db.select({
        count: sql<number>`count(distinct ${questions.chapter})::int`
      })
      .from(attempts)
      .innerJoin(questions, eq(attempts.questionId, questions.id))
      .where(eq(attempts.userId, uid));
      const uniqueChapters = chapterQuery[0]?.count || 0;

      // 4. Streak
      const streakSelect = await db.select().from(streaks).where(eq(streaks.userId, uid));
      const currentStreak = streakSelect[0]?.currentStreak || 0;

      // 5. Calculate Progress (Chapters 40%, Solved 30%, Accuracy 20%, Streak 10%)
      const chapterContribution = Math.min(uniqueChapters * 10, 40);
      const questionsContribution = Math.min(totalSolved * 2, 30);
      const accuracyContribution = Math.round(overallAccuracy * 0.2);
      const streakContribution = Math.min(currentStreak * 2, 10);
      
      const journeyProgress = Math.min(
        Math.round(chapterContribution + questionsContribution + accuracyContribution + streakContribution),
        100
      );

      // 6. Passport Stage Logic
      let passportStage = 'class11';
      if (journeyProgress >= 75) {
        passportStage = 'dream_college';
      } else if (journeyProgress >= 50) {
        passportStage = 'exam_prep';
      } else if (journeyProgress >= 25) {
        passportStage = 'class12';
      }

      // 7. Update users table in database
      await db.update(users)
        .set({
          journeyProgress,
          passportStage,
          updatedAt: new Date()
        })
        .where(eq(users.uid, uid));

      return { journeyProgress, passportStage };
    } catch (err) {
      console.error('Failed to compute or save passport stats:', err);
      return null;
    }
  }

  // API Route: Health Checking
  app.get('/api/health', async (req, res) => {
    try {
      await verifyDatabaseConnection();
      res.json({ status: 'healthy', database: 'connected' });
    } catch (err: any) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: err.message,
      });
    }
  });

  // ============================================================
  // PAYMENT ROUTES (Razorpay)
  // ============================================================

  app.post('/api/payments/create-order', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { purpose, metadata } = req.body;

      if (!purpose || !PAYMENT_AMOUNTS[purpose]) {
        return res.status(400).json({ error: 'Invalid or missing purpose. Must be one of: ' + Object.keys(PAYMENT_AMOUNTS).join(', ') });
      }

      const amountInRupees = PAYMENT_AMOUNTS[purpose];
      const amountInPaise = amountInRupees * 100;

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${purpose}_${Date.now()}`,
      });

      await db.insert(payments).values({
        userId: uid,
        purpose,
        amount: amountInRupees,
        razorpayOrderId: order.id,
        status: 'created',
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err: any) {
      console.error('Failed to create Razorpay order:', err);
      res.status(500).json({ error: 'Failed to create payment order', details: err.message });
    }
  });

  app.post('/api/payments/verify', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required Razorpay verification fields.' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        await db.update(payments)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(payments.razorpayOrderId, razorpay_order_id));
        return res.status(400).json({ error: 'Payment verification failed: invalid signature.' });
      }

      const orderRecords = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpay_order_id));
      const orderRecord = orderRecords[0];

      if (!orderRecord) {
        return res.status(404).json({ error: 'Order not found in our records.' });
      }

      if (orderRecord.userId !== uid) {
        return res.status(403).json({ error: 'This order does not belong to the authenticated user.' });
      }

      await db.update(payments)
        .set({
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpay_order_id));

      if (orderRecord.purpose === 'premium_upgrade') {
        await db.update(users)
          .set({ plan: 'Premium', updatedAt: new Date() })
          .where(eq(users.uid, uid));

        return res.json({ success: true, purpose: 'premium_upgrade' });
      }

      if (orderRecord.purpose === 'doubt_question') {
        const meta = orderRecord.metadata ? JSON.parse(orderRecord.metadata) : {};
        const { subject, question, imageUrl } = meta;

        if (!subject || !question) {
          return res.status(400).json({ error: 'Doubt metadata missing subject or question text.' });
        }

        const newDoubt = await db.insert(doubts)
          .values({
            userId: uid,
            subject,
            question,
            imageUrl: imageUrl || null,
            status: 'Pending',
          })
          .returning();

        return res.status(201).json({ success: true, purpose: 'doubt_question', doubt: newDoubt[0] });
      }

      if (orderRecord.purpose === 'mentorship') {
        return res.json({ success: true, purpose: 'mentorship' });
      }

      return res.status(400).json({ error: 'Unknown payment purpose, cannot fulfill.' });
    } catch (err: any) {
      console.error('Failed to verify Razorpay payment:', err);
      res.status(500).json({ error: 'Failed to verify payment', details: err.message });
    }
  });

  // API Route: Get currently logged in user profile from SQL database
  app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const existing = await db.select().from(users).where(eq(users.uid, uid));
      if (existing.length > 0) {
        // Automatically make sure journey stats are computed/updated if they are not yet initialized
        if (existing[0].journeyProgress === null) {
          await refreshUserPassportStats(uid);
          const reloaded = await db.select().from(users).where(eq(users.uid, uid));
          return res.json({ success: true, user: reloaded[0] });
        }
        return res.json({ success: true, user: existing[0] });
      } else {
        return res.status(404).json({ error: 'User database profile not found' });
      }
    } catch (err: any) {
      console.error('Failed to get user profile:', err);
      res.status(500).json({ error: 'Database query failed', details: err.message });
    }
  });

  // API Route: Sync Firebase Authenticated User Profile
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email: tokenEmail, name: tokenName } = req.user;
    const { targetExam, academicLevel, plan, name: bodyName, email: bodyEmail } = req.body;
    const email = tokenEmail || bodyEmail;

    // CHANGED: explicit body name (from profile edits) now wins over
    // the Firebase token name. Token name is only used as a fallback
    // (e.g. first-time sync where the form hasn't sent a name yet).
    const name = bodyName || tokenName;

    const existing = await db.select().from(users).where(eq(users.uid, uid));

    if (existing.length > 0) {
      // Update user metrics
      const updated = await db.update(users)
        .set({
          email: email || existing[0].email,
          name: name || existing[0].name,
          targetExam: targetExam || existing[0].targetExam,
          classLevel: academicLevel || existing[0].classLevel,
          plan: plan || existing[0].plan,
        })
        .where(eq(users.uid, uid))
        .returning();
      return res.json({ success: true, user: updated[0] });
    } else {
      // Create new user profile record mapping exact parameters
      const inserted = await db.insert(users)
        .values({
          uid,
          email: email || '',
          name: name || 'Student',
          targetExam: targetExam || 'JEE',
          classLevel: academicLevel || 'Class 12',
          plan: plan || 'Free',
        })
        .returning();
      return res.status(201).json({ success: true, user: inserted[0] });
    }
  } catch (err: any) {
    console.error('Failed to sync user profile:', err);
    res.status(500).json({ error: 'Failed to sync user profile database record', details: err.message });
  }
});

  // API Route: Save dream college and calculate passport statistics
  app.post('/api/users/passport', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { dreamCollege } = req.body;

      if (!dreamCollege) {
        return res.status(400).json({ error: 'Missing dreamCollege parameter.' });
      }

      // Update dream college
      await db.update(users)
        .set({ dreamCollege, updatedAt: new Date() })
        .where(eq(users.uid, uid));

      // Refresh passport progress stats
      await refreshUserPassportStats(uid);

      // Fetch and return updated profile record
      const updatedUser = await db.select().from(users).where(eq(users.uid, uid));
      return res.json({ success: true, user: updatedUser[0] });
    } catch (err: any) {
      console.error('Failed to save dream college:', err);
      res.status(500).json({ error: 'Failed to update passport data.', details: err.message });
    }
  });

  // Helper functions for Mock Test Predictor
  function estimateJEEPercentile(marks: number): { percentile: number; rankMin: number; rankMax: number } {
    const m = Math.max(0, Math.min(300, marks));
    let percentile = 0;
    if (m >= 280) {
      percentile = 99.95 + ((m - 280) / 20) * 0.05;
    } else if (m >= 250) {
      percentile = 99.80 + ((m - 250) / 30) * 0.15;
    } else if (m >= 220) {
      percentile = 99.50 + ((m - 220) / 30) * 0.30;
    } else if (m >= 180) {
      percentile = 98.70 + ((m - 180) / 40) * 0.80;
    } else if (m >= 150) {
      percentile = 97.20 + ((m - 150) / 30) * 1.50;
    } else if (m >= 120) {
      percentile = 94.00 + ((m - 120) / 30) * 3.20;
    } else if (m >= 90) {
      percentile = 88.00 + ((m - 90) / 30) * 6.00;
    } else if (m >= 60) {
      percentile = 75.00 + ((m - 60) / 30) * 13.00;
    } else if (m >= 30) {
      percentile = 50.00 + ((m - 30) / 30) * 25.00;
    } else {
      percentile = (m / 30) * 50.00;
    }
    
    percentile = Math.max(0.01, Math.min(100.00, percentile));
    const candidates = 1400000;
    let exactAIR = (100 - percentile) / 100 * candidates;
    if (exactAIR < 1) exactAIR = 1;
    
    let rankMin = Math.round(exactAIR * 0.9);
    let rankMax = Math.round(exactAIR * 1.1);
    if (rankMin < 1) rankMin = 1;
    if (rankMax < 5) rankMax = 5;
    if (percentile > 99.99) {
      rankMin = 1;
      rankMax = 15;
    }
    
    return { percentile: parseFloat(percentile.toFixed(4)), rankMin, rankMax };
  }

  function estimateNEETPercentile(marks: number): { percentile: number; rankMin: number; rankMax: number } {
    const m = Math.max(0, Math.min(720, marks));
    let percentile = 0;
    if (m >= 700) {
      percentile = 99.98 + ((m - 700) / 20) * 0.02;
    } else if (m >= 680) {
      percentile = 99.93 + ((m - 680) / 20) * 0.05;
    } else if (m >= 650) {
      percentile = 99.78 + ((m - 650) / 30) * 0.15;
    } else if (m >= 600) {
      percentile = 98.60 + ((m - 600) / 50) * 1.18;
    } else if (m >= 550) {
      percentile = 96.50 + ((m - 550) / 50) * 2.10;
    } else if (m >= 500) {
      percentile = 92.50 + ((m - 500) / 50) * 4.00;
    } else if (m >= 400) {
      percentile = 78.00 + ((m - 400) / 100) * 14.50;
    } else if (m >= 300) {
      percentile = 58.50 + ((m - 300) / 100) * 19.50;
    } else {
      percentile = (m / 300) * 58.50;
    }
    
    percentile = Math.max(0.01, Math.min(100.00, percentile));
    const candidates = 2400000;
    let exactAIR = (100 - percentile) / 100 * candidates;
    if (exactAIR < 1) exactAIR = 1;
    
    let rankMin = Math.round(exactAIR * 0.92);
    let rankMax = Math.round(exactAIR * 1.08);
    if (rankMin < 1) rankMin = 1;
    if (rankMax < 5) rankMax = 5;
    if (percentile > 99.995) {
      rankMin = 1;
      rankMax = 20;
    }
    
    return { percentile: parseFloat(percentile.toFixed(4)), rankMin, rankMax };
  }

  // API Route: Save a prediction attempt manually inside PostgreSQL and compute rank prediction
  app.post('/api/predictions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { examType, physicsMarks, chemistryMarks, mathsOrBiologyMarks } = req.body;

      if (!examType || physicsMarks === undefined || chemistryMarks === undefined || mathsOrBiologyMarks === undefined) {
        return res.status(400).json({ error: 'Missing required test score parameters.' });
      }

      const pNum = Number(physicsMarks);
      const cNum = Number(chemistryMarks);
      const mbNum = Number(mathsOrBiologyMarks);

      // Validate scores based on stream
      if (examType === 'JEE Main') {
        if (pNum < 0 || pNum > 100 || cNum < 0 || cNum > 100 || mbNum < 0 || mbNum > 100) {
          return res.status(400).json({ error: 'For JEE Main, each subject score must be between 0 and 100.' });
        }
      } else if (examType === 'NEET') {
        if (pNum < 0 || pNum > 180 || cNum < 0 || cNum > 180 || mbNum < 0 || mbNum > 360) {
          return res.status(400).json({ error: 'For NEET, Physics (0-180), Chemistry (0-180) and Biology (0-360) marks must be valid.' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid exam type selected. Supported types are JEE Main and NEET.' });
      }

      const totalMarks = pNum + cNum + mbNum;
      
      // Perform percentile/rank range estimation
      const stats = examType === 'JEE Main' ? estimateJEEPercentile(totalMarks) : estimateNEETPercentile(totalMarks);
      const { percentile, rankMin, rankMax } = stats;

      // Check current number of predictions for this user. If it's >= 5, delete existing ones so we start from 1 save.
      const existing = await withDbRetry(() => db.select()
        .from(predictionHistory)
        .where(eq(predictionHistory.userId, uid)));

      if (existing.length >= 5) {
        await withDbRetry(() => db.delete(predictionHistory)
          .where(eq(predictionHistory.userId, uid)));
      }
      
      // Persist in prediction_history SQL table
      const inserted = await withDbRetry(() => db.insert(predictionHistory).values({
        userId: uid,
        examType,
        physicsMarks: pNum,
        chemistryMarks: cNum,
        mathsOrBiologyMarks: mbNum,
        totalMarks,
        predictedPercentile: percentile.toString(),
        predictedRank: `${rankMin}-${rankMax}`,
        createdAt: new Date()
      }).returning());

      // Rule-based strength/weakness synthesis
      let maxCap = examType === 'JEE Main' ? 100 : 180;
      let secondMbCap = examType === 'JEE Main' ? 100 : 360;

      const pPercent = Math.round((pNum / maxCap) * 100);
      const cPercent = Math.round((cNum / maxCap) * 100);
      const mbPercent = Math.round((mbNum / secondMbCap) * 100);

      // Evaluate subject strength
      let subjects = [
        { name: 'Physics', score: pPercent, raw: pNum },
        { name: 'Chemistry', score: cPercent, raw: cNum },
        { name: examType === 'JEE Main' ? 'Mathematics' : 'Biology', score: mbPercent, raw: mbNum }
      ];

      subjects.sort((a, b) => b.score - a.score);
      const topSubject = subjects[0];
      const weakSubject = subjects[2];

      const strengthAnalysis = `${topSubject.name} is your strongest section where you scored high (${topSubject.score}% efficiency). Maintaining this consistency while eliminating silly calculation mistakes will keep your core high.`;
      
      const weaknessDetection = `${weakSubject.name} requires intensive support. With an efficiency of ${weakSubject.score}% (${weakSubject.raw} marks), this is significantly dragging down your overall percentile. Prioritize chapter-wise PYQs from Study Yatra!`;

      // Target planner calculation
      const targetBracket = percentile >= 99 ? '99.9th Percentile' : percentile >= 95 ? '99th Percentile' : '95th Percentile';
      let marksNeeded = 0;
      if (examType === 'JEE Main') {
        if (percentile < 95) marksNeeded = Math.max(10, 135 - totalMarks);
        else if (percentile < 99) marksNeeded = Math.max(10, 195 - totalMarks);
        else marksNeeded = Math.max(10, 260 - totalMarks);
      } else {
        if (percentile < 95) marksNeeded = Math.max(15, 520 - totalMarks);
        else if (percentile < 99) marksNeeded = Math.max(15, 620 - totalMarks);
        else marksNeeded = Math.max(15, 685 - totalMarks);
      }

      const targetPlanner = `To jump to the next competitive safety tier (${targetBracket}), you need to target an additional +${marksNeeded} marks. We recommend allocating +${Math.round(marksNeeded * 0.4)} marks to ${weakSubject.name} and refining ${topSubject.name}.`;

      // High quality personalized suggestions (rule template)
      let improvementSuggestions = `1. **Strengthen High Weightages**: Dedicate 45 minutes daily to practicing High-difficulty questions of ${weakSubject.name}.
2. **Mock Strategy**: Attempt at least one major standard past paper every Saturday. Mimic exam restrictions (3 hours, absolute silence).
3. **Accuracy Drill**: Keep a separate handbook for error records. Write down why you missed each question (did you miscalculate, forget formula, or make a reading mistake?).`;

      // Enhance with AI if premium capabilities are present/loaded
      let aiMentorship = '';
      if (process.env.GEMINI_API_KEY) {
        try {
          const prompt = `You are an elite IIT-JEE and NEET national mentor on the platform "Study Yatra".
A student has scored the following marks in a standard mock test representation:
- Exam: ${examType}
- Physics: ${pNum}/${maxCap}
- Chemistry: ${cNum}/${maxCap}
- ${examType === 'JEE Main' ? 'Mathematics' : 'Biology'}: ${mbNum}/${secondMbCap}
- Total: ${totalMarks}
- Predicted Percentile: ${percentile}%
- Predicted Rank Range: ${rankMin} - ${rankMax}

Provide a concise, ultra-professional, and highly encouraging Study Plan and Revision Roadmap in pure English. 
Use markdown bullets, state exact target chapters to prioritize based on standard high-weightage topics, and give practical tips for ${weakSubject.name} specifically. Keep it crisp, highly action-oriented, and extremely motivating.`;

          let response = null;
          let aiSuccess = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt
              });
              aiSuccess = true;
              break;
            } catch (aiErr: any) {
              const code = aiErr.status || aiErr.code || (aiErr.error?.code) || 0;
              const errMsg = String(aiErr.message || aiErr);
              const isTransient = code === 503 || code === 429 || errMsg.includes('503') || errMsg.includes('demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('unavailable');
              
              if (isTransient && attempt < 3) {
                const backoff = attempt * 1000;
                console.warn(`[GEMINI RETRY] API transient failure on attempt ${attempt} (Status/Code: ${code}). Retrying in ${backoff}ms...`);
                await new Promise((resolve) => setTimeout(resolve, backoff));
                continue;
              }
              throw aiErr;
            }
          }

          if (aiSuccess && response?.text) {
            aiMentorship = response.text;
          }
        } catch (aiErr) {
          console.error("Gemini premium prediction mentor suggestions failed:", aiErr);
        }
      }

      return res.status(201).json({
        success: true,
        prediction: inserted[0],
        analytics: {
          strengthAnalysis,
          weaknessDetection,
          targetPlanner,
          improvementSuggestions,
          aiMentorship: aiMentorship || null
        }
      });
    } catch (err: any) {
      console.error('Failed to calculate mock prediction:', err);
      res.status(500).json({ error: 'Failed to process mock predictions.', details: err.message });
    }
  });

  // API Route: Get all prediction attempts for the logged-in student to compare progress over time
  app.get('/api/predictions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      
      const records = await withDbRetry(() => db.select()
        .from(predictionHistory)
        .where(eq(predictionHistory.userId, uid))
        .orderBy(desc(predictionHistory.createdAt)));

      return res.json({ success: true, history: records });
    } catch (err: any) {
      console.error('Failed to get prediction history:', err);
      res.status(500).json({ error: 'Failed to load prediction history', details: err.message });
    }
  });

  // API Route: Delete all prediction attempts for the logged-in student
  app.delete('/api/predictions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      
      await withDbRetry(() => db.delete(predictionHistory)
        .where(eq(predictionHistory.userId, uid)));

      return res.json({ success: true, message: 'Prediction history cleared successfully' });
    } catch (err: any) {
      console.error('Failed to clear prediction history:', err);
      res.status(500).json({ error: 'Failed to clear prediction history', details: err.message });
    }
  });

  // --- PIT STOPS PREMIUM BOOKMARKING SYSTEM ENDPOINTS ---

  // GET: Fetch all user created Pit Stops with questions list
  app.get('/api/pit-stops', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;

      const stops = await withDbRetry(() => db.select()
        .from(pitStops)
        .where(eq(pitStops.userId, uid))
        .orderBy(desc(pitStops.createdAt)));

      const stopIds = stops.map(s => s.id);
      const questionsMap: Record<number, any[]> = {};

      if (stopIds.length > 0) {
        const relations = await withDbRetry(() => db.select({
          id: pitStopQuestions.id,
          pitStopId: pitStopQuestions.pitStopId,
          questionId: pitStopQuestions.questionId,
          createdAt: pitStopQuestions.createdAt,
          questionText: questions.questionText,
          subject: questions.subject,
          chapter: questions.chapter,
          year: questions.year,
          difficulty: questions.difficulty,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
          correctAnswer: questions.correctAnswer,
          explanation: questions.explanation,
        })
        .from(pitStopQuestions)
        .innerJoin(questions, eq(pitStopQuestions.questionId, questions.id))
        .where(inArray(pitStopQuestions.pitStopId, stopIds)));

        relations.forEach(r => {
          if (!questionsMap[r.pitStopId]) {
            questionsMap[r.pitStopId] = [];
          }
          questionsMap[r.pitStopId].push(r);
        });
      }

      const stopsWithStats = stops.map(stop => ({
        ...stop,
        questionCount: questionsMap[stop.id]?.length || 0,
        questions: questionsMap[stop.id] || [],
      }));

      return res.json({ success: true, pitStops: stopsWithStats });
    } catch (err: any) {
      console.error('Failed to load pit stops:', err);
      res.status(500).json({ error: 'Failed to load pit stops', details: err.message });
    }
  });

  // POST: Create a new pit stop collection
  app.post('/api/pit-stops', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required for a Pit Stop Collection.' });
      }

      const inserted = await withDbRetry(() => db.insert(pitStops).values({
        userId: uid,
        title,
        description: description || '',
      }).returning());

      return res.status(201).json({ success: true, pitStop: { ...inserted[0], questionCount: 0, questions: [] } });
    } catch (err: any) {
      console.error('Failed to create pit stop:', err);
      res.status(500).json({ error: 'Failed to create pit stop', details: err.message });
    }
  });

  // PUT: Rename / edit a pit stop collection
  app.put('/api/pit-stops/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { id } = req.params;
      const { title, description } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title cannot be empty.' });
      }

      const updated = await withDbRetry(() => db.update(pitStops)
        .set({ title, description: description || '' })
        .where(and(eq(pitStops.id, Number(id)), eq(pitStops.userId, uid)))
        .returning());

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Pit stop not found or access unauthorized.' });
      }

      return res.json({ success: true, pitStop: updated[0] });
    } catch (err: any) {
      console.error('Failed to update pit stop:', err);
      res.status(500).json({ error: 'Failed to update pit stop', details: err.message });
    }
  });

  // DELETE: Remove a pit stop collection completely
  app.delete('/api/pit-stops/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { id } = req.params;

      // 1. Delete all related records from stopover_questions (pit_stop_questions)
      await withDbRetry(() => db.delete(pitStopQuestions)
        .where(eq(pitStopQuestions.pitStopId, Number(id))));

      // 2. Delete the Stopover from stopovers (pit_stops)
      const deleted = await withDbRetry(() => db.delete(pitStops)
        .where(and(eq(pitStops.id, Number(id)), eq(pitStops.userId, uid)))
        .returning());

      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Pit stop not found or access unauthorized.' });
      }

      return res.json({ success: true, message: 'Pit stop collection successfully deleted.' });
    } catch (err: any) {
      console.error('Failed to delete pit stop:', err);
      res.status(500).json({ error: 'Failed to delete pit stop', details: err.message });
    }
  });

  // POST: Add a question to a pit stop collection
  app.post('/api/pit-stops/:id/questions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { id } = req.params;
      const { questionId } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: 'questionId is required.' });
      }

      // Verify the pit stop is owned by the current user
      const stop = await withDbRetry(() => db.select()
        .from(pitStops)
        .where(and(eq(pitStops.id, Number(id)), eq(pitStops.userId, uid)))
        .limit(1));

      if (stop.length === 0) {
        return res.status(404).json({ error: 'Pit stop not found or access unauthorized.' });
      }

      // Check if question is already inside the pit stop
      const existing = await withDbRetry(() => db.select()
        .from(pitStopQuestions)
        .where(and(
          eq(pitStopQuestions.pitStopId, Number(id)),
          eq(pitStopQuestions.questionId, Number(questionId))
        ))
        .limit(1));

      if (existing.length > 0) {
        return res.json({ success: true, message: 'Question already inside this Pit Stop collection!' });
      }

      const inserted = await withDbRetry(() => db.insert(pitStopQuestions).values({
        pitStopId: Number(id),
        questionId: Number(questionId),
      }).returning());

      return res.status(201).json({ success: true, addedQuestion: inserted[0] });
    } catch (err: any) {
      console.error('Failed to add question to pit stop:', err);
      res.status(500).json({ error: 'Failed to add question to pit stop', details: err.message });
    }
  });

  // DELETE: Remove a question from a pit stop collection
  app.delete('/api/pit-stops/:id/questions/:questionId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { id, questionId } = req.params;

      // Verify ownership
      const stop = await withDbRetry(() => db.select()
        .from(pitStops)
        .where(and(eq(pitStops.id, Number(id)), eq(pitStops.userId, uid)))
        .limit(1));

      if (stop.length === 0) {
        return res.status(404).json({ error: 'Pit stop not found or access unauthorized.' });
      }

      await withDbRetry(() => db.delete(pitStopQuestions)
        .where(and(
          eq(pitStopQuestions.pitStopId, Number(id)),
          eq(pitStopQuestions.questionId, Number(questionId))
        )));

      return res.json({ success: true, message: 'Question removed from Pit Stop collection.' });
    } catch (err: any) {
      console.error('Failed to remove question from pit stop:', err);
      res.status(500).json({ error: 'Failed to remove question from pit stop', details: err.message });
    }
  });

  // API Route: Parse CSV Content & Validate Questions
  app.post('/api/questions/parse-preview', async (req, res) => {
    try {
      const { csvText } = req.body;
      if (!csvText) {
        return res.status(400).json({ error: 'No CSV content provided.' });
      }

      // Simple CSV parsing accommodating commas, quotes, and newlines
      const lines: string[] = [];
      let currentLine = '';
      let insideQuote = false;

      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === '\n' && !insideQuote) {
          lines.push(currentLine.trim());
          currentLine = '';
          continue;
        }
        currentLine += char;
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      const headers = parseCSVLine(lines[0] || '');
      const list: any[] = [];
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const columns = parseCSVLine(lines[i]);
        const rowData: Record<string, string> = {};
        
        headers.forEach((header, idx) => {
          const cleanHeader = header.toLowerCase().trim().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          rowData[cleanHeader] = (columns[idx] || '').trim();
        });

        // Ensure we support both snake_case headers mapped to correct properties
        const questionObj = {
          examType: rowData.examType || rowData.exam_type || '',
          classLevel: rowData.classLevel || rowData.class_level || '',
          subject: rowData.subject || '',
          chapter: rowData.chapter || '',
          year: rowData.year || '',
          questionText: rowData.questionText || rowData.question_text || '',
          optionA: rowData.optionA || rowData.option_a || '',
          optionB: rowData.optionB || rowData.option_b || '',
          optionC: rowData.optionC || rowData.option_c || '',
          optionD: rowData.optionD || rowData.option_d || '',
          correctAnswer: (rowData.correctAnswer || rowData.correct_answer || '').toUpperCase(),
          explanation: rowData.explanation || '',
          difficulty: rowData.difficulty || 'Medium',
        };

        // Custom inline validation checks on fields
        const isValid = !!(
          questionObj.examType &&
          questionObj.classLevel &&
          questionObj.subject &&
          questionObj.chapter &&
          questionObj.year &&
          questionObj.questionText &&
          questionObj.optionA &&
          questionObj.optionB &&
          questionObj.optionC &&
          questionObj.optionD &&
          ['A', 'B', 'C', 'D'].includes(questionObj.correctAnswer)
        );

        if (isValid) {
          validCount++;
        } else {
          invalidCount++;
        }

        list.push({ ...questionObj, isValid });
      }

      res.json({
        total: list.length,
        valid: validCount,
        invalid: invalidCount,
        questions: list
      });
    } catch (err: any) {
      console.error('Failed to analyze/parse CSV questions:', err);
      res.status(500).json({ error: 'Failed to analyze/parse CSV questions', details: err.message });
    }
  });

  // API Route: Bulk Commit Validated Questions to PostgreSQL
  app.post('/api/questions/import-commit', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { questionsList } = req.body;
      if (!Array.isArray(questionsList) || questionsList.length === 0) {
        return res.status(400).json({ error: 'No questions provided for database write commit.' });
      }

      console.log(`Writing ${questionsList.length} questions into local PostgreSQL database...`);

      const inserted = [];
      // Insert in chunks or loop to map all attributes safely
      for (const q of questionsList) {
        const item = await db.insert(questions)
          .values({
            examType: q.examType || 'JEE',
            classLevel: q.classLevel || 'Class 12',
            subject: q.subject || 'Physics',
            chapter: q.chapter || 'Units and Measurements',
            year: String(q.year || '2026'),
            session: q.session || null,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            difficulty: q.difficulty || 'Medium',
            imageUrl: q.imageUrl || null,
          })
          .returning();
        inserted.push(item[0]);
      }

      res.status(201).json({
        success: true,
        count: inserted.length,
        message: `Successfully imported ${inserted.length} questions into PostgreSQL db!`
      });
    } catch (err: any) {
      console.error('Failed to commit bulk imported questions:', err);
      res.status(500).json({ error: 'Failed to write CSV/PDF material questions to database', details: err.message });
    }
  });

  // API Route: Retrieve Chapter wise Questions directly from PostgreSQL
  app.get('/api/questions', async (req, res) => {
    try {
      const { examType, subject, chapter, session, year, all } = req.query;

      let dbQuestions;

      if (all === 'true' || (!examType && !subject && !chapter)) {
        dbQuestions = await db.select().from(questions).orderBy(desc(questions.createdAt));
      } else {
        // Build conditional where query array
        const conditions = [
          eq(questions.examType, String(examType)),
          eq(questions.subject, String(subject)),
          eq(questions.chapter, String(chapter))
        ];

        if (session && session !== 'All' && session !== 'All Attempts' && session !== 'All Sessions') {
          conditions.push(eq(questions.session, String(session)));
        }

        if (year && year !== 'All') {
          conditions.push(eq(questions.year, String(year)));
        }

        dbQuestions = await db.select()
          .from(questions)
          .where(and(...conditions))
          .orderBy(desc(questions.createdAt));
      }

      // Map relational columns to the specific types.ts structure required by client
      const formattedQuestions = dbQuestions.map((q: any) => ({
        id: String(q.id),
        chapterId: `${q.examType.toLowerCase()}-${q.subject.toLowerCase()}-class-${q.classLevel.toLowerCase().replace(/\s+/g, '-')}-${q.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        examType: q.examType,
        subject: q.subject,
        year: Number(q.year) || 2024,
        session: q.session || (q.examType === 'JEE' ? 'January' : q.examType),
        examDate: q.examDate || null,
        questionText: q.questionText,
        options: {
          A: q.optionA,
          B: q.optionB,
          C: q.optionC,
          D: q.optionD
        },
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        concept: q.chapter + " Concept Drill",
        difficulty: q.difficulty,
        imageUrl: q.imageUrl || null
      }));

      res.json(formattedQuestions);
    } catch (err: any) {
      console.error('Failed to query questions:', err);
      res.status(500).json({ error: 'Failed to load matching questions from PostgreSQL', details: err.message });
    }
  });

  // API Route: Insert single question
  app.post('/api/questions/single', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const q = req.body;
      if (!q.questionText || !q.optionA || !q.correctAnswer) {
        return res.status(400).json({ error: 'Missing required question fields.' });
      }

      const item = await db.insert(questions)
        .values({
          examType: q.examType || 'JEE',
          classLevel: q.classLevel || 'Class 12',
          subject: q.subject || 'Physics',
          chapter: q.chapter || 'Units and Measurements',
          year: String(q.year || '2026'),
          session: q.session || (q.examType === 'JEE' ? 'January' : q.examType),
          examDate: q.examDate || null,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          difficulty: q.difficulty || 'Medium',
          imageUrl: q.imageUrl || null,
        })
        .returning();

      const created = {
        id: String(item[0].id),
        chapterId: `${item[0].examType.toLowerCase()}-${item[0].subject.toLowerCase()}-class-${item[0].classLevel.toLowerCase().replace(/\s+/g, '-')}-${item[0].chapter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        examType: item[0].examType as any,
        subject: item[0].subject as any,
        year: Number(item[0].year) || 2024,
        session: item[0].session || (item[0].examType === 'JEE' ? 'January' : item[0].examType),
        examDate: item[0].examDate || null,
        questionText: item[0].questionText,
        options: {
          A: item[0].optionA,
          B: item[0].optionB,
          C: item[0].optionC,
          D: item[0].optionD
        },
        correctAnswer: item[0].correctAnswer as 'A' | 'B' | 'C' | 'D',
        explanation: item[0].explanation || '',
        concept: item[0].chapter + " Concept Drill",
        difficulty: item[0].difficulty as 'Easy' | 'Medium' | 'Hard',
        imageUrl: item[0].imageUrl || undefined
      };

      res.status(201).json(created);
    } catch (err: any) {
      console.error('Failed to insert single question:', err);
      res.status(500).json({ error: 'Failed to insert single question' });
    }
  });

  // API Route: Get single question by ID
  app.get('/api/questions/:id', async (req, res) => {
    try {
      const qId = Number(req.params.id);
      if (isNaN(qId)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }
      const item = await db.select().from(questions).where(eq(questions.id, qId)).limit(1);
      if (item.length === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }
      const q = item[0];
      const formatted = {
        id: String(q.id),
        chapterId: `${q.examType.toLowerCase()}-${q.subject.toLowerCase()}-class-${q.classLevel.toLowerCase().replace(/\s+/g, '-')}-${q.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        examType: q.examType,
        subject: q.subject,
        year: Number(q.year) || 2024,
        session: q.session || (q.examType === 'JEE' ? 'January' : q.examType),
        examDate: q.examDate || null,
        questionText: q.questionText,
        options: {
          A: q.optionA,
          B: q.optionB,
          C: q.optionC,
          D: q.optionD
        },
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        concept: q.chapter + " Concept Drill",
        difficulty: q.difficulty,
        imageUrl: q.imageUrl || undefined
      };
      res.json(formatted);
    } catch (err: any) {
      console.error('Failed to get question by id:', err);
      res.status(500).json({ error: 'Failed to find question from PostgreSQL', details: err.message });
    }
  });

  // API Route: Delete single question
  app.delete('/api/questions/:id', async (req, res) => {
    try {
      const qId = Number(req.params.id);
      if (isNaN(qId)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }

      await db.delete(questions).where(eq(questions.id, qId));
      res.json({ success: true, message: `Successfully deleted question ${qId}` });
    } catch (err: any) {
      console.error('Failed to delete question:', err);
      res.status(500).json({ error: 'Failed to delete question from DB' });
    }
  });

  // API Route: Save attempt records matching User constraints
  app.post('/api/attempts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { questionId, selectedAnswer, correct } = req.body;

      if (!questionId || !selectedAnswer) {
        return res.status(400).json({ error: 'Missing questionId or selectedAnswer parameters.' });
      }

      const parsedQuestionId = Number(questionId);
      if (isNaN(parsedQuestionId)) {
        return res.status(400).json({ error: 'Invalid questionId — must be a numeric database ID.' });
      }

      const attemptRecord = await db.insert(attempts)
        .values({
          userId: uid,
          questionId: parsedQuestionId,
          selectedAnswer,
          isCorrect: Boolean(correct),
        })
        .returning();

      // Calculate/Update Streak record
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const existingStreak = await db.select().from(streaks).where(eq(streaks.userId, uid));
        
        if (existingStreak.length > 0) {
          const currentRec = existingStreak[0];
          let currentStreak = currentRec.currentStreak;
          let longestStreak = currentRec.longestStreak;
          let lastActiveDate = currentRec.lastActiveDate;
          
          if (lastActiveDate !== todayStr) {
            if (lastActiveDate === yesterdayStr) {
              currentStreak += 1;
              if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
              }
            } else {
              // Broken streak, reset to 1
              currentStreak = 1;
            }
            lastActiveDate = todayStr;
            
            await db.update(streaks)
              .set({ currentStreak, longestStreak, lastActiveDate })
              .where(eq(streaks.userId, uid));
          }
        } else {
          // Create initial streak
          await db.insert(streaks)
            .values({
              userId: uid,
              currentStreak: 1,
              longestStreak: 1,
              lastActiveDate: todayStr,
            });
        }
      } catch (streakErr) {
        console.error('Streak update failed:', streakErr);
      }

      // Automatically recalculate passport metrics when a student submits an answer
      try {
        await refreshUserPassportStats(uid);
      } catch (passportErr) {
        console.error('Deferred passport stats update failed:', passportErr);
      }

      res.status(201).json({ success: true, attempt: attemptRecord[0] });
    } catch (err: any) {
      console.error('Failed to register question attempt:', err);
      res.status(500).json({ error: 'Failed to record student practice attempt', details: err.message });
    }
  });

  // API Route: Calculate student analytics metrics directly from SQL
  app.get('/api/stats', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;

      // 1. Total Solved attempts
      const totalAttempts = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(eq(attempts.userId, uid));

      const totalSolved = totalAttempts[0]?.count || 0;

      // 2. Correct count & accuracy %
      const correctAttempts = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, uid),
            eq(attempts.isCorrect, true)
          )
        );

      const correctCount = correctAttempts[0]?.count || 0;
      const overallAccuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

      // 3. Daily Goal Progress (Attempts today in UTC date boundaries)
      const todayFormattedStr = new Date().toISOString().split('T')[0];
      const todayAttempts = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, uid),
            sql`DATE(${attempts.attemptedAt}) = ${todayFormattedStr}`
          )
        );

      const todayGoalProgress = todayAttempts[0]?.count || 0;

      // 4. Favorite subject analyzed from attempts linked to questions
      const subjectAnalysis = await db.select({
        subject: questions.subject,
        count: sql<number>`count(*)::int`
      })
      .from(attempts)
      .innerJoin(questions, eq(attempts.questionId, questions.id))
      .where(eq(attempts.userId, uid))
      .groupBy(questions.subject)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

      const favSubject = subjectAnalysis[0]?.subject || 'Physics';

      // 5. Recently Practiced unique chapters solved in last recordings
      const recentAttempts = await db.select({
        chapter: questions.chapter
      })
      .from(attempts)
      .innerJoin(questions, eq(attempts.questionId, questions.id))
      .where(eq(attempts.userId, uid))
      .orderBy(desc(attempts.attemptedAt))
      .limit(10);

      const recentlyPracticed = Array.from(new Set(recentAttempts.map(a => a.chapter))).slice(0, 4);

      // 6. Streaks table query
      const streakSelect = await db.select().from(streaks).where(eq(streaks.userId, uid));
      const currentStreak = streakSelect[0]?.currentStreak || 0;
      const longestStreak = streakSelect[0]?.longestStreak || 0;

      // 7. Solved this week from database
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekAttempts = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, uid),
            sql`${attempts.attemptedAt} >= ${sevenDaysAgo}`
          )
        );
      
      const solvedThisWeek = weekAttempts[0]?.count || 0;

      res.json({
        solvedToday: todayGoalProgress,
        solvedThisWeek,
        currentStreak,
        longestStreak,
        totalSolved,
        overallAccuracy,
        todayGoalProgress,
        favSubject,
        recentlyPracticed: recentlyPracticed.length > 0 ? recentlyPracticed : ['Units and Measurements']
      });
    } catch (err: any) {
      console.error('Failed to compute dashboard metrics:', err);
      res.status(500).json({ error: 'Failed to fetch student dashboard statistics', details: err.message });
    }
  });

  // API Route: Get doubts list
  app.get('/api/doubts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      
      const userRec = await db.select().from(users).where(eq(users.uid, uid));
      const isAdmin = userRec[0]?.plan === 'Admin' || userRec[0]?.name?.toLowerCase().includes('admin');
      
      let doubtsList;
      if (isAdmin) {
        doubtsList = await db.select().from(doubts).orderBy(desc(doubts.createdAt));
      } else {
        doubtsList = await db.select().from(doubts).where(eq(doubts.userId, uid)).orderBy(desc(doubts.createdAt));
      }
      
      const mapped = doubtsList.map(d => ({
        id: String(d.id),
        studentName: userRec[0]?.name || 'Student',
        doubtText: d.question,
        subject: d.subject,
        imageUrl: d.imageUrl || undefined,
        timestamp: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
        replyText: d.replyText || (d.status === 'resolved' || d.status === 'Replied' ? 'Resolved by Expert Educator' : undefined),
        replyVideoUrl: d.replyVideoUrl || undefined,
        replyTimestamp: d.replyTimestamp ? d.replyTimestamp.toISOString() : undefined,
        status: d.status === 'resolved' || d.status === 'Replied' ? 'Replied' : 'Pending'
      }));
      
      res.json(mapped);
    } catch (err: any) {
      console.error('Failed to query doubts:', err);
      res.status(500).json({ error: 'Failed to fetch doubts', details: err.message });
    }
  });

  // API Route: Post user doubt
  app.post('/api/doubts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { subject, question, imageUrl } = req.body;
      
      if (!subject || !question) {
        return res.status(400).json({ error: 'subject and question are required' });
      }
      
      const newDoubt = await db.insert(doubts)
        .values({
          userId: uid,
          subject,
          question,
          imageUrl: imageUrl || null,
          status: 'Pending'
        })
        .returning();
        
      res.status(201).json({ success: true, doubt: newDoubt[0] });
    } catch (err: any) {
      console.error('Failed to create doubt:', err);
      res.status(500).json({ error: 'Failed to save doubt', details: err.message });
    }
  });

  // API Route: Reply to doubt
  app.post('/api/doubts/:id/reply', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { replyText, replyVideoUrl } = req.body;
      
      const updated = await db.update(doubts)
        .set({
          status: 'Replied',
          replyText: replyText || 'Resolved by Expert Educator',
          replyVideoUrl: replyVideoUrl || null,
          replyTimestamp: new Date()
        })
        .where(eq(doubts.id, Number(id)))
        .returning();
        
      res.json({ success: true, doubt: updated[0] });
    } catch (err: any) {
      console.error('Failed to reply to doubt:', err);
      res.status(500).json({ error: 'Failed to reply to doubt', details: err.message });
    }
  });

  // API Route: Get all custom chapter images
  app.get('/api/chapter-images', async (req, res) => {
    try {
      const list = await db.select().from(chapterImages);
      res.json(list);
    } catch (err: any) {
      console.error('Failed to get chapter images:', err);
      res.status(500).json({ error: 'Failed to retrieve chapter images', details: err.message });
    }
  });

  // API Route: Upsert a custom chapter image
  app.post('/api/chapter-images/upsert', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { classLevel, subject, chapterName, imageUrl } = req.body;
      if (!classLevel || !subject || !chapterName) {
        return res.status(400).json({ error: 'Missing classLevel, subject, or chapterName' });
      }

      // Check if there is already an image mapping for this exact key
      const existing = await db.select()
        .from(chapterImages)
        .where(
          and(
            eq(chapterImages.classLevel, String(classLevel)),
            eq(chapterImages.subject, String(subject)),
            eq(chapterImages.chapterName, String(chapterName))
          )
        );

      if (existing.length > 0) {
        const updated = await db.update(chapterImages)
          .set({
            imageUrl: String(imageUrl || ''),
            updatedAt: new Date()
          })
          .where(eq(chapterImages.id, existing[0].id))
          .returning();
        return res.json({ success: true, data: updated[0] });
      } else {
        const inserted = await db.insert(chapterImages)
          .values({
            classLevel: String(classLevel),
            subject: String(subject),
            chapterName: String(chapterName),
            imageUrl: String(imageUrl || '')
          })
          .returning();
        return res.status(201).json({ success: true, data: inserted[0] });
      }
    } catch (err: any) {
      console.error('Failed to upsert chapter image:', err);
      res.status(500).json({ error: 'Failed to save chapter image', details: err.message });
    }
  });

  // API Route: AI PDF smart extraction & structured parsing using Gemini
  app.post('/api/pdf/parse', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { pdfBase64, chaptersList } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: 'No PDF file data provided in request.' });
      }

      console.log('Invoking Groq (llama-3.3-70b-versatile) to structure PDF document question details with strict criteria...');

      const chatPrompt = `Analyze the provided PDF document and extract all Multiple Choice Questions (MCQs) found within.
For each question, accurately extract or identify the following fields:
- questionText (the exact question body)
- optionA, optionB, optionC, optionD (the four options)
- correctAnswer (MUST be strictly one of A, B, C, or D)
- explanation (CRITICAL: Look for and extract the detailed explanation, solution, or hint if it is printed inside the PDF for this question. If there is NO explanation/solution explicitly provided in the PDF for this question, set this field to null or an empty string.)
- year (extract the exam year, e.g. 2024, 2023, 2022 if mentioned in the document, else default to "2024")
- examType (strictly identify or recommend as "JEE", "NEET", or "CBSE")
- session (strictly identify based on PDF context: For JEE, look for "January Attempt" vs "April Attempt" context markers or months, and return "January" or "April". If NEET, return "NEET". If CBSE, return "CBSE". Default to "January" for JEE if no month is found.)
- classLevel (recommend "Class 11", "Class 12", or "Dropper")
- subject (strictly e.g. "Physics", "Chemistry", "Mathematics", "Botany", "Zoology", or "Biology")
- chapter (suggest the closest matching chapter name from this context list of available chapters: ${JSON.stringify(chaptersList || [])})
- difficulty (estimate as "Easy", "Medium", or "Hard")

Return the result as a strict, valid JSON array containing objects matching this schema exactly. Do not output markdown backticks or any conversational text. Only valid JSON.`;

      const geminiApiKey = process.env.GEMINI_API_KEY;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

      const geminiBody = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: pdfBase64,
                }
              },
              {
                text: chatPrompt + '\n\nRespond with valid JSON only - no markdown, no backticks, no extra text.'
              }
            ]
          }
        ]
      };

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });

      if (!geminiRes.ok) {
        const errBody = await geminiRes.text();
        throw new Error(`Gemini API error ${geminiRes.status}: ${errBody}`);
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const cleanText = rawText.replace(/```json|```/g, '').trim();
      const parsedQuestions = JSON.parse(cleanText);

      res.json({
        success: true,
        count: parsedQuestions.length,
        questions: parsedQuestions
      });
    } catch (err: any) {
      console.error('AI PDF parsing execution failed:', err);
      res.status(500).json({ error: 'AI PDF Parsing service failed to extract questions. Please ensure the PDF has readable text options or try again.', details: err.message });
    }
  });


  // Helper to sync / seed initial daily dose records if they're empty
  const seedDailyDoseIfNeeded = async () => {
    try {
      const existing = await db.select().from(dailyDose).limit(1);
      if (existing.length === 0) {
        console.log("Seeding default Study Yatra Daily Dose questions...");
        const todayStr = new Date().toISOString().split('T')[0];
        
        await db.insert(dailyDose).values([
          {
            date: todayStr,
            examType: "JEE",
            subject: "Physics",
            question: "An object is thrown vertically upwards with a velocity of 20 m/s. What is the maximum height reached by the object? (Take g = 10 m/s²)",
            optionA: "10 m",
            optionB: "15 m",
            optionC: "20 m",
            optionD: "25 m",
            correctAnswer: "C",
            explanation: "Using third equation of motion: v² = u² - 2gh. At maximum height, final velocity v = 0. Therefore, 0 = 20² - 2(10)h => 20h = 400 => h = 20 meters.",
            correctMotivationMessage: "Outstanding! Your physics mechanics is solid. Agli rank aapki hi hai! 🎯",
            wrongMotivationMessage: "Koi baat nahi! Remember: v² = u² - 2gh. Speed up your mechanics revision, champion! 📚",
            publishDate: todayStr,
            status: "Active"
          },
          {
            date: todayStr,
            examType: "NEET",
            subject: "Botany",
            question: "Which of the following cell organelles is responsible for synthesizing proteins in eukaryotic and prokaryotic cells?",
            optionA: "Mitochondria",
            optionB: "Ribosomes",
            optionC: "Lysosomes",
            optionD: "Golgi apparatus",
            correctAnswer: "B",
            explanation: "Ribosomes are universally known as the protein factories. They translate mRNA codons into dynamic peptide chains in both eukaryotic and prokaryotic cells.",
            correctMotivationMessage: "Superb! Cytology is extremely high weightage for NEET. 360/360 in Biology loaded! 🧬",
            wrongMotivationMessage: "Don't fret! Ribosomes translate RNA into protein. Mark cell organelles for immediate revision. 📚",
            publishDate: todayStr,
            status: "Active"
          },
          {
            date: todayStr,
            examType: "CBSE",
            subject: "Chemistry",
            question: "What is the common industrial name of Calcium Oxychloride (CaOCl₂)?",
            optionA: "Baking Soda",
            optionB: "Bleaching Powder",
            optionC: "Washing Soda",
            optionD: "Plaster of Paris",
            correctAnswer: "B",
            explanation: "Chemical formula CaOCl₂ represents Bleaching Powder, which is produced industrially by reacting slaked lime with chlorine gas.",
            correctMotivationMessage: "Perfect! Accurate CBSE Chemistry concept memory. Board exams topper streak! 🎓",
            wrongMotivationMessage: "Revision checkpoint! CaOCl₂ is bleaching powder. Keep practicing to master acids, bases and salts! 📚",
            publishDate: todayStr,
            status: "Active"
          }
        ]);
        console.log("Study Yatra Daily Dose seed successfully loaded.");
      }
    } catch (e) {
      console.error("Error during Daily Dose seeding:", e);
    }
  };

  // Seed right away
  await seedDailyDoseIfNeeded();

  // API Route: Get today's Daily Dose base configuration
  app.get('/api/daily-dose/today', async (req, res) => {
    try {
      const targetExam = String(req.query.targetExam || 'JEE');
      let userId = String(req.query.userId || 'guest');

      // Check for real credentials inside request token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          if (token && token !== 'null') {
            if (token.startsWith('mock-bypass-')) {
              const b64Data = token.substring('mock-bypass-'.length);
              const decodedPayload = JSON.parse(Buffer.from(b64Data, 'base64').toString('utf-8'));
              userId = decodedPayload.uid || userId;
            } else {
              const decodedToken = await adminAuth.verifyIdToken(token);
              if (decodedToken && decodedToken.uid) {
                userId = decodedToken.uid;
              }
            }
          }
        } catch (authErr) {
          // Token invalid or expired bypass
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Query database for our active daily-dose targeting the specified exam
      let list = await db.select()
        .from(dailyDose)
        .where(
          and(
            eq(dailyDose.examType, targetExam),
            eq(dailyDose.status, "Active"),
            eq(dailyDose.date, todayStr)
          )
        );

      if (list.length === 0) {
        // Fallback to the latest active daily dose question for this exam structure
        list = await db.select()
          .from(dailyDose)
          .where(
            and(
              eq(dailyDose.examType, targetExam),
              eq(dailyDose.status, "Active")
            )
          )
          .orderBy(desc(dailyDose.date))
          .limit(1);
      }

      if (list.length === 0) {
        return res.json({ question: null, completed: false });
      }

      const question = list[0];

      // Retrieve if user has already solved this question
      const existingAttempt = await db.select()
        .from(dailyDoseAttempts)
        .where(
          and(
            eq(dailyDoseAttempts.dailyDoseId, question.id),
            eq(dailyDoseAttempts.userId, userId)
          )
        )
        .orderBy(desc(dailyDoseAttempts.createdAt))
        .limit(1);

      if (existingAttempt.length > 0) {
        return res.json({
          question,
          completed: true,
          attempt: existingAttempt[0]
        });
      }

      return res.json({
        question,
        completed: false,
        attempt: null
      });
    } catch (err: any) {
      console.error('Failed to query daily dose question:', err);
      res.status(500).json({ error: 'Failed to find daily dose config', details: err.message });
    }
  });

  // API Route: Record daily dose challenge attempt
  app.post('/api/daily-dose/attempt', async (req, res) => {
    try {
      const { dailyDoseId, answer } = req.body;
      let userId = String(req.body.userId || 'guest');

      if (!dailyDoseId || !answer) {
        return res.status(400).json({ error: 'Missing dailyDoseId or answer selection.' });
      }

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          if (token && token !== 'null') {
            if (token.startsWith('mock-bypass-')) {
              const b64Data = token.substring('mock-bypass-'.length);
              const decodedPayload = JSON.parse(Buffer.from(b64Data, 'base64').toString('utf-8'));
              userId = decodedPayload.uid || userId;
            } else {
              const decodedToken = await adminAuth.verifyIdToken(token);
              if (decodedToken && decodedToken.uid) {
                userId = decodedToken.uid;
              }
            }
          }
        } catch (authErr) {
          // Fallback on token decode failure
        }
      }

      const doseList = await db.select().from(dailyDose).where(eq(dailyDose.id, dailyDoseId));
      if (doseList.length === 0) {
        return res.status(404).json({ error: 'Daily dose question record not found' });
      }

      const question = doseList[0];
      const normalizedResponse = String(answer).trim().toUpperCase();
      const correctChoice = String(question.correctAnswer).trim().toUpperCase();
      const isCorrect = normalizedResponse === correctChoice;

      // Ensure single submission entry
      const existing = await db.select()
        .from(dailyDoseAttempts)
        .where(
          and(
            eq(dailyDoseAttempts.dailyDoseId, dailyDoseId),
            eq(dailyDoseAttempts.userId, userId)
          )
        );

      let attemptItem;
      if (existing.length > 0) {
        attemptItem = existing[0];
      } else {
        const inserted = await db.insert(dailyDoseAttempts)
          .values({
            dailyDoseId,
            userId,
            answer: normalizedResponse,
            correct: isCorrect
          })
          .returning();
        attemptItem = inserted[0];
      }

      // Record streak increments if logged-in user participates
      if (userId !== 'guest') {
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const existingStreak = await db.select().from(streaks).where(eq(streaks.userId, userId));
          if (existingStreak.length > 0) {
            const currentRec = existingStreak[0];
            let currentStreak = currentRec.currentStreak;
            let longestStreak = currentRec.longestStreak;
            let lastActiveDate = currentRec.lastActiveDate;

            if (lastActiveDate !== todayStr) {
              if (lastActiveDate === yesterdayStr) {
                currentStreak += 1;
              } else {
                currentStreak = 1;
              }
              lastActiveDate = todayStr;
              if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
              }
              await db.update(streaks)
                .set({ currentStreak, longestStreak, lastActiveDate })
                .where(eq(streaks.userId, userId));
            }
          } else {
            await db.insert(streaks).values({
              userId,
              currentStreak: 1,
              longestStreak: 1,
              lastActiveDate: todayStr
            });
          }
        } catch (err) {
          console.error('Streak update during daily dose solve is broken:', err);
        }
      }

      return res.json({
        success: true,
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        motivation: isCorrect 
          ? (question.correctMotivationMessage || "Keep it up, champ! You got it right! 🎉") 
          : (question.wrongMotivationMessage || "Don't discourage yourself. Mistakes are the path to learning! 📚"),
        attempt: attemptItem
      });
    } catch (err: any) {
      console.error('Failed to submit question evaluation:', err);
      res.status(500).json({ error: 'Failed to save student evaluation', details: err.message });
    }
  });

  // Admin CRUD for controlling daily dose instances
  app.get('/api/admin/daily-dose', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const list = await db.select().from(dailyDose).orderBy(desc(dailyDose.date));
    res.json(list);
  } catch (err: any) {
    console.error('Failed listing daily doses:', err);
    res.status(500).json({ error: 'Failed retrieving daily doses from database', details: err.message });
  }
});
  app.post('/api/admin/daily-dose/upsert', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const q = req.body;
      if (!q.date || !q.examType || !q.subject || !q.question || !q.optionA || !q.correctAnswer) {
        return res.status(400).json({ error: 'Missing required daily dose setup configurations.' });
      }

      if (q.id) {
        const updated = await db.update(dailyDose)
          .set({
            date: String(q.date),
            examType: String(q.examType),
            subject: String(q.subject),
            question: String(q.question),
            optionA: String(q.optionA),
            optionB: String(q.optionB || ''),
            optionC: String(q.optionC || ''),
            optionD: String(q.optionD || ''),
            correctAnswer: String(q.correctAnswer),
            explanation: String(q.explanation || ''),
            correctMotivationMessage: String(q.correctMotivationMessage || ''),
            wrongMotivationMessage: String(q.wrongMotivationMessage || ''),
            motivationImageUrl: q.motivationImageUrl ? String(q.motivationImageUrl) : null,
            publishDate: String(q.publishDate || q.date),
            status: String(q.status || 'Active'),
            updatedAt: new Date()
          })
          .where(eq(dailyDose.id, q.id))
          .returning();
        
        return res.json({ success: true, data: updated[0] });
      } else {
        const inserted = await db.insert(dailyDose)
          .values({
            date: String(q.date),
            examType: String(q.examType),
            subject: String(q.subject),
            question: String(q.question),
            optionA: String(q.optionA),
            optionB: String(q.optionB || ''),
            optionC: String(q.optionC || ''),
            optionD: String(q.optionD || ''),
            correctAnswer: String(q.correctAnswer),
            explanation: String(q.explanation || ''),
            correctMotivationMessage: String(q.correctMotivationMessage || ''),
            wrongMotivationMessage: String(q.wrongMotivationMessage || ''),
            motivationImageUrl: q.motivationImageUrl ? String(q.motivationImageUrl) : null,
            publishDate: String(q.publishDate || q.date),
            status: String(q.status || 'Active')
          })
          .returning();
        
        return res.status(201).json({ success: true, data: inserted[0] });
      }
    } catch (err: any) {
      console.error('Failed to upsert daily dose configuration:', err);
      res.status(500).json({ error: 'Failed in daily dose transaction operation', details: err.message });
    }
  });

  app.post('/api/admin/daily-dose/delete', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing daily dose ID parameters.' });
      }
      await db.delete(dailyDose).where(eq(dailyDose.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to delete daily dose entry:', err);
      res.status(500).json({ error: 'Failed to trigger deletion on daily dose record', details: err.message });
    }
  });


  // ==========================================
  // STUDY YATRA - LECTURES API ENDPOINTS
  // ==========================================

  // Get active lectures for a single chapter with watched completion status
  app.get('/api/lectures/chapter/:chapterId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const { chapterId } = req.params;

      const lecturesList = await db.select()
        .from(chapterLectures)
        .where(eq(chapterLectures.chapter, chapterId))
        .orderBy(chapterLectures.lectureOrder);

      const userWatchedProgress = await db.select()
        .from(userLectureProgress)
        .where(eq(userLectureProgress.userId, uid));

      const watchedLectureIds = new Set(userWatchedProgress.map(p => p.lectureId));

      const formattedLectures = lecturesList.map(lecture => ({
        ...lecture,
        watched: watchedLectureIds.has(lecture.id)
      }));

      res.json({ success: true, lectures: formattedLectures });
    } catch (err: any) {
      console.error('Failed fetching chapter lectures:', err);
      res.status(500).json({ error: 'Failed fetching chapter lectures from database', details: err.message });
    }
  });

  // Toggle or update watch status for a single lecture
  app.post('/api/lectures/:lectureId/toggle-watch', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user;
      const lectureId = parseInt(req.params.lectureId);
      if (isNaN(lectureId)) {
        return res.status(400).json({ error: 'Invalid lecture ID.' });
      }

      // Check if watched already exists
      const existing = await db.select()
        .from(userLectureProgress)
        .where(
          and(
            eq(userLectureProgress.userId, uid),
            eq(userLectureProgress.lectureId, lectureId)
          )
        );

      if (existing.length > 0) {
        // Toggle off - unwatch
        await db.delete(userLectureProgress)
          .where(
            and(
              eq(userLectureProgress.userId, uid),
              eq(userLectureProgress.lectureId, lectureId)
            )
          );
        return res.json({ success: true, watched: false });
      } else {
        // Mark as watched
        await db.insert(userLectureProgress)
          .values({
            userId: uid,
            lectureId: lectureId,
            watched: true
          });
        return res.json({ success: true, watched: true });
      }
    } catch (err: any) {
      console.error('Failed toggling lecture watch progress:', err);
      res.status(500).json({ error: 'Failed toggling lecture watch progress', details: err.message });
    }
  });

  // Admin section: List all available lectures for the manager catalog
  app.get('/api/admin/lectures', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await db.select()
        .from(chapterLectures)
        .orderBy(chapterLectures.chapter, chapterLectures.lectureOrder);
      res.json(list);
    } catch (err: any) {
      console.error('Failed loading admin lectures catalog:', err);
      res.status(500).json({ error: 'Failed to retrieve admin lectures catalog from database', details: err.message });
    }
  });

  // Admin section: Upsert standard lecture item
  app.post('/api/admin/lectures/upsert', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const q = req.body;
      if (!q.chapter || !q.lectureTitle || !q.youtubeUrl) {
        return res.status(400).json({ error: 'Missing required configuration: chapter id, lecture title, and youtube url.' });
      }

      const examType = String(q.examType || 'JEE');
      const classLevel = String(q.classLevel || 'Class 12');
      const subject = String(q.subject || 'Physics');
      const chapter = String(q.chapter);
      const lectureTitle = String(q.lectureTitle);
      const lectureDescription = String(q.lectureDescription || '');
      const youtubeUrl = String(q.youtubeUrl);
      const lectureOrder = isNaN(parseInt(q.lectureOrder)) ? 1 : parseInt(q.lectureOrder);
      const thumbnailUrl = q.thumbnailUrl ? String(q.thumbnailUrl) : null;

      if (q.id) {
        const id = parseInt(q.id);
        const updated = await db.update(chapterLectures)
          .set({
            examType,
            classLevel,
            subject,
            chapter,
            lectureTitle,
            lectureDescription,
            youtubeUrl,
            lectureOrder,
            thumbnailUrl,
          })
          .where(eq(chapterLectures.id, id))
          .returning();
        res.json({ success: true, data: updated[0] });
      } else {
        const inserted = await db.insert(chapterLectures)
          .values({
            examType,
            classLevel,
            subject,
            chapter,
            lectureTitle,
            lectureDescription,
            youtubeUrl,
            lectureOrder,
            thumbnailUrl,
          })
          .returning();
        res.status(201).json({ success: true, data: inserted[0] });
      }
    } catch (err: any) {
      console.error('Failed to upsert lecture record:', err);
      res.status(500).json({ error: 'Failed to record lecture database transaction', details: err.message });
    }
  });

  // Admin section: Delete single lecture item
  app.post('/api/admin/lectures/delete', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = req.body.id ? parseInt(req.body.id) : null;
      if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Missing valid lecture ID parameters' });
      }
      
      // Delete user lecture progress references first to prevent foreign key constraint issues
      await db.delete(userLectureProgress).where(eq(userLectureProgress.lectureId, id));
      
      // Delete the actual lecture item
      await db.delete(chapterLectures).where(eq(chapterLectures.id, id));
      
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to delete lecture entry:', err);
      res.status(500).json({ error: 'Failed when removing lecture item', details: err.message });
    }
  });

  // ===================== Sample Paper feature =====================

  // Public: list sample papers for an exam, optionally filtered by test type.
  // Only 'Active' tests are returned, each with its subject-wise solution links attached.
  app.get('/api/sample-papers', async (req, res) => {
    try {
      const examType = String(req.query.examType || '');
      const testType = req.query.testType ? String(req.query.testType) : undefined;
      if (!examType) {
        return res.status(400).json({ error: 'examType query parameter is required.' });
      }

      const conditions = [eq(samplePapers.examType, examType), eq(samplePapers.status, 'Active')];
      if (testType) {
        conditions.push(eq(samplePapers.testType, testType));
      }

      const papers = await db.select()
        .from(samplePapers)
        .where(and(...conditions))
        .orderBy(samplePapers.testOrder);

      if (papers.length === 0) {
        return res.json({ success: true, papers: [] });
      }

      const paperIds = papers.map(p => p.id);
      const solutions = await db.select()
        .from(samplePaperSolutions)
        .where(inArray(samplePaperSolutions.samplePaperId, paperIds))
        .orderBy(samplePaperSolutions.solutionOrder);

      const papersWithSolutions = papers.map(p => ({
        ...p,
        solutions: solutions.filter(s => s.samplePaperId === p.id)
      }));

      res.json({ success: true, papers: papersWithSolutions });
    } catch (err: any) {
      console.error('Failed fetching sample papers:', err);
      res.status(500).json({ error: 'Failed fetching sample papers from database', details: err.message });
    }
  });

  // Admin: list every sample paper (any status), with solutions attached, for the catalogue view
  app.get('/api/admin/sample-papers', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const papers = await db.select()
        .from(samplePapers)
        .orderBy(samplePapers.examType, samplePapers.testType, samplePapers.testOrder);

      const paperIds = papers.map(p => p.id);
      const solutions = paperIds.length > 0
        ? await db.select().from(samplePaperSolutions).where(inArray(samplePaperSolutions.samplePaperId, paperIds)).orderBy(samplePaperSolutions.solutionOrder)
        : [];

      const papersWithSolutions = papers.map(p => ({
        ...p,
        solutions: solutions.filter(s => s.samplePaperId === p.id)
      }));

      res.json({ success: true, papers: papersWithSolutions });
    } catch (err: any) {
      console.error('Failed loading admin sample papers catalogue:', err);
      res.status(500).json({ error: 'Failed to retrieve admin sample papers catalogue', details: err.message });
    }
  });

  // Admin: create or update a sample paper test
  app.post('/api/admin/sample-papers/upsert', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const q = req.body;
      if (!q.examType || !q.testName || !q.syllabusPdfUrl || !q.testPdfUrl) {
        return res.status(400).json({ error: 'Missing required fields: examType, testName, syllabusPdfUrl, testPdfUrl.' });
      }

      const examType = String(q.examType);
      const testType = String(q.testType || 'chapterwise');
      const testName = String(q.testName);
      const testOrder = isNaN(parseInt(q.testOrder)) ? 1 : parseInt(q.testOrder);
      const syllabusPdfUrl = String(q.syllabusPdfUrl);
      const testPdfUrl = String(q.testPdfUrl);
      const status = String(q.status || 'Active');

      if (q.id) {
        const updated = await db.update(samplePapers)
          .set({ examType, testType, testName, testOrder, syllabusPdfUrl, testPdfUrl, status, updatedAt: new Date() })
          .where(eq(samplePapers.id, String(q.id)))
          .returning();
        res.json({ success: true, data: updated[0] });
      } else {
        const inserted = await db.insert(samplePapers)
          .values({ examType, testType, testName, testOrder, syllabusPdfUrl, testPdfUrl, status })
          .returning();
        res.status(201).json({ success: true, data: inserted[0] });
      }
    } catch (err: any) {
      console.error('Failed to upsert sample paper record:', err);
      res.status(500).json({ error: 'Failed to record sample paper database transaction', details: err.message });
    }
  });

  // Admin: delete a sample paper test (its solutions cascade-delete automatically)
  app.post('/api/admin/sample-papers/delete', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = req.body.id ? String(req.body.id) : null;
      if (!id) {
        return res.status(400).json({ error: 'Missing valid sample paper ID.' });
      }
      await db.delete(samplePapers).where(eq(samplePapers.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to delete sample paper entry:', err);
      res.status(500).json({ error: 'Failed when removing sample paper item', details: err.message });
    }
  });

  // Admin: create or update a subject-wise solution link under a sample paper
  app.post('/api/admin/sample-papers/solutions/upsert', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const q = req.body;
      if (!q.samplePaperId || !q.subject || !q.youtubeUrl) {
        return res.status(400).json({ error: 'Missing required fields: samplePaperId, subject, youtubeUrl.' });
      }

      const samplePaperId = String(q.samplePaperId);
      const subject = String(q.subject);
      const youtubeUrl = String(q.youtubeUrl);
      const solutionOrder = isNaN(parseInt(q.solutionOrder)) ? 1 : parseInt(q.solutionOrder);

      if (q.id) {
        const updated = await db.update(samplePaperSolutions)
          .set({ subject, youtubeUrl, solutionOrder })
          .where(eq(samplePaperSolutions.id, String(q.id)))
          .returning();
        res.json({ success: true, data: updated[0] });
      } else {
        const inserted = await db.insert(samplePaperSolutions)
          .values({ samplePaperId, subject, youtubeUrl, solutionOrder })
          .returning();
        res.status(201).json({ success: true, data: inserted[0] });
      }
    } catch (err: any) {
      console.error('Failed to upsert sample paper solution:', err);
      res.status(500).json({ error: 'Failed to record sample paper solution transaction', details: err.message });
    }
  });

  // Admin: delete a subject-wise solution link
  app.post('/api/admin/sample-papers/solutions/delete', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = req.body.id ? String(req.body.id) : null;
      if (!id) {
        return res.status(400).json({ error: 'Missing valid solution ID.' });
      }
      await db.delete(samplePaperSolutions).where(eq(samplePaperSolutions.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to delete sample paper solution:', err);
      res.status(500).json({ error: 'Failed when removing sample paper solution', details: err.message });
    }
  });

  // ===================== End Sample Paper feature =====================

  // Admin section: Live year-range stats for PYQ questions (min/max years + per-year counts)
  // Years are derived dynamically from the questions table - never hardcoded, so newly
  // imported years (e.g. 2026) show up automatically once questions exist for them.
  app.get('/api/admin/year-stats', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { examType } = req.query;

      const baseQuery = db.select({
        year: questions.year,
        count: sql<number>`count(*)::int`
      }).from(questions);

      const yearCounts = examType && examType !== 'All'
        ? await baseQuery.where(eq(questions.examType, String(examType))).groupBy(questions.year).orderBy(questions.year)
        : await baseQuery.groupBy(questions.year).orderBy(questions.year);

      const numericYears = yearCounts
        .map(y => Number(y.year))
        .filter(y => !isNaN(y));

      const minYear = numericYears.length > 0 ? Math.min(...numericYears) : null;
      const maxYear = numericYears.length > 0 ? Math.max(...numericYears) : null;

      res.json({
        success: true,
        examType: examType && examType !== 'All' ? String(examType) : 'All',
        minYear,
        maxYear,
        yearBreakdown: yearCounts.map(y => ({ year: y.year, count: y.count }))
      });
    } catch (err: any) {
      console.error('Failed to compute year-range stats:', err);
      res.status(500).json({ error: 'Failed to compute year-range stats from PostgreSQL', details: err.message });
    }
  });

  // Admin section: Get current custom year-range override (if any) for PYQ display
  app.get('/api/admin/year-range-override', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const rows = await db.select().from(platformSettings).where(eq(platformSettings.key, 'pyq_year_range_override'));
      if (rows.length === 0) {
        return res.json({ success: true, override: null });
      }
      const parsed = JSON.parse(rows[0].value);
      res.json({ success: true, override: parsed });
    } catch (err: any) {
      console.error('Failed to load year-range override:', err);
      res.status(500).json({ error: 'Failed to load year-range override', details: err.message });
    }
  });

  // Admin section: Save a custom year-range override (manually set min/max years)
  app.post('/api/admin/year-range-override/upsert', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { minYear, maxYear } = req.body;
      const min = Number(minYear);
      const max = Number(maxYear);

      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ error: 'minYear and maxYear must both be valid numbers.' });
      }
      if (min > max) {
        return res.status(400).json({ error: 'minYear cannot be greater than maxYear.' });
      }

      const value = JSON.stringify({ minYear: min, maxYear: max });
      const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, 'pyq_year_range_override'));

      if (existing.length > 0) {
        await db.update(platformSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(platformSettings.key, 'pyq_year_range_override'));
      } else {
        await db.insert(platformSettings).values({ key: 'pyq_year_range_override', value });
      }

      res.json({ success: true, override: { minYear: min, maxYear: max } });
    } catch (err: any) {
      console.error('Failed to save year-range override:', err);
      res.status(500).json({ error: 'Failed to save year-range override', details: err.message });
    }
  });

  // Admin section: Clear the custom year-range override, reverting to the live DB-derived range
  app.post('/api/admin/year-range-override/reset', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await db.delete(platformSettings).where(eq(platformSettings.key, 'pyq_year_range_override'));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to reset year-range override:', err);
      res.status(500).json({ error: 'Failed to reset year-range override', details: err.message });
    }
  });

  // Public route: effective PYQ year range for student-facing screens.
  // Returns the admin-set override if one exists, otherwise falls back to the
  // live min/max derived from the questions table so it always has a sane value.
  app.get('/api/year-range', async (req, res) => {
    try {
      const overrideRows = await db.select().from(platformSettings).where(eq(platformSettings.key, 'pyq_year_range_override'));
      if (overrideRows.length > 0) {
        const parsed = JSON.parse(overrideRows[0].value);
        return res.json({ success: true, minYear: parsed.minYear, maxYear: parsed.maxYear, source: 'override' });
      }

      const yearRows = await db.select({ year: questions.year }).from(questions);
      const numericYears = yearRows.map(y => Number(y.year)).filter(y => !isNaN(y));
      const minYear = numericYears.length > 0 ? Math.min(...numericYears) : null;
      const maxYear = numericYears.length > 0 ? Math.max(...numericYears) : null;

      res.json({ success: true, minYear, maxYear, source: 'live' });
    } catch (err: any) {
      console.error('Failed to compute effective year range:', err);
      res.status(500).json({ error: 'Failed to compute effective year range', details: err.message });
    }
  });


  // ==========================================
  // ADMIN PLATFORM STATS & USER LEDGER ROUTES
  // ==========================================

  // Admin: Platform-wide overview stats (DAU, MAU, questions solved today, premium revenue)
  app.get('/api/admin/stats/overview', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const todayStr = new Date().toISOString().split('T')[0];

      // Daily Active Users: distinct users from attempts + daily dose attempts in last 24h
      const attemptsUsersDay = await db.selectDistinct({ userId: attempts.userId })
        .from(attempts)
        .where(sql`${attempts.attemptedAt} >= ${oneDayAgo}`);
      const doseUsersDay = await db.selectDistinct({ userId: dailyDoseAttempts.userId })
        .from(dailyDoseAttempts)
        .where(sql`${dailyDoseAttempts.createdAt} >= ${oneDayAgo}`);
      const dailyActiveUserSet = new Set([
        ...attemptsUsersDay.map(u => u.userId),
        ...doseUsersDay.map(u => u.userId)
      ]);
      const dailyActiveUsers = dailyActiveUserSet.size;

      // Monthly Active Users: distinct users from attempts + daily dose attempts in last 30 days
      const attemptsUsersMonth = await db.selectDistinct({ userId: attempts.userId })
        .from(attempts)
        .where(sql`${attempts.attemptedAt} >= ${thirtyDaysAgo}`);
      const doseUsersMonth = await db.selectDistinct({ userId: dailyDoseAttempts.userId })
        .from(dailyDoseAttempts)
        .where(sql`${dailyDoseAttempts.createdAt} >= ${thirtyDaysAgo}`);
      const monthlyActiveUserSet = new Set([
        ...attemptsUsersMonth.map(u => u.userId),
        ...doseUsersMonth.map(u => u.userId)
      ]);
      const monthlyActiveUsers = monthlyActiveUserSet.size;

      // Questions Solved Today
      const questionsTodayResult = await db.select({ count: sql<number>`count(*)::int` })
        .from(attempts)
        .where(sql`DATE(${attempts.attemptedAt}) = ${todayStr}`);
      const questionsSolvedToday = questionsTodayResult[0]?.count || 0;

      // Premium Revenue: sum of paid payments
      const revenueResult = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)::int` })
        .from(payments)
        .where(eq(payments.status, 'paid'));
      const premiumRevenue = revenueResult[0]?.total || 0;

      res.json({
        success: true,
        dailyActiveUsers,
        monthlyActiveUsers,
        questionsSolvedToday,
        premiumRevenue
      });
    } catch (err: any) {
      console.error('Failed to compute platform stats overview:', err);
      res.status(500).json({ error: 'Failed to compute platform stats overview', details: err.message });
    }
  });

  // Admin: Top 5 chapter practices by attempt count
  app.get('/api/admin/stats/top-chapters', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const topChapters = await db.select({
        chapter: questions.chapter,
        subject: questions.subject,
        count: sql<number>`count(*)::int`
      })
      .from(attempts)
      .innerJoin(questions, eq(attempts.questionId, questions.id))
      .groupBy(questions.chapter, questions.subject)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

      res.json({ success: true, topChapters });
    } catch (err: any) {
      console.error('Failed to compute top chapter practices:', err);
      res.status(500).json({ error: 'Failed to compute top chapter practices', details: err.message });
    }
  });

  // Admin: Subject breakdown as a percentage of total attempts
  app.get('/api/admin/stats/top-subjects', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const subjectCounts = await db.select({
        subject: questions.subject,
        count: sql<number>`count(*)::int`
      })
      .from(attempts)
      .innerJoin(questions, eq(attempts.questionId, questions.id))
      .groupBy(questions.subject)
      .orderBy(desc(sql`count(*)`));

      const totalAttempts = subjectCounts.reduce((sum, s) => sum + s.count, 0);
      const topSubjects = subjectCounts.map(s => ({
        subject: s.subject,
        count: s.count,
        percentage: totalAttempts > 0 ? Math.round((s.count / totalAttempts) * 100) : 0
      }));

      res.json({ success: true, topSubjects, totalAttempts });
    } catch (err: any) {
      console.error('Failed to compute top subjects breakdown:', err);
      res.status(500).json({ error: 'Failed to compute top subjects breakdown', details: err.message });
    }
  });

  // Admin: List real users for the User Ledger tab
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { search } = req.query;
      let usersList = await db.select().from(users).orderBy(users.name);

      if (search && String(search).trim() !== '') {
        const term = String(search).toLowerCase();
        usersList = usersList.filter((u: any) =>
          (u.name || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term)
        );
      }

      res.json({ success: true, users: usersList });
    } catch (err: any) {
      console.error('Failed to list admin users:', err);
      res.status(500).json({ error: 'Failed to list admin users', details: err.message });
    }
  });

  // Admin: Update a user's plan (Upgrade to Premium / Downgrade to Free)
  app.post('/api/admin/users/:uid/plan', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.params;
      const { plan } = req.body;

      if (!plan || !['Free', 'Premium'].includes(plan)) {
        return res.status(400).json({ error: 'plan must be either "Free" or "Premium".' });
      }

      const updated = await db.update(users)
        .set({ plan, updatedAt: new Date() })
        .where(eq(users.uid, uid))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({ success: true, user: updated[0] });
    } catch (err: any) {
      console.error('Failed to update user plan:', err);
      res.status(500).json({ error: 'Failed to update user plan', details: err.message });
    }
  });

  // Helper function to read quotes-wrapped columns in CSV row
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let insideQuote = false;
    let currentColumn = '';

    for (let i = 0; i < line.length; i++) {
       const char = line[i];
       if (char === '"') {
         insideQuote = !insideQuote;
       } else if (char === ',' && !insideQuote) {
         result.push(currentColumn.trim());
         currentColumn = '';
       } else {
         currentColumn += char;
       }
    }
    result.push(currentColumn.trim());
    return result;
  }

  if (process.env.NODE_ENV === 'production') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Study Yatra running on port ${PORT}`);
    });
  } else {
    const httpsOptions = {
      key: fs.readFileSync(path.join(process.cwd(), 'localhost+1-key.pem')),
      cert: fs.readFileSync(path.join(process.cwd(), 'localhost+1.pem')),
    };

    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`Server fully operative and running on https://localhost:${PORT}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

import { pgTable, serial, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';

// Users table (UID is the Firebase UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name'),
  email: text('email'),
  targetExam: text('target_exam'),
  classLevel: text('class_level'),
  plan: text('plan').default('Free'),
  dreamCollege: text('dream_college'),
  journeyProgress: integer('journey_progress').default(0),
  passportStage: text('passport_stage').default('class11'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Questions table
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  examType: text('exam_type').notNull(),
  classLevel: text('class_level').notNull(),
  subject: text('subject').notNull(),
  chapter: text('chapter').notNull(),
  year: text('year').notNull(),
  session: text('session'),
  examDate: text('exam_date'),
  questionText: text('question_text').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  difficulty: text('difficulty').default('Medium').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Attempt tracking table
export const attempts = pgTable('attempts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // points to users.uid
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  selectedAnswer: text('selected_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow(),
});

// Streaks table
export const streaks = pgTable('streaks', {
  userId: text('user_id').primaryKey(), // points to users.uid
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveDate: text('last_active_date'),
});

// Doubts table
export const doubts = pgTable('doubts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // points to users.uid
  subject: text('subject').notNull(),
  question: text('question').notNull(),
  imageUrl: text('image_url'),
  status: text('status').default('unresolved').notNull(),
  replyText: text('reply_text'),
  replyVideoUrl: text('reply_video_url'),
  replyTimestamp: timestamp('reply_timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chapter Images table
export const chapterImages = pgTable('chapter_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  classLevel: text('class_level').notNull(), // Class level: "11" or "12"
  subject: text('subject').notNull(), // "Physics", "Chemistry", "Mathematics", "Botany", "Zoology"
  chapterName: text('chapter_name').notNull(),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Dose table
export const dailyDose = pgTable('daily_dose', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: text('date').notNull(), // format YYYY-MM-DD
  examType: text('exam_type').notNull(), // JEE, NEET, CBSE
  subject: text('subject').notNull(), // Physics, Chemistry, Mathematics, Botany, Zoology
  question: text('question').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctAnswer: text('correct_answer').notNull(), // A, B, C, D
  explanation: text('explanation').notNull(),
  correctMotivationMessage: text('correct_motivation_message'),
  wrongMotivationMessage: text('wrong_motivation_message'),
  motivationImageUrl: text('motivation_image_url'),
  publishDate: text('publish_date'),
  status: text('status').default('Active').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Dose Attempts table
export const dailyDoseAttempts = pgTable('daily_dose_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyDoseId: uuid('daily_dose_id').notNull().references(() => dailyDose.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // Firebase UID or 'guest'
  answer: text('answer').notNull(), // A, B, C, D
  correct: boolean('correct').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chapter Lectures table
export const chapterLectures = pgTable('chapter_lectures', {
  id: serial('id').primaryKey(),
  examType: text('exam_type').notNull(), // JEE, NEET, CBSE
  classLevel: text('class_level').notNull(), // Class 11, Class 12, Dropper
  subject: text('subject').notNull(), // Physics, Chemistry, Mathematics, Botany, Zoology, Biology
  chapter: text('chapter').notNull(), // Chapter ID string
  lectureTitle: text('lecture_title').notNull(),
  lectureDescription: text('lecture_description').notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  lectureOrder: integer('lecture_order').notNull(),
  thumbnailUrl: text('thumbnail_url'), // Optional url
  createdAt: timestamp('created_at').defaultNow(),
});

// User Lecture Progress tracking table
export const userLectureProgress = pgTable('user_lecture_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase UID
  lectureId: integer('lecture_id').notNull().references(() => chapterLectures.id, { onDelete: 'cascade' }),
  watched: boolean('watched').default(true).notNull(),
  watchedAt: timestamp('watched_at').defaultNow(),
});

// Mock Test Prediction History table
export const predictionHistory = pgTable('prediction_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase UID
  examType: text('exam_type').notNull(), // "JEE Main" or "NEET"
  physicsMarks: integer('physics_marks').notNull(),
  chemistryMarks: integer('chemistry_marks').notNull(),
  mathsOrBiologyMarks: integer('maths_or_biology_marks').notNull(), // Maths for JEE, Biology for NEET
  totalMarks: integer('total_marks').notNull(),
  predictedPercentile: text('predicted_percentile').notNull(),
  predictedRank: text('predicted_rank').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Pit Stops (collections) table
export const pitStops = pgTable('pit_stops', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // points to users.uid
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Pit Stop Questions join table
export const pitStopQuestions = pgTable('pit_stop_questions', {
  id: serial('id').primaryKey(),
  pitStopId: integer('pit_stop_id').notNull().references(() => pitStops.id, { onDelete: 'cascade' }),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // points to users.uid
  purpose: text('purpose').notNull(), // 'premium_upgrade' or 'doubt_question'
  amount: integer('amount').notNull(), // amount in rupees (e.g. 1000, 50)
  razorpayOrderId: text('razorpay_order_id').notNull().unique(),
  razorpayPaymentId: text('razorpay_payment_id'), // null until payment completes
  status: text('status').default('created').notNull(), // 'created', 'paid', 'failed'
  // Extra context needed to fulfill the purchase after verification,
  // e.g. for doubt_question: { subject, question, imageUrl }
  metadata: text('metadata'), // JSON-stringified extra data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sample Paper tests (Chapter-wise tests / full-length mocks shown under the
// "Sample Paper" section, separate from the main PYQ practice flow).
export const samplePapers = pgTable('sample_papers', {
  id: uuid('id').defaultRandom().primaryKey(),
  examType: text('exam_type').notNull(), // JEE, NEET, CBSE
  testType: text('test_type').default('chapterwise').notNull(), // 'chapterwise' | 'full_length'
  testName: text('test_name').notNull(), // "Test 1", "Test 2" ...
  testOrder: integer('test_order').default(1).notNull(),
  syllabusPdfUrl: text('syllabus_pdf_url').notNull(), // Google Drive share link
  testPdfUrl: text('test_pdf_url').notNull(), // Google Drive share link
  status: text('status').default('Active').notNull(), // 'Active' | 'Inactive'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subject-wise solution video links attached to a Sample Paper test
export const samplePaperSolutions = pgTable('sample_paper_solutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  samplePaperId: uuid('sample_paper_id').notNull().references(() => samplePapers.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(), // e.g. "Physics"
  youtubeUrl: text('youtube_url').notNull(),
  solutionOrder: integer('solution_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Generic key-value platform settings table (used for admin-configurable
// overrides, e.g. a custom PYQ year range shown to students instead of the
// live DB-derived range).
export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
 


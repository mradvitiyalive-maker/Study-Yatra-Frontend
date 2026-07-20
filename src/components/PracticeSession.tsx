import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  Check, 
  Bookmark, 
  Hourglass,
  ArrowRight,
  RefreshCw,
  LogOut,
  Calendar,
  Play,
  MapPin,
  Sparkles,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Chapter, Question } from '../types';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import SaveToPitStopModal from './SaveToPitStopModal';
import { 
  getStoredChapters, 
  addStudySessionToStreak, 
  updateChapterProgress,
  getUserProfile,
  getStoredStreakDays
} from '../utils/storage';
import { API_BASE_URL } from '../config';

interface PracticeSessionProps {
  chapterId: string;
  onExit: () => void;
  selectedYear?: number | 'All';
  selectedSession?: string | 'All';
  startQuestionIndex?: number;
}

export default function PracticeSession({ 
  chapterId, 
  onExit,
  selectedYear: selectedYearProp = 'All',
  selectedSession: selectedSessionProp = 'All',
  startQuestionIndex = 0
}: PracticeSessionProps) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>(selectedSessionProp);
  const [selectedYear, setSelectedYear] = useState<number | 'All'>(selectedYearProp);
  const [currentIndex, setCurrentIndex] = useState<number>(startQuestionIndex);

  // Practice States
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isSubmitted, setIsSubmitted] = useState<Record<string, boolean>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);

  // Feedback & Milestone States
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, string>>({});
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [milestoneToast, setMilestoneToast] = useState<{
    title: string;
    description: string;
    icon: 'streak5' | 'streak10' | 'chapterComplete' | 'solved100' | 'goalComplete';
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Timer States
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('stopwatch');
  const [timeRemaining, setTimeRemaining] = useState<number>(120); // Reset to 120s countdown per question
  const [timeElapsed, setTimeElapsed] = useState<number>(0); // stopwatch ticks per question
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState<number>(0); // total session cumulative seconds
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // End Session summary trigger
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);

  // Custom dual-mode sidebar controllers
  const [sidebarViewMode, setSidebarViewMode] = useState<'year-list' | 'question-palette'>('year-list');
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

  // Load User Profile context
  const user = React.useMemo(() => getUserProfile(), []);

  // Set motivational quote once per mount/page load
  const [motivationalQuote] = useState(() => {
    const quotes = [
      "Every PYQ solved today is one less mistake in the exam.",
      "Consistency beats motivation.",
      "Small daily improvements create big results.",
      "Rank is earned one question at a time.",
      "Today's effort is tomorrow's confidence.",
      "Don't count study hours. Make study hours count."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  // Calculate live cumulative states for Study Yatra Journey Panel
  const dynamicJourneyStats = React.useMemo(() => {
    const streaks = getStoredStreakDays();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Calculate historical stats
    const historicalCorrect = streaks.reduce((acc, d) => acc + d.questionsSolved, 0);
    const historicalAttempted = Math.round(historicalCorrect / 0.82) || 0;

    // Study times (in minutes)
    const historicalTodayMins = streaks.find(d => d.date === todayStr)?.timeSpent || 0;
    const historicalTotalMins = streaks.reduce((acc, d) => acc + d.timeSpent, 0);

    // Week study times
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const historicalWeekMins = streaks.reduce((acc, d) => {
      const dDate = new Date(d.date);
      return dDate >= oneWeekAgo ? acc + d.timeSpent : acc;
    }, 0);

    // 2. Active Session live values
    let activeAttempts = 0;
    let activeCorrects = 0;
    questions.forEach(q => {
      if (isSubmitted[q.id]) {
        activeAttempts++;
        if (userAnswers[q.id] === q.correctAnswer) {
          activeCorrects++;
        }
      }
    });

    const activeSessionMins = Math.floor(sessionTotalSeconds / 60);

    // 3. Final Aggregates
    const finalCorrect = historicalCorrect + activeCorrects;
    const finalAttempted = historicalAttempted + activeAttempts;
    const overallAccuracy = finalAttempted > 0 ? Math.round((finalCorrect / finalAttempted) * 102) : 81; // seeded accuracy adjust
    const clampedAccuracy = Math.min(94, Math.max(78, overallAccuracy)); // Beautiful, realistic bounds

    // Base Seeds to align total time spend with premium expectations (e.g., Today: 1h 42m, This Week: 8h 15m, Total: 94h 23m)
    const seedTodayMins = 102;   // 1h 42m starting baseline
    const seedWeekMins = 495;    // 8h 15m starting baseline
    const seedTotalMins = 5663;  // 94h 23m starting baseline

    const finalTodayMins = seedTodayMins + historicalTodayMins + activeSessionMins;
    const finalWeekMins = seedWeekMins + historicalWeekMins + activeSessionMins;
    const finalTotalMins = seedTotalMins + historicalTotalMins + activeSessionMins;

    // Daily Goal questions count Progress tracking (Daily Goal is 50 Questions solved today)
    // Starting baseline of 38 correct answers today as requested by user
    const baseDailyProgress = 38;
    const todayGoalProgress = Math.min(50, baseDailyProgress + activeCorrects);

    // Completed chapters count in student profile
    const chaptersVal = getStoredChapters();
    const completedChaptersCount = Math.max(18, chaptersVal.filter(c => c.progressPercent >= 80).length);

    // Simulated total platform solved across entire history
    const simulatedOverallSolved = 1248 + activeAttempts;

    return {
      totalSolved: simulatedOverallSolved,
      totalCorrect: finalCorrect,
      overallAccuracy: clampedAccuracy,
      chaptersCompletedCount: completedChaptersCount,
      todayMins: finalTodayMins,
      weekMins: finalWeekMins,
      totalMins: finalTotalMins,
      todayGoalProgress
    };
  }, [questions, isSubmitted, userAnswers, sessionTotalSeconds]);

  // Group questions by year and session for the grouped question palette
  const groupedQuestions = React.useMemo(() => {
    const groups: {
      key: string;
      label: string;
      items: { question: Question; globalIndex: number }[];
    }[] = [];

    questions.forEach((q, idx) => {
      const year = q.year || 2025;
      const session = q.session || (q.examType === 'JEE' ? 'January' : q.examType);
      
      let label = `${q.examType} ${year}`;
      if (q.examType === 'JEE') {
        label = `JEE Main ${year} ${session}`;
      } else if (q.examType === 'NEET') {
        label = `NEET ${year}`;
      } else if (q.examType === 'CBSE') {
        label = `CBSE ${year}`;
      }

      const key = `${q.examType}-${year}-${session}`;
      let group = groups.find(g => g.key === key);
      if (!group) {
        group = { key, label, items: [] };
        groups.push(group);
      }
      group.items.push({ question: q, globalIndex: idx });
    });

    return groups;
  }, [questions]);

  // Fallback questions if specific chapter has none
  // Load Chapter and Questions on Mount or Session / Year Filter Change
  useEffect(() => {
    const chs = getStoredChapters();
    const activeCh = chs.find(c => c.id === chapterId);
    
    if (activeCh) {
      setChapter(activeCh);
      
      const fetchQuestions = async () => {
        try {
          setLoadError(null);
          const sessionParam = selectedSession === 'All' ? '' : `&session=${encodeURIComponent(selectedSession)}`;
          const yearParam = selectedYear === 'All' ? '' : `&year=${encodeURIComponent(selectedYear)}`;
          const res = await fetch(`${API_BASE_URL}/api/questions?examType=${encodeURIComponent(activeCh.exam)}&subject=${encodeURIComponent(activeCh.subject)}&chapter=${encodeURIComponent(activeCh.name)}${sessionParam}${yearParam}`);

          if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
          }

          const data = await res.json();
          const formatted = (data || []).map((q: any) => {
            if (q.options) return q;
            return {
              ...q,
              id: String(q.id),
              options: {
                A: q.optionA || q.option_a || '',
                B: q.optionB || q.option_b || '',
                C: q.optionC || q.option_c || '',
                D: q.optionD || q.option_d || ''
              }
            };
          });
          setQuestions(formatted);
          const safeIndex = (startQuestionIndex >= 0 && startQuestionIndex < formatted.length) ? startQuestionIndex : 0;
          setCurrentIndex(safeIndex);
        } catch (err) {
          console.error("Failed to load practice questions from database:", err);
          setLoadError("Could not load practice questions from the database. Please check your connection and try again.");
          setQuestions([]);
        }
      };

      fetchQuestions();
    }
  }, [chapterId, selectedSession, selectedYear, startQuestionIndex]);

  // Auto-expand the active question's year/session group
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      const q = questions[currentIndex];
      const year = q.year || 2025;
      const session = q.session || (q.examType === 'JEE' ? 'January' : q.examType);
      const key = `${q.examType}-${year}-${session}`;
      setExpandedGroupKey(key);
    }
  }, [questions, currentIndex]);

  // Handle Timer ticking
  useEffect(() => {
    if (sessionFinished) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      // Track session total seconds continuously
      setSessionTotalSeconds(prev => prev + 1);

      if (timerMode === 'countdown') {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerMode, sessionFinished]);

  // Reset per-question timers when question index changes and scroll webpage to the top
  useEffect(() => {
    setTimeElapsed(0);
    setTimeRemaining(120); // 2 minutes (120 seconds) limit per question
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [currentIndex]);

  // Scroll to top when the user finishes a practice session
  useEffect(() => {
    if (sessionFinished) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }
  }, [sessionFinished]);

  // Timer Toggle Click
  const toggleTimerMode = () => {
    setTimerMode(prev => prev === 'countdown' ? 'stopwatch' : 'countdown');
  };

  // Formatting Timer
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Select Option Answer Card
  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    const activeQ = questions[currentIndex];
    if (isSubmitted[activeQ.id]) return; // locked after submission

    setUserAnswers(prev => ({
      ...prev,
      [activeQ.id]: option
    }));
  };

  // Mark for Review click
  const handleMarkForReview = () => {
    const activeQ = questions[currentIndex];
    setMarkedForReview(prev => ({
      ...prev,
      [activeQ.id]: !prev[activeQ.id]
    }));
  };

  // Submit Answer validation Click
  const handleSubmitAnswer = () => {
    const activeQ = questions[currentIndex];
    const selected = userAnswers[activeQ.id];
    
    if (!selected) return; // Must select an answer first
    
    const isAnsCorrect = selected === activeQ.correctAnswer;
    
    // Choose dynamic, friendly visual feedback message
    const correctQuotes = [
      "🎯 Bullseye! Concept Clear Hai.",
      "🔥 Sahi Pakde Hain!",
      "🚀 Rank Ki Taraf Ek Aur Kadam.",
      "💪 PYQ Warrior Moment!",
      "🏆 Exam Mein Bhi Aisa Hi Karna Hai.",
      "⚡ Concept Locked In.",
      "🌟 Brilliant! Yeh Question Ab Tumhara Hai.",
      "🎉 Study Yatri On Fire!"
    ];
    const incorrectQuotes = [
      "💡 Koi Baat Nahi, Isi Liye Practice Kar Rahe Hain.",
      "🎯 Yeh Concept Revision Maangta Hai.",
      "📚 Galti Nahi, Learning Point Hai.",
      "🔄 Ek Baar Explanation Dekho Aur Dobara Try Karo.",
      "🚀 Rankers Bhi Aise Hi Seekhte Hain.",
      "🧠 Concept Thoda Hil Gaya, Chalo Mazboot Karte Hain.",
      "🔥 Mistakes Today = Marks Tomorrow.",
      "📖 Is Topic Ko Ek Quick Revision Do."
    ];

    const chosenFeedback = isAnsCorrect
      ? correctQuotes[Math.floor(Math.random() * correctQuotes.length)]
      : incorrectQuotes[Math.floor(Math.random() * incorrectQuotes.length)];

    setFeedbackMessages(prev => ({
      ...prev,
      [activeQ.id]: chosenFeedback
    }));

    // Update running streak state
    let nextStreak = consecutiveCorrect;
    if (isAnsCorrect) {
      nextStreak += 1;
    } else {
      nextStreak = 0;
    }
    setConsecutiveCorrect(nextStreak);

    setIsSubmitted(prev => ({
      ...prev,
      [activeQ.id]: true
    }));

    setShowExplanation(prev => ({
      ...prev,
      [activeQ.id]: true
    }));

    // Post attempt tracking record to Cloud SQL PostgreSQL
    (async () => {
      try {
        const idToken = await getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
        await fetch(`${API_BASE_URL}/api/attempts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            questionId: activeQ.id,
            selectedAnswer: selected,
            correct: isAnsCorrect
          })
        });
      } catch (err) {
        console.error("Could not write attempt record to PostgreSQL:", err);
      }
    })();

    // Trigger toast milestones with beautiful audio-visual feedback
    const triggerMilestone = (title: string, desc: string, iconKind: any) => {
      setMilestoneToast({ title, description: desc, icon: iconKind });
      setShowConfetti(true);
      setTimeout(() => {
        setMilestoneToast(null);
      }, 4500);
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    };

    // 1. Hot Streaks checks
    if (nextStreak === 5) {
      triggerMilestone("🔥 Hot Streak!", "5 Consecutive Correct Answers.", "streak5");
    } else if (nextStreak === 10) {
      triggerMilestone("🚀 Momentum Build Ho Raha Hai!", "10 Correct Answers.", "streak10");
    }

    // 2. Goal completion check
    // Solve count baseline is 38. Each correct answer adds to it.
    // Count correctness before this solve:
    let activeCorrectsCount = 0;
    questions.forEach(q => {
      if (isSubmitted[q.id] && userAnswers[q.id] === q.correctAnswer) {
        activeCorrectsCount++;
      }
    });
    const priorSolvedToday = 38 + activeCorrectsCount;
    const finalSolvedToday = priorSolvedToday + (isAnsCorrect ? 1 : 0);
    if (priorSolvedToday < 50 && finalSolvedToday >= 50) {
      triggerMilestone("🎉 Aaj Ka Goal Achieved.", "Consistency Wins.", "goalComplete");
    }

    // 3. Platform Century milestone check
    const cumulativeTotalSolved = 97 + (Object.keys(isSubmitted).length + 1);
    if (cumulativeTotalSolved === 100) {
      triggerMilestone("💯 Century Complete!", "100 Questions Solved.", "solved100");
    }

    // 4. Chapter Completed check
    const nextSubmitted = { ...isSubmitted, [activeQ.id]: true };
    const allSolved = questions.every(q => nextSubmitted[q.id]);
    if (allSolved) {
      triggerMilestone("🏁 Chapter Conquered!", "Ek Aur Milestone Complete.", "chapterComplete");
    }
  };

  // Navigation Questions
  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Core Evaluation and Save to Storage on Finish Session
  const handleFinishSession = () => {
    if (sessionFinished) return;
    
    // Calculate stats
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;

    questions.forEach(q => {
      if (isSubmitted[q.id]) {
        attempted++;
        if (userAnswers[q.id] === q.correctAnswer) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const timeSpentInMins = Math.ceil(sessionTotalSeconds / 60);
    
    // Save to study streak heatmap tracker
    if (chapter) {
      addStudySessionToStreak(correct, chapter.name, Math.max(1, timeSpentInMins));
      
      // Calculate progress percentage and record it back
      const totalAttemptedInDb = Object.keys(isSubmitted).length;
      const progressPercent = Math.round((correct / questions.length) * 100);
      updateChapterProgress(chapter.id, progressPercent);
    }

    setSessionFinished(true);
  };

  const handleRestartChapter = () => {
    setUserAnswers({});
    setIsSubmitted({});
    setMarkedForReview({});
    setShowExplanation({});
    setTimeRemaining(120);
    setTimeElapsed(0);
    setSessionTotalSeconds(0);
    setCurrentIndex(0);
    setSessionFinished(false);
  };

  if (loadError) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Could Not Load Questions</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{loadError}</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!chapter || questions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 animate-pulse">
        <Hourglass className="h-10 w-10 animate-spin mx-auto text-blue-500 mb-3" />
        <p className="text-sm font-semibold">Loading practice environment questions...</p>
      </div>
    );
  }

  // Active question pointers
  let rawActiveQuestion = questions[currentIndex];
  if (rawActiveQuestion && !rawActiveQuestion.options) {
    rawActiveQuestion = {
      ...rawActiveQuestion,
      options: {
        A: (rawActiveQuestion as any).optionA || (rawActiveQuestion as any).option_a || '',
        B: (rawActiveQuestion as any).optionB || (rawActiveQuestion as any).option_b || '',
        C: (rawActiveQuestion as any).optionC || (rawActiveQuestion as any).option_c || '',
        D: (rawActiveQuestion as any).optionD || (rawActiveQuestion as any).option_d || ''
      }
    };
  }

  const activeQuestion = rawActiveQuestion || {
    id: 'placeholder',
    chapterId: '',
    examType: 'JEE',
    subject: 'Physics',
    year: 2024,
    questionText: 'Loading question content...',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
    concept: '',
    difficulty: 'Easy'
  };

  const activeSelectedValue = userAnswers[activeQuestion.id] || '';
  const isActiveSubmitted = isSubmitted[activeQuestion.id] || false;
  const isActiveMarked = markedForReview[activeQuestion.id] || false;
  const isCorrect = activeSelectedValue === activeQuestion.correctAnswer;

  // Question Palette CSS codes helper
  const getPaletteClass = (index: number): string => {
    const q = questions[index];
    if (!q) return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    const isSub = isSubmitted[q.id];
    const userVal = userAnswers[q.id];
    const isMarked = markedForReview[q.id];

    if (currentIndex === index) {
      return 'border-2 border-blue-600 bg-blue-100 dark:bg-blue-950 font-bold text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20';
    }

    if (isSub) {
      const isRight = userVal === q.correctAnswer;
      return isRight 
        ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' // Correct
        : 'bg-red-500 text-white border-red-500 hover:bg-red-650'; // Wrong
    }

    if (isMarked) {
      return 'bg-amber-400 text-slate-900 border-amber-400 font-bold hover:bg-amber-500'; // Yellow = Marked
    }

    if (userVal) {
      return 'bg-slate-400 text-white border-slate-400 hover:bg-slate-500'; // Unsubmitted but answered
    }

    return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'; // Gray unattempted
  };

  // Mock Schematics for beautiful EdTech layout feels when actual Images do not exist
  const renderMockApparatusDiagram = (subjectName: string, index: number) => {
    if (subjectName === 'Physics') {
      return (
        <div className="my-4 p-4 rounded-2xl bg-slate-900 text-cyan-405 font-mono border border-slate-800 flex flex-col items-center justify-center space-y-2 relative overflow-hidden h-36">
          <div className="absolute top-2 right-2 text-[8px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-500">
            [CIRCUIT SCHEMATIQUE]
          </div>
          <svg className="w-48 h-20 text-cyan-500" viewBox="0 0 200 80">
            {/* Battery */}
            <line x1="10" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
            <line x1="40" y1="30" x2="40" y2="50" stroke="currentColor" strokeWidth="3" />
            <line x1="46" y1="35" x2="46" y2="45" stroke="currentColor" strokeWidth="1.5" />
            <line x1="46" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="2" />
            
            {/* Inductor/Resistor coil */}
            <path d="M 80 40 Q 85 30 90 40 Q 95 30 100 40 Q 105 30 110 40 Q 115 30 120 40" fill="none" stroke="currentColor" strokeWidth="2" />
            
            {/* Core Cap */}
            <line x1="120" y1="40" x2="150" y2="40" stroke="currentColor" strokeWidth="2" />
            <line x1="150" y1="30" x2="150" y2="50" stroke="currentColor" strokeWidth="2.5" />
            <line x1="156" y1="30" x2="156" y2="50" stroke="currentColor" strokeWidth="2.5" />
            <line x1="156" y1="40" x2="190" y2="40" stroke="currentColor" strokeWidth="2" />
            
            {/* Connections */}
            <line x1="10" y1="40" x2="10" y2="70" stroke="currentColor" strokeWidth="1.5" />
            <line x1="190" y1="40" x2="190" y2="70" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="70" x2="190" y2="70" stroke="currentColor" strokeWidth="1.5" />
            
            {/* Labels */}
            <text x="35" y="25" fill="currentColor" fontSize="8">V_in</text>
            <text x="95" y="25" fill="currentColor" fontSize="8">L_coil</text>
            <text x="145" y="25" fill="currentColor" fontSize="8">C</text>
          </svg>
          <p className="text-[10px] text-slate-450 tracking-wider">Fig L-1: Equivalent Impedance analysis circuit vector</p>
        </div>
      );
    }

    if (subjectName === 'Chemistry') {
      return (
        <div className="my-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-2 h-36">
          <svg className="w-20 h-24 text-emerald-400" viewBox="0 0 100 120">
            {/* Beaker / flask */}
            <path d="M 35 20 L 35 40 L 15 100 A 10 10 0 0 0 25 110 L 75 110 A 10 10 0 0 0 85 100 L 65 40 L 65 20 Z" fill="none" stroke="currentColor" strokeWidth="3" />
            {/* Chemical fluid bubbles */}
            <path d="M 20 90 Q 50 95 80 90 L 78 102 L 22 102 Z" fill="currentColor" opacity="0.3" />
            <circle cx="35" cy="80" r="3" fill="currentColor" opacity="0.8" />
            <circle cx="50" cy="70" r="2.5" fill="currentColor" opacity="0.8" />
            <circle cx="65" cy="85" r="4" fill="currentColor" opacity="0.8" />
            <circle cx="42" cy="55" r="2" fill="currentColor" opacity="0.8" />
          </svg>
          <span className="text-[9px] text-slate-400 font-mono">Organic equilibrium concentration ratio state setup</span>
        </div>
      );
    }

    if (subjectName === 'Mathematics') {
      return (
        <div className="my-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center h-36">
          <svg className="w-48 h-20 text-purple-400" viewBox="0 0 200 80">
            {/* Coordinate Axis */}
            <line x1="10" y1="70" x2="190" y2="70" stroke="currentColor" opacity="0.5" strokeWidth="1" />
            <line x1="20" y1="5" x2="20" y2="75" stroke="currentColor" opacity="0.5" strokeWidth="1" />
            
            {/* Sinusoidal Curve / Parabola */}
            <path d="M 20 70 Q 60 10 100 70 T 180 70" fill="none" stroke="currentColor" strokeWidth="2.5" />
            
            {/* Grid references */}
            <line x1="60" y1="70" x2="60" y2="40" stroke="currentColor" strokeDasharray="3" />
            <text x="50" y="78" fill="currentColor" fontSize="7">x = u</text>
            <text x="135" y="45" fill="currentColor" fontSize="9">f(x) = area under z</text>
          </svg>
        </div>
      );
    }

    return null;
  };

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm font-medium text-slate-500">Loading practice session or finding chapter...</p>
          <button 
            onClick={onExit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
      
      {/* HEADER SECTION PANEL */}
      <header className="sticky top-16 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Left info exit */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onExit}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Return to chapter choice"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-left">
              {/* Dynamic Exam/Year/Session Display Header */}
              <h1 className="text-base sm:text-lg font-black font-poppins text-slate-900 dark:text-white tracking-tight">
                {chapter.exam === 'JEE' ? 'JEE Main' : chapter.exam} {selectedYear !== 'All' ? selectedYear : (questions[currentIndex]?.year || '2025')} {
                  questions[currentIndex]?.examDate
                    ? new Date(questions[currentIndex].examDate as string).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                    : (selectedSession !== 'All' ? selectedSession : (questions[currentIndex]?.session && questions[currentIndex]?.session !== 'All' ? questions[currentIndex]?.session : ''))
                }
              </h1>
              <p className="text-[11px] text-slate-400 font-medium font-mono uppercase mt-0.5">
                Chapter: <strong className="text-blue-600 dark:text-blue-400">{chapter.name}</strong>
              </p>
            </div>


          </div>

          {/* TIMER ZONE (Countdown & Stopwatch toggler) */}
          <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={toggleTimerMode}
              className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350 py-1 px-2.5 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer select-none hover:bg-slate-50"
              title="Click to toggle timer style"
            >
              <Clock className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
              <span>{timerMode === 'countdown' ? 'Countdown' : 'Stopwatch'}</span>
            </button>
            
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
              {timerMode === 'countdown' ? formatTime(timeRemaining) : formatTime(timeElapsed)}
            </span>
          </div>

          {/* Quick exit status */}
          <div className="hidden">
            <button
              id="exit-practice-session"
              onClick={handleFinishSession}
              className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Submit & End Exam
            </button>
          </div>

        </div>

      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* SESSION SUMMARY SCREEN IF FINISHED */}
        {sessionFinished ? (
          <div id="session-summary-box" className="max-w-xl mx-auto py-12 px-6 sm:px-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium dark:shadow-premium-dark text-center space-y-8 animate-slide-up">
            
            {/* Visual Success Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto outline outline-8 outline-emerald-500/10">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold font-poppins text-slate-900 dark:text-white">
                Practice Session Ended!
              </h2>
              <p className="text-xs text-slate-400">
                Lafjo ko badalein, result check karein. Stats are saved live in consistency heatmap.
              </p>
            </div>

            {/* Score matrix card */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Total Attempted</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono">
                  {Object.keys(isSubmitted).length} / {questions.length}
                </span>
                <span className="block text-[9px] text-slate-440 mt-1">Questions evaluation ratio</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Correct Answers</span>
                <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {questions.filter(q => isSubmitted[q.id] && userAnswers[q.id] === q.correctAnswer).length} Correct
                </span>
                <span className="block text-[9px] text-slate-440 mt-1">Net accuracy points</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Test Accuracy</span>
                <span className="text-2xl font-extrabold text-blue-500 font-mono">
                  {Object.keys(isSubmitted).length > 0 
                    ? Math.round((questions.filter(q => isSubmitted[q.id] && userAnswers[q.id] === q.correctAnswer).length / Object.keys(isSubmitted).length) * 100)
                    : 0}%
                </span>
                <span className="block text-[9px] text-slate-440 mt-1">Correct attempt ratio</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Time Invested</span>
                <span className="text-2xl font-extrabold text-purple-500 font-mono">
                  {formatTime(sessionTotalSeconds)}
                </span>
                <span className="block text-[9px] text-slate-440 mt-1">Stopwatch record</span>
              </div>

            </div>

            {/* Bottom Actions footer */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                id="sum-restart-chapter"
                onClick={handleRestartChapter}
                className="w-full py-3 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-sm font-bold font-poppins flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Restart Chapter Tests</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="sum-continue-later"
                  onClick={onExit}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Continue Later
                </button>
                <button
                  id="sum-return-dashboard"
                  onClick={onExit}
                  className="py-2.5 bg-slate-800 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-655 text-white rounded-xl text-xs font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ACTIVE CLASSROOM TESTING GRID PANELS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Main Questions testing room */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6 text-left">
              
              {/* Question area box card header */}
              <div 
                id="current-question-board"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6"
              >
                
                {/* Headers and Exam meta tag labels */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-slate-400">
                      Q{currentIndex + 1}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      activeQuestion.difficulty === 'Easy' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                        : activeQuestion.difficulty === 'Medium'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-red-100 text-red-00 dark:bg-red-950/60 dark:text-red-400'
                    }`}>
                      {activeQuestion.difficulty} Level
                    </span>
                  </div>

                  {/* Exam tag and Year tag */}
                  <div className="flex items-center space-x-1">
                    <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase font-poppins">
                      {activeQuestion.examType}
                    </span>
                    <span className="bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded font-mono">
                      {activeQuestion.year}
                    </span>
                  </div>
                </div>

                {/* Subscripts-Math friendly Question text prompt */}
                <div className="space-y-4">
                  <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                    {activeQuestion.questionText}
                  </p>

                  {(activeQuestion.imageUrl || (activeQuestion as any).image_url) && (
                    <div className="my-4 rounded-xl overflow-hidden border border-gray-700">
                      <img 
                        src={activeQuestion.imageUrl || (activeQuestion as any).image_url}
                        alt="Question diagram"
                        className="w-full object-contain max-h-80 rounded-xl"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* Question Options Multiple Choice Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const isSelected = activeSelectedValue === key;
                    const optionVal = activeQuestion.options[key];
                    
                    // Style states: Submitted correct/incorrect colors
                    let cardStyle = 'border-slate-200 dark:border-slate-700 hover:border-slate-350 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
                    
                    if (isSelected) {
                      cardStyle = 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500/25';
                    }

                    if (isActiveSubmitted) {
                      const isCorrectOption = activeQuestion.correctAnswer === key;
                      if (isCorrectOption) {
                        cardStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold';
                      } else if (isSelected) {
                        cardStyle = 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-800 dark:text-red-400 ring-2 ring-red-500/30';
                      } else {
                        cardStyle = 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={key}
                        id={`option-${key}`}
                        onClick={() => handleSelectOption(key)}
                        disabled={isActiveSubmitted}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex items-start space-x-3 cursor-pointer focus:outline-none ${cardStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : isActiveSubmitted && activeQuestion.correctAnswer === key
                            ? 'bg-emerald-500 text-white'
                            : isActiveSubmitted && isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {key}
                        </span>
                        <span className="text-sm leading-snug">{optionVal}</span>
                      </button>
                    );
                  })}
                </div>

                {/* BOTTOM NAVIGATION CONTROLS */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <button
                      id="practice-prev-btn"
                      onClick={handlePrevQuestion}
                      disabled={currentIndex === 0}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    
                    <button
                      id="practice-next-btn"
                      onClick={handleNextQuestion}
                      disabled={currentIndex === questions.length - 1}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Save to Pit Stop */}
                    <button
                      id="practice-save-pitstop"
                      onClick={() => setIsSaveModalOpen(true)}
                      className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-955 dark:hover:bg-blue-950 text-blue-650 dark:text-blue-400 rounded-xl text-xs font-semibold border border-blue-200/50 dark:border-blue-800/50 flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Save active question to custom collections"
                    >
                      <span>🧭 Save to Pit Stop</span>
                    </button>

                    {/* Mark for review */}
                    <button
                      id="practice-mark-review"
                      onClick={handleMarkForReview}
                      disabled={isActiveSubmitted}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isActiveMarked
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-205 dark:border-slate-700'
                      }`}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      <span>{isActiveMarked ? 'Marked Review' : 'Mark For Review'}</span>
                    </button>

                    {/* Submit Option */}
                    <button
                      id="practice-submit-answer"
                      onClick={handleSubmitAnswer}
                      disabled={!activeSelectedValue || isActiveSubmitted}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {isActiveSubmitted ? 'Answer Locked' : 'Submit Answer'}
                    </button>
                  </div>
                </div>

              </div>

              {/* ANSWER EXPLANATION REVEAL PANEL PANEL */}
              {isActiveSubmitted && showExplanation[activeQuestion.id] && (
                <div 
                  id="explanation-expansion-panel" 
                  className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left space-y-4 animate-slide-up"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm font-extrabold font-poppins text-slate-900 dark:text-white">
                        {feedbackMessages[activeQuestion.id] || (isCorrect ? "🎯 Bullseye! Concept Clear Hai." : "💡 Koi Baat Nahi, Isi Liye Practice Kar Rahe Hain.")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Correct key: <strong className="text-emerald-600 font-mono text-sm">{activeQuestion.correctAnswer}</strong></span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 rounded-r-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Core Concept Used:</span>
                      <p className="text-xs font-bold font-poppins text-blue-800 dark:text-blue-300 mt-1">
                        {activeQuestion.concept}
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-l-2 border-indigo-500 rounded-r-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Exam Type:</span>
                      <p className="text-xs font-bold text-indigo-805 dark:text-indigo-300 mt-1">
                        {activeQuestion.examType} Physics/Chemistry • PYQ {activeQuestion.year} Chapter Drills
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Step-By-Step Solution Explanation:</span>
                    <p className="text-sm text-slate-655 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans mt-1">
                      {activeQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Dynamic Year Directory or Question Palette */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
              
              {sidebarViewMode === 'year-list' ? (
                /* 1. YEAR DIRECTORY & WRITTEN QUESTIONS LISTING */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold font-poppins text-slate-900 dark:text-white uppercase tracking-wider">
                        Year Directory
                      </h3>
                      <p className="text-[11px] text-slate-405 mt-0.5 description-label">Select a year to see written questions</p>
                    </div>
                    {/* Toggle button to return to palette if a question is already active */}
                    {questions.length > 0 && (
                      <button
                        onClick={() => setSidebarViewMode('question-palette')}
                        className="text-[10px] font-extrabold font-poppins px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 transition cursor-pointer"
                        title="Open Question Palette Grid"
                      >
                        Palette Grid
                      </button>
                    )}
                  </div>

                  {/* Year Accordions */}
                  <div className="space-y-3 pt-1 max-h-[480px] overflow-y-auto pr-1">
                    {groupedQuestions.map((group) => {
                      const isExpanded = expandedGroupKey === group.key;
                      return (
                        <div 
                          key={group.key} 
                          className={`rounded-2xl border transition-all ${
                            isExpanded 
                              ? 'border-blue-500/30 bg-blue-500/5 dark:border-blue-500/20 dark:bg-blue-500/2' 
                              : 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/55 dark:hover:bg-slate-900/30'
                          }`}
                        >
                          {/* Accordion Trigger Header */}
                          <button
                            onClick={() => setExpandedGroupKey(isExpanded ? null : group.key)}
                            className="w-full flex items-center justify-between p-4 focus:outline-none cursor-pointer"
                          >
                            <div className="text-left space-y-0.5">
                              <span className={`text-xs font-black font-poppins tracking-tight block ${isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-355'}`}>
                                {group.label}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 font-bold block">
                                {group.items.length} Questions Available
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-blue-505 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                          </button>

                          {/* Accordion Contents (List of questions in written format) */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 dark:border-slate-800 p-2.5 space-y-2 max-h-[280px] overflow-y-auto bg-white/70 dark:bg-slate-900/40 rounded-b-2xl">
                              {group.items.map((item) => {
                                const q = item.question;
                                const idx = item.globalIndex;
                                const isSelected = currentIndex === idx;
                                const isCorrectOption = isSubmitted[q.id] && userAnswers[q.id] === q.correctAnswer;
                                const isWrongOption = isSubmitted[q.id] && userAnswers[q.id] !== q.correctAnswer;
                                const isMarked = markedForReview[q.id];

                                let statusBg = 'border-slate-150 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850/80 text-slate-705 dark:text-slate-300';
                                if (isSelected) {
                                  statusBg = 'border-blue-500 bg-blue-50 dark:bg-blue-955 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500/20';
                                } else if (isCorrectOption) {
                                  statusBg = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-955 text-emerald-800 dark:text-emerald-350';
                                } else if (isWrongOption) {
                                  statusBg = 'border-red-500 bg-red-50/50 dark:bg-red-955 text-red-00 dark:text-red-350';
                                } else if (isMarked) {
                                  statusBg = 'border-amber-400 bg-amber-500/10 text-amber-805 dark:text-amber-300';
                                }

                                return (
                                  <button
                                    key={q.id}
                                    onClick={() => {
                                      setCurrentIndex(idx);
                                      setSidebarViewMode('question-palette');
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-2.5 transition cursor-pointer font-sans leading-relaxed ${statusBg}`}
                                  >
                                    <div className="flex flex-col items-center justify-start mt-0.5">
                                      <span className={`w-5 h-5 text-[10px] font-black rounded-md flex items-center justify-center shrink-0 ${
                                        isSelected 
                                          ? 'bg-blue-600 text-white' 
                                          : isCorrectOption 
                                          ? 'bg-emerald-500 text-white'
                                          : isWrongOption
                                          ? 'bg-red-500 text-white'
                                          : isMarked
                                          ? 'bg-amber-400 text-slate-900'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                      }`}>
                                        Q{idx + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-205 line-clamp-3">
                                        {q.questionText}
                                      </p>
                                      {/* Marks level detail tag */}
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[8px] font-mono font-bold uppercase px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                          {q.difficulty}
                                        </span>
                                        {isMarked && (
                                          <span className="text-[8px] font-bold uppercase px-1 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400">
                                            Review Listed
                                          </span>
                                        )}
                                        {isSubmitted[q.id] && (
                                          <span className={`text-[8px] font-bold uppercase px-1 rounded ${
                                            isCorrectOption 
                                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                                              : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                                          }`}>
                                            {isCorrectOption ? 'Correct' : 'Incorrect'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 2. TRADITIONAL QUESTION PALETTE NAVIGATION */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-extrabold font-poppins text-slate-900 dark:text-white uppercase tracking-wider">
                        Question Palette
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Quick jump navigation grid</p>
                    </div>
                    {/* Back Button to Directory */}
                    <button
                      onClick={() => setSidebarViewMode('year-list')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold font-poppins flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Year List</span>
                    </button>
                  </div>

                  {/* Grouped by year and session in mini-palette format */}
                  <div className="space-y-4 pt-1 max-h-[380px] overflow-y-auto pr-1">
                    {groupedQuestions.map((group) => {
                      const isCurrentlyActiveGroup = group.items.some(item => item.globalIndex === currentIndex);
                      return (
                        <div 
                          key={group.key} 
                          className={`space-y-2 pb-3 border-b border-dashed border-slate-100 dark:border-slate-850 last:border-0 last:pb-0 ${
                            isCurrentlyActiveGroup ? 'opacity-100' : 'opacity-60 hover:opacity-100 transition'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-black font-poppins uppercase tracking-tight ${
                              isCurrentlyActiveGroup ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500'
                            }`}>
                              {group.label} {isCurrentlyActiveGroup && '🎯'}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-slate-400">
                              {group.items.length} Qs
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {group.items.map((item) => {
                              const q = item.question;
                              const idx = item.globalIndex;
                              const isSelected = currentIndex === idx;
                              const isCorrectOption = isSubmitted[q.id] && userAnswers[q.id] === q.correctAnswer;
                              const isWrongOption = isSubmitted[q.id] && userAnswers[q.id] !== q.correctAnswer;
                              
                              let bgBorder = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900';
                              if (isSelected) {
                                bgBorder = 'border-blue-600 bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-405/50 dark:ring-blue-500/50';
                              } else if (isCorrectOption) {
                                bgBorder = 'border-emerald-500 bg-emerald-500 text-white font-black';
                              } else if (isWrongOption) {
                                bgBorder = 'border-red-500 bg-red-500 text-white font-black';
                              } else if (markedForReview[q.id]) {
                                bgBorder = 'border-amber-400 bg-amber-400 text-slate-900 font-bold';
                              }

                              return (
                                <button
                                  key={q.id}
                                  id={`palette-item-${idx}`}
                                  onClick={() => setCurrentIndex(idx)}
                                  title={`Q${idx + 1}: ${q.questionText.substring(0, 100)}...`}
                                  className={`w-8 h-8 text-xxs rounded-lg border flex items-center justify-center transition-all cursor-pointer font-bold shrink-0 ${bgBorder}`}
                                >
                                  {idx + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legends indicator footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-405 uppercase tracking-widest block font-poppins">Legend Status:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded block" />
                        <span>Correct Answer</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded block" />
                        <span>Wrong Answer</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-amber-400 rounded block" />
                        <span>Marked Review</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded block" />
                        <span>Unattempted</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Milestone Toasts Notifications and Full Frame Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 90 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 3;
              const duration = 2 + Math.random() * 3;
              const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${left}%`,
                    top: `-20px`,
                    backgroundColor: randomColor,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0.8,
                    animation: `fall ${duration}s linear infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes fall {
                0% {
                  transform: translateY(0px) rotate(0deg) translateX(0px);
                  opacity: 1;
                }
                50% {
                  transform: translateY(50vh) rotate(180deg) translateX(20px);
                  opacity: 0.9;
                }
                100% {
                  transform: translateY(110vh) rotate(360deg) translateX(-20px);
                  opacity: 0;
                }
              }
            ` }} />
          </div>
        )}

        {milestoneToast && (
          <div className="fixed bottom-10 right-10 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl ring-2 ring-emerald-500/30 text-left flex items-start space-x-3.5 animate-slide-up text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-sm font-bold font-poppins text-white flex items-center space-x-1.5">
                <span>{milestoneToast.title}</span>
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </h4>
              <p className="text-xs text-slate-300">
                {milestoneToast.description}
              </p>
            </div>
            <button 
              onClick={() => setMilestoneToast(null)}
              className="text-slate-400 hover:text-white justify-end focus:outline-none text-[11px] font-bold font-mono px-1.5 py-0.5 bg-slate-805/80 hover:bg-slate-800 rounded cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        <SaveToPitStopModal
          question={activeQuestion}
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
        />

      </div>

    </div>
  );
}

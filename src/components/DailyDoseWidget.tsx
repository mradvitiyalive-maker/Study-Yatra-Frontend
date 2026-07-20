import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { Sparkles, Trophy, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Layers, GraduationCap, Eye, Play, BookOpen } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface DailyDoseWidgetProps {
  user: UserProfile;
}

interface DailyDoseQuestion {
  id: string;
  date: string;
  examType: string;
  subject: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  correctMotivationMessage?: string;
  wrongMotivationMessage?: string;
}

export default function DailyDoseWidget({ user }: DailyDoseWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<DailyDoseQuestion | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    correctAnswer: string;
    explanation: string;
    motivation: string;
  } | null>(null);
  
  // Custom reviews mode: User enters review mode when they click "Review Today's Question"
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; duration: number; delay: number }[]>([]);

  // Reload question whenever the user's selected exam profile shifts
  useEffect(() => {
    loadTodayDose();
  }, [user.targetExam, user.firebaseUid]);

  const loadTodayDose = async () => {
    try {
      setLoading(true);
      setIsReviewMode(false);
      setSelectedOption(null);
      setResult(null);
      
      let token = await getAuthToken() || '';

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/daily-dose/today?targetExam=${user.targetExam}&userId=${user.firebaseUid || 'guest'}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          setQuestion(data.question);
          setCompleted(data.completed);
          
          if (data.completed && data.attempt) {
            setResult({
              correct: data.attempt.correct,
              correctAnswer: data.question.correctAnswer,
              explanation: data.question.explanation,
              motivation: data.attempt.correct 
                ? (data.question.correctMotivationMessage || "Keep it up, champ! You got it right! 🎉")
                : (data.question.wrongMotivationMessage || "Don't discourage yourself. Mistakes are the path to learning! 📚")
            });
            setSelectedOption(data.attempt.answer);
          }
        } else {
          setQuestion(null);
        }
      }
    } catch (e) {
      console.error('Failed to load Daily Dose widget contents:', e);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfettiBurst = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
    const newConfetti = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.4
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 4500);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !question || submitting || completed) return;
    
    try {
      setSubmitting(true);
      let token = await getAuthToken() || '';

      const res = await fetch(`${API_BASE_URL}/api/daily-dose/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          dailyDoseId: question.id,
          answer: selectedOption,
          userId: user.firebaseUid || 'guest'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCompleted(true);
        setResult({
          correct: data.correct,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          motivation: data.motivation
        });
        
        if (data.correct) {
          triggerConfettiBurst();
        }
      }
    } catch (e) {
      console.error('Failed to submit daily dose option:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-xs text-slate-400 mt-3 font-mono">Loading Daily Dose...</span>
      </div>
    );
  }

  if (!question) {
    return null; // Empty placeholder if no question targets their active exam setting
  }

  const optionKeys = ['A', 'B', 'C', 'D'];
  const optionValues = [question.optionA, question.optionB, question.optionC, question.optionD];

  return (
    <div 
      className={`relative bg-gradient-to-br from-slate-55 to-white dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-premium dark:shadow-premium-dark overflow-hidden transition-all duration-300 ${
        result?.correct && completed ? 'ring-2 ring-emerald-500/30' : ''
      }`}
      style={{
        animation: result?.correct && completed ? 'success-glow-pulse 3s infinite' : 'none'
      }}
    >
      {/* Absolute Confetti Burst Elements */}
      {confetti.map(p => (
        <div
          key={p.id}
          className="absolute bottom-0 w-2.5 h-2.5 rounded-full pointer-events-none"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animation: `confetti-fall-anim ${p.duration}s ease-out ${p.delay}s forwards`,
            zIndex: 40
          }}
        />
      ))}

      {/* Styled Embed Code injects dynamic CSS keyframes for custom CPU-safe animations */}
      <style>{`
        @keyframes confetti-fall-anim {
          0% {
            transform: translateY(50px) rotate(0deg) scale(0);
            opacity: 1;
          }
          15% {
            opacity: 1;
            transform: translateY(-25vh) rotate(90deg) scale(1.3);
          }
          100% {
            transform: translateY(40vh) rotate(360deg) scale(0.6);
            opacity: 0;
          }
        }
        @keyframes success-glow-pulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.1), inset 0 0 10px rgba(16, 185, 129, 0.05);
          }
          50% {
            box-shadow: 0 0 35px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.1);
          }
        }
      `}</style>

      {/* Header Widget Badges */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-100 dark:bg-amber-950/60 p-1.5 rounded-xl text-amber-600 dark:text-amber-400">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono block">Study Yatra Specials</span>
            <span className="text-sm font-extrabold font-poppins text-slate-800 dark:text-slate-200">
              Daily Dose by Study Yatra
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide border border-blue-100/50 dark:border-blue-900/30">
            {question.examType}
          </span>
          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide border border-emerald-100/50 dark:border-emerald-900/30">
            {question.subject}
          </span>
        </div>
      </div>

      {/* COMPLETED OVERLAY HERO CARD: Only visible if completed and NOT actively exploring review mode */}
      {completed && !isReviewMode ? (
        <div className="py-8 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in relative z-10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-250 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
            <CheckCircle className="h-8 w-8" />
          </div>
          
          <div className="space-y-1">
            <h4 className="text-xl font-extrabold font-poppins text-slate-850 dark:text-white">
              🎯 Completed Today!
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You have completed today's interactive question. Great job maintaining consistency! One question daily clears the track to college ranks.
            </p>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-4 max-w-md w-full text-left">
            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>{result?.correct ? '🎉 Correct Motivation_vibe' : '📚 Learning motivation_vibe'}</span>
            </div>
            <p className="text-sm font-medium italic text-slate-700 dark:text-slate-350 leading-relaxed font-sans">
              "{result?.motivation}"
            </p>
          </div>

          <button
            onClick={() => setIsReviewMode(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>Review Today's Question</span>
          </button>
        </div>
      ) : (
        /* ACTIVE QUESTION WORKSPACE or REVIEW MODE DISPLAY */
        <div className="space-y-5 text-left relative z-10">
          
          {/* Locked Review Banner indicator */}
          {completed && isReviewMode && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-semibold animate-fade-in mb-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />
              <p>
                <strong>Review Mode Active:</strong> You completed this dose. Reattempts are disabled to secure authenticity.
              </p>
            </div>
          )}

          {/* Core Question Body (with visual Blur if completed and not reviewed yet for curiosity) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Question:</span>
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-150 leading-relaxed font-poppins">
              {question.question}
            </p>
          </div>

          {/* Option Checkboxes Container */}
          <div className="grid grid-cols-1 gap-3">
            {optionKeys.map((key, index) => {
              const optionText = optionValues[index];
              if (!optionText) return null;

              const isSelected = selectedOption === key;
              const isCorrectAnswerValue = question.correctAnswer === key;
              
              // Computed styles for options depending on mode
              let optionClass = "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-305";
              
              if (isSelected && !completed) {
                // Pre-submit selection highlight
                optionClass = "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/20";
              } else if (completed) {
                // Post-submit evaluation style rules
                if (isCorrectAnswerValue) {
                  // True Correct option green marker
                  optionClass = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20";
                } else if (isSelected && !result?.correct) {
                  // User chose a wrong option, highlighting read
                  optionClass = "border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-800 dark:text-red-350 ring-2 ring-red-500/20 animate-shake";
                } else {
                  // Non-selected options
                  optionClass = "opacity-60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={key}
                  disabled={completed}
                  onClick={() => setSelectedOption(key)}
                  className={`w-full flex items-start space-x-3 p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 text-sm ${optionClass}`}
                >
                  <div className={`w-6 h-6 rounded-lg font-mono flex items-center justify-center text-xs font-bold border shrink-0 transition-colors ${
                    isSelected && !completed 
                      ? 'bg-blue-500 text-white border-blue-500'
                      : completed && isCorrectAnswerValue
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : completed && isSelected && !result?.correct
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750'
                  }`}>
                    {key}
                  </div>
                  <span className="leading-tight font-medium self-center">{optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Submittals actions area / Outcome details */}
          {!completed && (
            <div className="flex justify-end pt-2">
              <button
                disabled={!selectedOption || submitting}
                onClick={handleSubmitAnswer}
                className={`px-6 py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
                  selectedOption && !submitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{submitting ? 'Evaluating...' : 'Submit Answer'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Post Submission results panel & explanation block */}
          {completed && (
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in text-left">
              
              {/* Evaluative Tag and Motivation statement */}
              <div className={`p-4 rounded-2xl flex items-start space-x-3 border ${
                result?.correct 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' 
                  : 'bg-red-50/40 dark:bg-red-950/15 border-red-100 dark:border-red-950/20'
              }`}>
                {result?.correct ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Trophy className="h-4.5 w-4.5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                )}
                <div className="space-y-1">
                  <h5 className={`text-sm font-extrabold font-poppins ${result?.correct ? 'text-emerald-800 dark:text-emerald-450' : 'text-red-800 dark:text-red-400'}`}>
                    {result?.correct ? '🎉 Correct!' : '📚 Learning Moment'}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
                    "{result?.motivation}"
                  </p>
                </div>
              </div>

              {/* Solid Explanation block */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 font-sans text-xs">
                <div className="flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Explanation & Concept Notes</span>
                </div>
                <div className="space-y-1 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100/50 dark:border-slate-850">
                  <span className="font-bold text-slate-500 dark:text-slate-450 uppercase text-[9px] block">Correct Option:</span>
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-100 font-mono">
                    Option {question.correctAnswer} - {optionValues[optionKeys.indexOf(question.correctAnswer)]}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-350 leading-relaxed font-normal whitespace-pre-wrap">
                  {result?.explanation}
                </div>
              </div>

              {/* Review Dismiss Actions */}
              {isReviewMode && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setIsReviewMode(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Close Review Panel
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  );
}

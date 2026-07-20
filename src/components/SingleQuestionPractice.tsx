import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Compass, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Question } from '../types';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';

interface SingleQuestionPracticeProps {
  questionId: string;
  stopoverId?: string;
  onNavigateBack: (targetStopoverId?: string) => void;
}

export default function SingleQuestionPractice({
  questionId,
  stopoverId,
  onNavigateBack
}: SingleQuestionPracticeProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [stopoverTitle, setStopoverTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive answer states
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    async function loadQuestionAndStopover() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Question details
        const qRes = await fetch(`${API_BASE_URL}/api/questions/${questionId}`);
        if (!qRes.ok) {
          throw new Error('This checkpoint question could not be found in our database.');
        }
        const qData = await qRes.json();
        setQuestion(qData);

        // 2. Clear practice state when question changes
        setSelectedAnswer(null);
        setSubmitted(false);
        setFeedback('');

        // 3. Fetch stopover title if stopoverId is provided 
        if (stopoverId) {
          const token = await getAuthToken() || '';
          const sRes = await fetch(`${API_BASE_URL}/api/pit-stops`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.success && sData.pitStops) {
              const matched = sData.pitStops.find((stop: any) => String(stop.id) === String(stopoverId));
              if (matched) {
                setStopoverTitle(matched.title);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load practice question details:', err);
        setError(err.message || 'Failed to communicate with database.');
      } finally {
        setLoading(false);
      }
    }

    loadQuestionAndStopover();
  }, [questionId, stopoverId]);

  const handleCheckAnswer = () => {
    if (!question || !selectedAnswer) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    setSubmitted(true);

    if (isCorrect) {
      const positiveQuotes = [
        "🎯 Outstanding solve! Concept clear as crystal.",
        "🔥 Incredible! You have answered perfectly.",
        "💡 Brilliant correction tracking! Spot on.",
        "🚀 Bullseye! Your preparation is looking very strong."
      ];
      setFeedback(positiveQuotes[Math.floor(Math.random() * positiveQuotes.length)]);
    } else {
      setFeedback(`Incorrect. The correct statement option is ${question.correctAnswer}. Try checking the explanation details.`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-sm mx-auto space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs font-bold text-slate-500 font-mono tracking-wider uppercase animate-pulse">
          Loading Station Checkpoint...
        </p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4 px-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded-r-2xl text-red-800 dark:text-red-400 text-xs font-semibold flex items-center space-x-2 text-left">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Checkpoint question could not be loaded.'}</span>
        </div>
        <button
          onClick={() => onNavigateBack(stopoverId)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition"
        >
          Return to Checkpoints Station
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Navigation action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => onNavigateBack(stopoverId)}
          className="inline-flex items-center space-x-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition duration-150 ease-in-out cursor-pointer group"
        >
          <ArrowLeft className="h-4.5 w-4.5 transform group-hover:-translate-x-0.5 transition-transform" />
          <span className="hover:underline tracking-wide uppercase font-poppins text-[10px]">← My Checkpoint Station</span>
        </button>

        <div className="text-left sm:text-right">
          <h3 className="text-xs font-black font-poppins text-slate-400 uppercase tracking-widest">
            🛑 Study Yatra's Stopovers
          </h3>
          {stopoverTitle && (
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-poppins">
              Collection: {stopoverTitle}
            </p>
          )}
        </div>
      </div>

      {/* Main Single Practice Question Card Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 text-left shadow-sm">
        
        {/* Badges metadata info bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono font-medium text-slate-400">
            <span>Checkport ID: #{question.id}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
              question.difficulty === 'Easy' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                : question.difficulty === 'Medium'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
            }`}>
              {question.difficulty || 'Medium'} Level
            </span>
          </div>
          
          <div className="flex items-center space-x-1 text-[10px] font-extrabold font-mono text-white">
            <span className="bg-blue-600 px-2 py-0.5 rounded uppercase">
              {question.subject}
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded">
              PYQ {question.year}
            </span>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-4">
          <p className="text-base sm:text-lg font-medium text-slate-850 dark:text-slate-150 leading-relaxed font-sans">
            {question.questionText}
          </p>
        </div>

        {/* Dynamic Image display if available */}
        {question.imageUrl && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden max-w-xl mx-auto flex justify-center">
            <img 
              src={question.imageUrl} 
              alt={`Checkpoint Q-${question.id} Reference`} 
              referrerPolicy="no-referrer"
              className="max-h-72 object-contain rounded-lg"
            />
          </div>
        )}

        {/* Multiple Choice interactive list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const isSelected = selectedAnswer === key;
            const optionText = question.options?.[key] || '';
            
            let cardStyle = 'border-slate-200 dark:border-slate-850 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
            if (isSelected) {
              cardStyle = 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15';
            }
            if (submitted) {
              const isCorrect = question.correctAnswer === key;
              if (isCorrect) {
                cardStyle = 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-300 ring-2 ring-emerald-500/15 font-semibold';
              } else if (isSelected) {
                cardStyle = 'border-red-500 bg-red-50/30 dark:bg-red-950/20 text-red-800 dark:text-red-400 ring-2 ring-red-500/15';
              } else {
                cardStyle = 'border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={key}
                onClick={() => !submitted && setSelectedAnswer(key)}
                disabled={submitted}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex items-start space-x-3 cursor-pointer focus:outline-none ${cardStyle}`}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected 
                    ? 'bg-blue-600 text-white' 
                    : submitted && question.correctAnswer === key
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {key}
                </span>
                <span className="text-sm leading-snug">{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {!submitted ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Compass className="h-3.5 w-3.5 animate-pulse" />
              <span>Submit & Check Checkpoint</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedAnswer(null);
                setSubmitted(false);
                setFeedback('');
              }}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry and Reset</span>
            </button>
          )}
        </div>

        {/* Explanation Solution Section Panel */}
        {submitted && (
          <div className="p-5 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 animate-scale-up text-left">
            <div className="flex items-center space-x-2">
              {selectedAnswer === question.correctAnswer ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-black font-poppins text-slate-800 dark:text-slate-200 leading-normal">
                {feedback}
              </span>
            </div>
            
            <div className="border-t border-slate-200/45 dark:border-slate-800/40 pt-3.5 space-y-1">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block font-poppins">
                Detailed Solution Explanation
              </span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {question.explanation || 'No step-by-step solution manual is currently logged for this question. Consult standard textbook equations.'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

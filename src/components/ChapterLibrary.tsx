import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  BookOpen, 
  Layers, 
  Calendar, 
  PlayCircle, 
  Award, 
  FileText, 
  CheckCircle, 
  Compass, 
  Sparkles, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { Chapter, Question } from '../types';
import { getStoredChapters } from '../utils/storage';
import { deriveSessionLabel } from '../utils/sessionLabel';
import { API_BASE_URL } from '../config';

interface ChapterLibraryProps {
  chapterId: string;
  onBack: () => void;
  onStartPractice: (year: number | 'All', session: string | 'All', startIndex: number) => void;
}

interface QuestionGroup {
  year: number | 'All';
  session: string;
  count: number;
  label: string;
  questions: Question[];
}

export default function ChapterLibrary({ chapterId, onBack, onStartPractice }: ChapterLibraryProps) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);
  const [pyqYearRange, setPyqYearRange] = useState<{ minYear: number | null; maxYear: number | null } | null>(null);

  useEffect(() => {
    const fetchYearRange = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/year-range`);
        if (res.ok) {
          const data = await res.json();
          setPyqYearRange({ minYear: data.minYear, maxYear: data.maxYear });
        }
      } catch (err) {
        console.error('Failed to load PYQ year range:', err);
      }
    };
    fetchYearRange();
  }, []);

  useEffect(() => {
    const chs = getStoredChapters();
    const activeCh = chs.find(c => c.id === chapterId);
    
    if (activeCh) {
      setChapter(activeCh);
      
      const fetchQuestions = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await fetch(`${API_BASE_URL}/api/questions?examType=${encodeURIComponent(activeCh.exam)}&subject=${encodeURIComponent(activeCh.subject)}&chapter=${encodeURIComponent(activeCh.name)}`);

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
          setLoading(false);
        } catch (err) {
          console.error("Failed to load questions from database:", err);
          setError("Could not load questions from the database. Please check your connection and try again.");
          setQuestions([]);
          setLoading(false);
        }
      };

      fetchQuestions();
    } else {
      setLoading(false);
      setError("Chapter not found");
    }
  }, [chapterId]);

  // Create Year & Session Groups dynamically
  const groups = React.useMemo(() => {
    if (questions.length === 0) return [];

    const map: Record<string, Question[]> = {};

    questions.forEach(q => {
      // Determine session name
      const sessionName = deriveSessionLabel(q);
      const key = `${q.examType}-${q.year}-${sessionName}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(q);
    });

    const list: QuestionGroup[] = [];

    // Sort keys to have latest years first and January before April
    const sortedKeys = Object.keys(map).sort((a, b) => {
      const partsA = a.split('-');
      const partsB = b.split('-');
      const yearA = Number(partsA[1]) || 0;
      const yearB = Number(partsB[1]) || 0;
      if (yearA !== yearB) {
        return yearB - yearA; // Latest year first
      }
      // Same year, sort January first than April
      return partsA[2].localeCompare(partsB[2]);
    });

    sortedKeys.forEach(key => {
      const parts = key.split('-');
      const exam = parts[0];
      const year = Number(parts[1]) || 2024;
      const session = parts[2];
      const qs = map[key];

      let label = `${exam} ${year}`;
      if (exam === 'JEE') {
        label = `📅 ${exam} Main ${year} ${session}`;
      } else if (exam === 'NEET') {
        label = `📅 NEET ${year}`;
      } else {
        label = `📅 CBSE ${year}`;
      }

      list.push({
        year,
        session,
        count: qs.length,
        label,
        questions: qs
      });
    });

    // Add Combined group at the end
    list.push({
      year: 'All',
      session: 'All',
      count: questions.length,
      label: '📅 All Years Combined',
      questions: questions
    });

    return list;
  }, [questions]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center" id="chapter-library-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Chapter PYQs are loading. Please wait...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center" id="chapter-library-error">
        <HelpCircle className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-2">Something Went Wrong</h3>
        <p className="text-slate-500 dark:text-slate-450 mb-6">{error || 'The selected chapter could not be found in the database.'}</p>
        <button 
          onClick={onBack}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all"
        >
          Back to Chapter Selection
        </button>
      </div>
    );
  }

  const activeGroup = groups[selectedGroupIndex] || null;

  return (
    <div id="chapter-library-workspace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in">
      
      {/* HEADER NAVIGATION */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-start space-x-3">
          <button 
            onClick={onBack}
            className="mt-1 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Go back to Chapters selection"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap gap-2 items-center mb-1.5">
              <span className="bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-400 text-[10px] sm:text-xxs px-2 py-0.5 rounded-md font-extrabold tracking-wider uppercase font-mono shadow-2xs">
                {chapter.exam} Preload
              </span>
              <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-400 text-[10px] sm:text-xxs px-2 py-0.5 rounded-md font-extrabold tracking-wider uppercase font-mono shadow-2xs">
                {chapter.level}
              </span>
              <span className="bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-400 text-[10px] sm:text-xxs px-2 py-0.5 rounded-md font-extrabold tracking-wider uppercase font-mono shadow-2xs">
                {chapter.subject}
              </span>
            </div>
            {pyqYearRange && pyqYearRange.minYear !== null && pyqYearRange.maxYear !== null && (
              <div className="mb-1.5">
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-md font-extrabold tracking-wide uppercase font-mono">
                  <Calendar className="h-3 w-3" />
                  PYQs: {pyqYearRange.minYear} – {pyqYearRange.maxYear}
                </span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-poppins tracking-tight">
              {chapter.name}
            </h1>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="flex items-center space-x-5 bg-gradient-to-r from-slate-50 to-blue-50/20 dark:from-slate-900 dark:to-slate-900/30 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xs">
          <div className="text-center sm:text-right shrink-0">
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total PYQs Available</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-poppins">{questions.length} Questions</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-poppins flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Question Preview List
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Practice sequence of all preloaded PYQs for <strong className="text-blue-600 dark:text-blue-400">{chapter.name}</strong>
              </p>
            </div>

            {questions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onStartPractice('All', 'All', 0)}
                  className="px-3.5 py-1.5 text-xxs font-extrabold uppercase tracking-wide bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  Start from Q1
                </button>
                {questions.length >= 15 && (
                  <button
                    onClick={() => onStartPractice('All', 'All', 14)}
                    className="px-3.5 py-1.5 text-xxs font-extrabold uppercase tracking-wide bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    Start from Q15
                  </button>
                )}
                {questions.length >= 30 && (
                  <button
                    onClick={() => onStartPractice('All', 'All', 29)}
                    className="px-3.5 py-1.5 text-xxs font-extrabold uppercase tracking-wide bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    Start from Q30
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PREVIEW CONTAINER */}
          {questions.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-150 dark:border-slate-700 rounded-2xl bg-slate-50/50">
              <HelpCircle className="h-10 w-10 text-slate-350 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">No preview questions loaded</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">This chapter does not have loaded questions in the database currently.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const previewText = q.questionText.length > 200 
                  ? q.questionText.substring(0, 200) + "..." 
                  : q.questionText;

                return (
                  <div 
                    key={q.id}
                    onClick={() => onStartPractice('All', 'All', idx)}
                    className="group/item p-4 bg-slate-50 hover:bg-blue-50/25 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 rounded-2xl border border-slate-150 dark:border-slate-850 hover:border-blue-300 dark:hover:border-blue-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 text-left cursor-pointer hover:scale-[1.005] active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xxs font-black text-slate-500 bg-slate-150 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                            Q{idx + 1}
                          </span>
                          <span className="text-xxs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-mono">
                            {q.difficulty}
                          </span>
                          <span className="text-xxs font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md font-mono">
                            {q.examType} {q.year} {q.session && q.session !== 'All' ? `• ${q.session}` : ''}
                          </span>
                        </div>
                        
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {previewText}
                        </p>

                        {(q.imageUrl || (q as any).image_url) && (
                          <div className="my-3 rounded-xl overflow-hidden border border-gray-700 max-w-xl">
                            <img 
                              src={q.imageUrl || (q as any).image_url}
                              alt="Question diagram"
                              className="w-full object-contain max-h-80 rounded-xl"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartPractice('All', 'All', idx);
                        }}
                        className="shrink-0 scale-90 group-hover/item:scale-100 opacity-80 group-hover/item:opacity-100 px-3 py-1.5 bg-slate-200 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-white rounded-lg text-xxs font-extrabold uppercase transition-all cursor-pointer"
                      >
                        Start here
                      </button>
                    </div>

                    {/* Options Sneak Peek */}
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 truncate max-w-full">
                          <span className="font-bold text-slate-400">A)</span>
                          <span className="truncate">{q.options.A || 'Option A'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 truncate max-w-full">
                          <span className="font-bold text-slate-400">B)</span>
                          <span className="truncate">{q.options.B || 'Option B'}</span>
                        </div>
                        {q.options.C && (
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 truncate max-w-full">
                            <span className="font-bold text-slate-400">C)</span>
                            <span className="truncate">{q.options.C}</span>
                          </div>
                        )}
                        {q.options.D && (
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 truncate max-w-full">
                            <span className="font-bold text-slate-400">D)</span>
                            <span className="truncate">{q.options.D}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}

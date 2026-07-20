import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  Tv, 
  Youtube, 
  ExternalLink,
  BookOpen,
  Layers,
  GraduationCap,
  Clock,
  RefreshCw,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { Chapter } from '../types';
import { getStoredChapters } from '../utils/storage';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';

interface Lecture {
  id: number;
  examType: string;
  classLevel: string;
  subject: string;
  chapter: string;
  lectureTitle: string;
  lectureDescription: string;
  youtubeUrl: string;
  lectureOrder: number;
  thumbnailUrl: string | null;
  watched?: boolean;
}

interface LectureLibraryProps {
  chapterId: string;
  onBack: () => void;
}

export default function LectureLibrary({ chapterId, onBack }: LectureLibraryProps) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Watch mode configuration state: 'modal' or 'new_tab'
  const [watchMode, setWatchMode] = useState<'modal' | 'new_tab'>('new_tab');
  const [activePlayUrl, setActivePlayUrl] = useState<string | null>(null);
  const [activePlayTitle, setActivePlayTitle] = useState<string | null>(null);

  // Load chapter item details & lectures from endpoint
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find local chapter details
      const chs = getStoredChapters();
      const match = chs.find(c => c.id === chapterId);
      if (match) {
        setChapter(match);
      }

      // Fetch from API
      let token = await getAuthToken() || '';
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/lectures/chapter/${encodeURIComponent(chapterId)}`, {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setLectures(data.lectures || []);
        } else {
          setError(data.error || 'Failed to load chapter lectures');
        }
      } else {
        setError(`Failed fetching lectures (Server responded with code ${res.status})`);
      }
    } catch (err: any) {
      console.error('Error fetching lectures:', err);
      setError(err.message || 'Error occurred while loading chapter lectures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [chapterId]);

  // Handle Watch CTA click
  const handleWatchLecture = async (lecture: Lecture) => {
    // 1. Store/Mark watch status dynamically
    triggerToggleProgress(lecture.id, true);

    // 2. Open the exact link pasted in the Admin Panel in a new window/tab
    if (lecture.youtubeUrl) {
      window.open(lecture.youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Convert typical youtube links to embed links if possible
  const convertToEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0]?.split(/[?#]/)[0];
      } else if (url.includes('shorts/')) {
        videoId = url.split('shorts/')[1]?.split(/[?#]/)[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      console.error("Youtube URL parse failed:", e);
    }
    
    return url;
  };

  // Toggle user watch state manually or on clicks
  const triggerToggleProgress = async (lectureId: number, onlyMarkOnWatched = false) => {
    try {
      setActionLoading(lectureId);
      
      // If we are just marking as watched and it is already watched, avoid redundant API save
      const matchingLecture = lectures.find(l => l.id === lectureId);
      if (onlyMarkOnWatched && matchingLecture?.watched) {
        setActionLoading(null);
        return;
      }

      let token = await getAuthToken() || '';

      const res = await fetch(`${API_BASE_URL}/api/lectures/${lectureId}/toggle-watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          // Update client status local array
          setLectures(prev => prev.map(l => {
            if (l.id === lectureId) {
              return { ...l, watched: data.watched };
            }
            return l;
          }));
        }
      }
    } catch (err) {
      console.error('Failed completing toggle watch progress:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div id="lecture-library-container" className="max-w-4xl mx-auto space-y-6 text-left">
      
      {/* Back CTA Button */}
      <button 
        onClick={onBack}
        className="flex items-center space-x-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Target Syllabus</span>
      </button>

      {/* Chapter Details Banner and Controls */}
      {chapter && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
            <Tv className="w-80 h-80" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase bg-indigo-500/35 border border-indigo-500/40 px-2 py-0.5 rounded-full text-indigo-200">
                🚀 {chapter.exam}
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-purple-500/35 border border-purple-500/40 px-2 py-0.5 rounded-full text-purple-200">
                🎓 {chapter.level}
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-500/35 border border-emerald-500/40 px-2 py-0.5 rounded-full text-emerald-200">
                📚 {chapter.subject}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight font-poppins text-white leading-tight">
                {chapter.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-sans font-medium">
                Structured timeline lecture curriculum designed to clear core concepts step-by-step.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-white/10 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Lectures Available:</span>
                <span className="text-purple-300 font-bold bg-purple-500/20 px-2.5 py-0.5 rounded-full font-mono text-sm leading-none">
                  {lectures.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main lectures timeline body section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-poppins border-b border-slate-100 dark:border-slate-800 pb-3">
          📋 Lecture Timeline (sorted by order sequence)
        </h3>

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
            <span className="text-xs text-slate-400 mt-3 font-mono">Loading chapter curriculum from database...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        ) : lectures.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Tv className="h-12 w-12 text-slate-350 dark:text-slate-650 mx-auto" />
            <p className="text-slate-450 text-xs font-semibold italic">
              No lecture recordings assigned to this chapter yet. Admin will manually manage lectures shortly!
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l border-slate-200 dark:border-slate-800 space-y-8 text-xs select-none">
            {lectures.map((item, index) => (
              <div 
                key={item.id} 
                id={`lecture-ordered-timeline-item-${item.id}`} 
                className="relative group transition-all"
              >
                {/* Ordered Timeline badge bubble */}
                <div className={`absolute -left-[37px] sm:-left-[45px] top-1.5 h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  item.watched 
                    ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold scale-[1.05]' 
                    : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {item.watched ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 font-bold" />
                  ) : (
                    <span className="font-mono text-[10px] font-black">{item.lectureOrder}</span>
                  )}
                </div>

                {/* Main item details container */}
                <div className="bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-50/50 hover:dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-850 p-4 sm:p-5 rounded-2xl space-y-3 transition-all relative">
                  
                  {/* Title & Metadata row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider bg-indigo-100/80 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-250 dark:border-indigo-900/55 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                          <Sparkles className="h-3 w-3 text-indigo-550 dark:text-indigo-400 animate-pulse shrink-0" />
                          <span>LECTURE {item.lectureOrder}</span>
                        </span>
                        {item.watched && (
                          <span className="font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                            ✓ Watched PROGRESS
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-poppins leading-snug">
                        {item.lectureTitle}
                      </h4>
                    </div>

                    {/* Completion Check status selector */}
                    <button
                      onClick={() => triggerToggleProgress(item.id)}
                      disabled={actionLoading !== null}
                      className={`px-3 py-1.5 rounded-xl border transition-all text-[9.5px] uppercase font-black tracking-wider flex items-center space-x-1.5 cursor-pointer hover:scale-[1.01] ${
                        item.watched
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-905 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-650 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {actionLoading === item.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : item.watched ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>✓ Watched</span>
                        </>
                      ) : (
                        <>
                          <div className="h-3 w-3 rounded-full border border-slate-400" />
                          <span>Mark Watched</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Description string content */}
                  {item.lectureDescription && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs leading-relaxed font-sans font-medium">
                      {item.lectureDescription}
                    </p>
                  )}

                  {/* Thumbnail / Action container */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-900/60 font-semibold">
                    
                    {/* Thumbnail placeholder or dynamic preview info */}
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-red-500 font-black shrink-0 relative overflow-hidden">
                        <Youtube className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[200px] font-mono">
                        {item.youtubeUrl}
                      </span>
                    </div>

                    {/* Watch Now CTA Button */}
                    <a
                      href={item.youtubeUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerToggleProgress(item.id, true)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer duration-200"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>Watch Lecture</span>
                    </a>
                    
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Dynamic Overlay Media Streaming Modal for youtube urls */}
      {activePlayUrl && (
        <div id="lecture-embed-video-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full text-white space-y-4 p-4 relative animate-scale-up">
            
            {/* Header row details */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-red-500 font-extrabold">▶️ Live Class Streaming Playback</span>
                <h4 className="text-sm font-bold text-slate-100 truncate max-w-[400px] font-poppins">{activePlayTitle}</h4>
              </div>
              <button 
                onClick={() => {
                  setActivePlayUrl(null);
                  setActivePlayTitle(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all font-black text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close player ✕
              </button>
            </div>

            {/* Embedded video player viewport */}
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 relative">
              <iframe
                src={activePlayUrl}
                title={activePlayTitle || 'Chapter Class Lecture'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Action hint details */}
            <div className="flex justify-between items-center text-[10px] text-slate-450">
              <span className="font-mono">YouTube streaming viewport verified safely</span>
              <button
                onClick={() => {
                  window.open(activePlayUrl.replace('/embed/', '/watch?v='), '_blank', 'noopener,noreferrer');
                }}
                className="text-red-400 hover:text-red-300 font-bold flex items-center space-x-1"
              >
                <span>Trouble playing? Watch direct in separate tab</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Target, BookOpenCheck, GraduationCap, ChevronLeft, ChevronRight, Play, CheckCircle2, Search, ArrowRight, HelpCircle } from 'lucide-react';
import { Exam, AcademicLevel, Subject, Chapter, ChapterVideo, BrandingConfig } from '../types';
import { getStoredChapters, getStoredVideos, getStoredQuestions } from '../utils/storage';
import { getChapterDifficulty } from '../utils/difficulty';
import { API_BASE_URL } from '../config';

function getDifficultyBadgeStyles(chapterName: string): string {
  const diff = getChapterDifficulty(chapterName);
  switch (diff) {
    case 'High Output Low Input':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 shadow-xs';
    case 'High Output High Input':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 shadow-xs';
    case 'Low Output Low Input':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/30';
    case 'Low Output High Input':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 shadow-xs';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/30';
  }
}

function getSubjectImage(subject: string): string {
  const s = String(subject || '').toLowerCase();
  if (s.includes('physics')) {
    // Beautiful abstract wave/lines representation for Physics
    return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400';
  }
  if (s.includes('chemistry')) {
    // Glowing labs and molecular structure for Chemistry
    return 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=400';
  }
  if (s.includes('math') || s.includes('calculus') || s.includes('algebra')) {
    // Elegant chalkboard layout for Mathematics
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400';
  }
  // Botany, Zoology, Biology cell structure
  return 'https://images.unsplash.com/photo-1530026405186-ed1eaae6bbdb?auto=format&fit=crop&q=80&w=400';
}

interface OnboardingProps {
  initialExam?: Exam | null;
  onSelectChapter: (chapterId: string) => void;
  onLaunchVideo: (video: ChapterVideo) => void;
  onWatchLectures: (chapterId: string) => void;
  onOpenSamplePaper?: () => void;
  branding: BrandingConfig;
  step?: number;
  setStep?: (s: number) => void;
  exam?: Exam;
  setExam?: (e: Exam) => void;
  level?: AcademicLevel;
  setLevel?: (l: AcademicLevel) => void;
  subject?: Subject;
  setSubject?: (sub: Subject) => void;
}

export default function Onboarding({ 
  initialExam, 
  onSelectChapter, 
  onLaunchVideo, 
  onWatchLectures,
  onOpenSamplePaper,
  branding,
  step: propStep,
  setStep: propSetStep,
  exam: propExam,
  setExam: propSetExam,
  level: propLevel,
  setLevel: propSetLevel,
  subject: propSubject,
  setSubject: propSetSubject
}: OnboardingProps) {
  const [localStep, localSetStep] = useState<number>(1);
  const [localExam, localSetExam] = useState<Exam>('JEE');
  const [localLevel, localSetLevel] = useState<AcademicLevel>('Class 12');
  const [localSubject, localSetSubject] = useState<Subject>('Physics');

  const step = propStep !== undefined ? propStep : localStep;
  const setStep = propSetStep !== undefined ? propSetStep : localSetStep;

  const exam = propExam !== undefined ? propExam : localExam;
  const setExam = propSetExam !== undefined ? propSetExam : localSetExam;

  const level = propLevel !== undefined ? propLevel : localLevel;
  const setLevel = propSetLevel !== undefined ? propSetLevel : localSetLevel;

  const subject = propSubject !== undefined ? propSubject : localSubject;
  const setSubject = propSetSubject !== undefined ? propSetSubject : localSetSubject;
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<ChapterVideo[]>([]);
  const [chapterImages, setChapterImages] = useState<any[]>([]);
const [pyqYearRange, setPyqYearRange] = useState<{ minYear: number | null; maxYear: number | null } | null>(null);

  // Track custom background images from DB
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/chapter-images`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setChapterImages(data))
      .catch(err => console.error('Error fetching chapter images in Onboarding:', err));
  }, []);
// Track live (or admin-overridden) PYQ year range shown on each chapter card
useEffect(() => {
fetch(`${API_BASE_URL}/api/year-range`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPyqYearRange({ minYear: data.minYear, maxYear: data.maxYear });
        }
      })
      .catch(err => console.error('Error fetching PYQ year range in Onboarding:', err));
  }, []);

  // Track if initialExam was passed to skip step 1
  useEffect(() => {
    if (initialExam && step === 1) {
      setExam(initialExam);
      
      // Auto-assign first subject based on exam
      if (initialExam === 'JEE') {
        setSubject('Physics');
      } else if (initialExam === 'NEET') {
        setSubject('Botany');
      } else {
        setSubject('Physics');
      }
      setStep(2);
    }
  }, [initialExam]);

  // Load chapters & videos whenever filter parameters change
  useEffect(() => {
    const allChapters = getStoredChapters();
    const allVideos = getStoredVideos();
    
    // Filter chapters based on exam, level, and selected subject
    const filteredChapters = allChapters.filter(ch => 
      ch.exam === exam && 
      ch.level === level && 
      ch.subject === subject
    );
    
    setChapters(filteredChapters);
    setVideos(allVideos);
  }, [exam, level, subject, step]);

  // Scroll to top of the page when changing onboarding steps, exams, or subjects
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [step, exam, level, subject]);

  // Determine valid subjects list based on current exam state
  const getSubjectsForExam = (selectedExam: Exam): Subject[] => {
    switch (selectedExam) {
      case 'JEE':
        return ['Physics', 'Chemistry', 'Mathematics'];
      case 'NEET':
        return ['Physics', 'Chemistry', 'Botany', 'Zoology'];
      case 'CBSE':
        return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    }
  };

  const handleSelectExam = (selectedExam: Exam) => {
    setExam(selectedExam);
    const validSubjects = getSubjectsForExam(selectedExam);
    // If current subject is not valid for new exam, fallback to first
    if (!validSubjects.includes(subject)) {
      setSubject(validSubjects[0]);
    }
    setStep(2);
  };

  const handleSelectLevel = (selectedLevel: AcademicLevel) => {
    setLevel(selectedLevel);
    setStep(3);
  };

  const handleSelectSubject = (selectedSub: Subject) => {
    setSubject(selectedSub);
    setStep(4);
  };

  // Search filtered Chapters
  const searchedChapters = chapters.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Onboarding Funnel Progress Indicators */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-poppins tracking-tight">
          Select Your Practice Topic
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Let's boost your learning systematically with interactive step-by-step topic selection.
        </p>

        {/* Funnel Steps Indicator Bar */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          {[
            { s: 1, label: 'Exam' },
            { s: 2, label: 'Class' },
            { s: 3, label: 'Subject' },
            { s: 4, label: 'Chapter' }
          ].map((item) => (
            <div key={item.s} className="flex items-center">
              <button
                onClick={() => setStep(Math.min(step, item.s))}
                disabled={step <= item.s && item.s > 1}
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all ${
                  step === item.s
                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                    : step > item.s
                    ? 'bg-emerald-500 text-white border-emerald-500 cursor-pointer'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {item.s}
              </button>
              <span className={`text-xs ml-1.5 font-medium ${step >= item.s ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {item.label}
              </span>
              {item.s < 4 && (
                <div className={`w-8 sm:w-16 h-[2px] mx-2 ${step > item.s ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CHOOSE TARGET EXAM */}
      {step === 1 && (
        <div id="onboard-step-1" className="max-w-3xl mx-auto animate-slide-up space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-200">
              Which exam are you preparing for? Choose Your Exam
            </h3>
            <p className="text-xs text-slate-400">Class 11, Class 12, and dropper targets are preloaded below</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {onOpenSamplePaper && (
              <button
                id="onboard-sample-paper"
                onClick={onOpenSamplePaper}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-amber-500 focus:outline-none focus:ring-amber-500/20 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <HelpCircle className="h-8 w-8 text-amber-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Tests</span>
                </div>
                <h4 className="text-xl font-bold font-poppins text-slate-800 dark:text-white mt-4">Sample Paper</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full syllabus tests with subject-wise video solutions</p>
                <span className="inline-block mt-3 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-600 dark:text-slate-350 font-mono">
                  Chapter-wise Tests
                </span>
              </button>
            )}
            {[
              { id: 'JEE', desc: 'Joint Entrance Exam (Engineering)', tag: 'Physics, Chemistry, Maths', icon: Target, color: 'hover:border-blue-500 focus:ring-blue-500/20' },
              { id: 'NEET', desc: 'National Eligibility cum Entrance Test', tag: 'Physics, Chemistry, Bio', icon: GraduationCap, color: 'hover:border-emerald-500 focus:ring-emerald-500/20' },
              { id: 'CBSE', desc: 'Central Board Secondary Education', tag: 'School boards Prep', icon: BookOpenCheck, color: 'hover:border-indigo-500 focus:ring-indigo-500/20' }
            ].map((e) => {
              const Icon = e.icon;
              return (
                <button
                  key={e.id}
                  id={`onboard-exam-${e.id.toLowerCase()}`}
                  onClick={() => handleSelectExam(e.id as Exam)}
                  className={`p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg focus:outline-none transition-all cursor-pointer text-left ${e.color}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Tag: {e.id}</span>
                  </div>
                  <h4 className="text-xl font-bold font-poppins text-slate-800 dark:text-white mt-4">{e.id}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.desc}</p>
                  <span className="inline-block mt-3 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-600 dark:text-slate-350 font-mono">
                    {e.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE ACADEMIC LEVEL */}
      {step === 2 && (
        <div id="onboard-step-2" className="max-w-3xl mx-auto animate-slide-up space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-950 font-medium text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Step 1</span>
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase">Selected Exam: <strong className="text-blue-600">{exam}</strong></span>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-200">
              Select Your Academic Class / Level
            </h3>
            <p className="text-xs text-slate-400">Classwise split accurate filters help save time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {[
              { id: 'Class 11', title: 'Class 11th', desc: 'Core Foundation concepts with basic state derivations' },
              { id: 'Class 12', title: 'Class 12th', desc: 'Board prep & High weightage electrodynamics, organic synthesis' }
            ].map((lvl) => (
              <button
                key={lvl.id}
                id={`onboard-level-${lvl.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleSelectLevel(lvl.id as AcademicLevel)}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 focus:outline-none hover:shadow-md transition-all cursor-pointer text-left"
              >
                <span className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold block">
                  {lvl.id[0]}
                </span>
                <h4 className="text-lg font-bold font-poppins text-slate-800 dark:text-white mt-4">{lvl.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{lvl.desc}</p>
                <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Confirm Class</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE SUBJECT */}
      {step === 3 && (
        <div id="onboard-step-3" className="max-w-3xl mx-auto animate-slide-up space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-950 font-medium text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Step 2</span>
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase">
              Current: <strong className="text-blue-600">{exam}</strong> • <strong className="text-emerald-600">{level}</strong>
            </span>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-slate-200">
              Choose Core Subject
            </h3>
            <p className="text-xs text-slate-400">Syllabus exact categorization as per JEE NEET norms</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-center">
            {getSubjectsForExam(exam).map((sub) => (
              <button
                key={sub}
                id={`onboard-subject-${sub.toLowerCase()}`}
                onClick={() => handleSelectSubject(sub)}
                className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer text-center flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mb-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold font-poppins">{sub[0]}</span>
                </div>
                <h4 className="text-base font-bold font-poppins text-slate-800 dark:text-white">{sub}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Practice PYQ Series</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: CHOOSE CHAPTER LIST */}
      {step === 4 && (
        <div id="onboard-step-4" className="animate-slide-up space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-950 font-medium text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Subjects</span>
            </button>
            
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-400 text-xs px-2.5 py-1 rounded font-poppins font-semibold">
                Exam: {exam}
              </span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 text-xs px-2.5 py-1 rounded font-poppins font-semibold">
                Class: {level}
              </span>
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-400 text-xs px-2.5 py-1 rounded font-poppins font-semibold">
                Subject: {subject}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold font-poppins text-slate-800 dark:text-white">
                Showing all chapters ({searchedChapters.length})
              </h3>
            </div>
            
            {/* Search Input Filter */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Chapter cards display */}
          {searchedChapters.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No Chapters Found</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">This academic split hasn't saved chapters yet. Try resetting filters or adding chapters via the admin panel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchedChapters.map((ch) => {
                // Find matching videos for this chapter to showcase
                const chapterVideo = videos.find(v => v.chapterId === ch.id);
                
                // Find if there is an admin-provided custom background image
                const matchedImg = chapterImages.find(img => 
                  img.subject === ch.subject && 
                  img.chapterName === ch.name
                );
                const bgStyle = (matchedImg && matchedImg.imageUrl && matchedImg.imageUrl.trim() !== '')
                  ? `url(${matchedImg.imageUrl}) center / cover no-repeat`
                  : ch.imageUrl;
                
                return (
                  <div
                    key={ch.id}
                    id={`chapter-card-${ch.id}`}
                    className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Chapter Visual Area (Custom Gradient or Image Card) */}
                    <div 
                      className="h-28 relative p-4 flex flex-col justify-between text-white overflow-hidden"
                      style={{ background: bgStyle }}
                    >
                      <div className="absolute inset-0 bg-black/15 z-0" />
                      
                      {/* Top Badges */}
                      <div className="relative z-15 flex justify-between items-center w-full">
                        <span className="text-[10px] font-extrabold font-mono tracking-wider bg-black/35 border border-white/20 px-2 py-0.5 rounded uppercase">
                          {ch.subject}
                        </span>
                        {ch.progressPercent >= 100 && (
                          <span className="inline-flex items-center space-x-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>100% DONE</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta stats area */}
                    <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Chapter Title sitting above 2019-2025, styled in black color */}
                        <h4 className="text-sm sm:text-base font-black font-poppins leading-snug text-slate-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
                          {ch.name}
                        </h4>

                        {/* Questions count count */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">
                            {pyqYearRange && pyqYearRange.minYear !== null && pyqYearRange.maxYear !== null ? `${pyqYearRange.minYear} - ${pyqYearRange.maxYear} PYQs:` : 'PYQs:'}
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border font-poppins shrink-0 ${
                            getDifficultyBadgeStyles(ch.name)
                          }`}>
                            {getChapterDifficulty(ch.name)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Topic Practice Completion:</span>
                            <span className="font-bold text-slate-600 dark:text-slate-350">{ch.progressPercent || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${ch.progressPercent || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 pt-2">
                        {/* Play Video Trigger / Dedicated Chapter Lecture Library page */}
                        <button
                          id={`chapter-video-btn-${ch.id}`}
                          onClick={() => onWatchLectures(ch.id)}
                          className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-red-656 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs font-semibold border border-red-600/20 transition-all text-center cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current inline-block mr-1.5" />
                          <span>📺 Watch Lecture</span>
                        </button>

                        {/* Core Practice CTA Button */}
                        <button
                          id={`chapter-practice-btn-${ch.id}`}
                          onClick={() => onSelectChapter(ch.id)}
                          className="flex items-center justify-center space-x-1 w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                        >
                          <span>Continue Practice</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

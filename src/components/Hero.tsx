import React from 'react';
import { Sparkles, ArrowRight, BookOpenCheck, Target, GraduationCap } from 'lucide-react';
import { BrandingConfig, Exam, UserProfile } from '../types';
import DailyDoseWidget from './DailyDoseWidget';

interface HeroProps {
  branding: BrandingConfig;
  user: UserProfile;
  onInitiateExam: (exam: Exam) => void;
  onOpenSamplePaper?: () => void;
}

export default function Hero({ branding, user, onInitiateExam, onOpenSamplePaper }: HeroProps) {
  const renderHeadline = (text: string) => {
    const regex = /(Boring\s+Nhi|Study\s+Yatra)/gi;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.toLowerCase() === 'boring nhi' || part.toLowerCase() === 'study yatra') {
        return (
          <span key={index} className="text-red-600 dark:text-red-500 font-extrabold whitespace-nowrap">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 py-12 lg:py-16 font-sans">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
        
        {/* Core Full-Width Banner Image display (Top Banner) */}
        <div className="w-full relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-12 bg-white dark:bg-slate-900">
          <div className="absolute inset-0 bg-blue-900/5 dark:bg-black/10 group-hover:opacity-0 transition-opacity duration-300 z-10" />
          <img 
            src={branding.heroBannerUrl} 
            alt="Study Yatra Banner" 
            referrerPolicy="no-referrer"
            className="w-full h-auto block object-contain transform duration-500 group-hover:scale-[1.01]"
          />
        </div>

        {/* Headline and CTAs (Centered below) */}
        <div className="w-full max-w-4xl text-center space-y-6 lg:space-y-8">
          <div>
            <span className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-200 dark:border-blue-800/40 font-poppins">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>Smart PYQ Journey • Class 11, 12</span>
            </span>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-poppins text-slate-900 dark:text-white tracking-tight leading-[1.15] md:leading-[1.20] max-w-3xl mx-auto">
              {renderHeadline(branding.heroHeadline)}
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-350 leading-relaxed font-sans max-w-2xl mx-auto">
            {branding.heroSubheadline}
          </p>

          <div className="max-w-2xl mx-auto w-full pt-4">
            <DailyDoseWidget user={user} />
          </div>

          {/* Strict CTA Buttons: JEE, NEET, CBSE (No generic Get Started) */}
          <div className="space-y-4 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Choose Your Target Exam to Start Journey:
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto">
              
              {/* JEE Button */}
              <button
                id="cta-jee"
                onClick={() => onInitiateExam('JEE')}
                className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 shadow-md transition-all duration-200 text-center cursor-pointer transform hover:-translate-y-1"
              >
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 group-hover:text-white mb-2" />
                <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">JEE</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-blue-100 mt-1">Main & Adv</span>
              </button>

              {/* NEET Button */}
              <button
                id="cta-neet"
                onClick={() => onInitiateExam('NEET')}
                className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 shadow-md transition-all duration-200 text-center cursor-pointer transform hover:-translate-y-1"
              >
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 group-hover:text-white mb-2" />
                <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">NEET</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-emerald-100 mt-1">Med Entrance</span>
              </button>

              {/* CBSE Button */}
              <button
                id="cta-cbse"
                onClick={() => onInitiateExam('CBSE')}
                className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 shadow-md transition-all duration-200 text-center cursor-pointer transform hover:-translate-y-1"
              >
                <BookOpenCheck className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 group-hover:text-white mb-2" />
                <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">CBSE</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-100 mt-1">Board Exams</span>
              </button>

              {/* Sample Paper Button */}
              {onOpenSamplePaper && (
                <button
                  id="cta-sample"
                  onClick={onOpenSamplePaper}
                  className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 shadow-md transition-all duration-200 text-center cursor-pointer transform hover:-translate-y-1"
                >
                  <span className="text-lg sm:text-xl mb-2">📝</span>
                  <span className="text-base sm:text-lg font-bold font-poppins dark:text-white group-hover:text-white">Sample</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-purple-100 mt-1">Test Papers</span>
                </button>
              )}

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

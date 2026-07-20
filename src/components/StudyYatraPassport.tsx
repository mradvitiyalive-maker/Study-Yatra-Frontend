import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plane, MapPin, Check, Sparkles, School, Trophy, ArrowRight, X } from 'lucide-react';
import { UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';

interface StudyYatraPassportProps {
  user: UserProfile;
  onUpdateProfile: () => void;
}

const DREAM_COLLEGE_OPTIONS = [
  'IIT Delhi',
  'IIT Bombay',
  'IIT Kanpur',
  'IIT Kharagpur',
  'AIIMS Delhi',
  'NIT Trichy',
  'Custom'
];

export default function StudyYatraPassport({ user, onUpdateProfile }: StudyYatraPassportProps) {
const [showModal, setShowModal] = useState<boolean>(!user.dreamCollege);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [customCollege, setCustomCollege] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const progress = user.journeyProgress ?? 0;

  // Determine current stop text based on current progress
  const getCurrentStopText = () => {
    if (progress >= 75) return 'Dream College';
    if (progress >= 50) return user.targetExam ? `${user.targetExam} Preparation` : 'JEE/NEET Prep';
    if (progress >= 25) return 'Class 12';
    return 'Class 11';
  };

  const currentStop = getCurrentStopText();

  // Handle dream college submission
  const handleSaveDreamCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    const collegeToSave = selectedCollege === 'Custom' ? customCollege.trim() : selectedCollege;

    if (!collegeToSave) {
      setErrorMsg('Please select or specify a dream college.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const token = await getAuthToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/users/passport`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ dreamCollege: collegeToSave })
        });

        if (res.ok) {
          onUpdateProfile();
          setShowModal(false);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.error || 'Failed to save dream college.');
        }
      } else {
        setErrorMsg('Please log in to save your dream college permanently.');
      }
    } catch (err: any) {
      console.error('Error saving dream college:', err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Define steps
  const steps = [
    { label: 'Class 11', threshold: 0 },
    { label: 'Class 12', threshold: 25 },
    { label: user.targetExam ? `${user.targetExam} Prep` : 'JEE/NEET', threshold: 50 },
    { label: user.dreamCollege || 'Dream College', threshold: 75, isDest: true }
  ];

  return (
    <div id="study-yatra-passport-card" className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all duration-300">
      
      {/* Flight background details */}
      <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none transform translate-x-8 -translate-y-8 select-none">
        <Plane className="w-48 h-48 rotate-45 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Header section with Premium Passport Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-widest text-[#2563EB] dark:text-blue-400 font-poppins">
            <Plane className="h-4.5 w-4.5 animate-pulse" />
            <span>STUDY YATRA PASSPORT</span>
          </div>
          <h3 className="text-sm text-slate-400 mt-0.5">Your official academic flight log</h3>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-2 self-start sm:self-auto shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
            BOARDING ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Progress tracker road map (left to right airplane track with states) */}
        <div className="md:col-span-8 space-y-4">
          <div className="relative pt-6 pb-2">
            
            {/* The line connecting key points */}
            <div className="absolute top-9 left-2 right-2 h-0.5 bg-slate-200 dark:bg-slate-800" />
            
            {/* Completed active progress sub-line */}
            <motion.div 
              className="absolute top-9 left-2 h-0.5 bg-gradient-to-r from-blue-550 to-[#2563EB] dark:from-blue-600 dark:to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `calc(${progress}% - 8px)` }}
              transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1] }}
            />

            {/* Moving plane icon */}
            <motion.div 
              className="absolute top-6 -mt-1.5 z-10"
              initial={{ left: "2%" }}
              animate={{ left: `${Math.max(2, Math.min(progress, 98))}%` }}
              transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ x: "-50%" }}
            >
              <div className="bg-blue-600 dark:bg-blue-500 text-white rounded-full p-1.5 shadow-lg hover:scale-120 hover:rotate-12 transition-all cursor-pointer relative group">
                <Plane className="h-4 w-4 rotate-45 animate-bounce" style={{ animationDuration: '2.5s' }} />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                  Happy Journey! ✈️
                </span>
              </div>
            </motion.div>

            {/* Stages circles showing check & labels */}
            <div className="flex justify-between items-center relative z-0">
              {steps.map((st, idx) => {
                const isPassed = progress > st.threshold;
                const isCurrent = progress >= st.threshold && (idx === steps.length - 1 || progress < steps[idx + 1].threshold);

                return (
                  <div key={idx} className="flex flex-col items-center select-none max-w-[20%] text-center">
                    <div 
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                        st.isDest
                          ? (isPassed || isCurrent ? 'bg-amber-500 text-white border-2 border-amber-600 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700')
                          : (isPassed
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600')
                      }`}
                    >
                      {st.isDest ? (
                        <School className="h-3.5 w-3.5" />
                      ) : isPassed ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span 
                      className={`text-[10px] font-bold mt-2 truncate max-w-full font-poppins block ${
                        isCurrent 
                          ? 'text-blue-600 dark:text-blue-400 font-extrabold scale-105' 
                          : isPassed 
                            ? 'text-slate-700 dark:text-slate-350 font-semibold' 
                            : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Current Stop & Metadata Indicators */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-2">
            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-sans">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>Current Stop: </span>
              <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-extrabold">
                {currentStop}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-sans">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Journey Progress: </span>
              <span className="font-mono font-bold text-slate-850 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {progress}%
              </span>
            </div>
          </div>

        </div>

        {/* Destination / Dream College detail panel */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center min-h-[120px] shadow-sm relative group/btn">
          <div className="absolute top-2 right-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block font-poppins">
            🏛 FINAL DESTINATION
          </span>
          
          {user.dreamCollege ? (
            <>
              <h4 className="text-lg font-black font-poppins text-slate-900 dark:text-white mt-1 leading-tight tracking-tight">
                {user.dreamCollege}
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-2 flex items-center space-x-1">
                <span>Keep solving to secure your seat</span>
              </p>
              <button
  onClick={() => setShowModal(true)}
  className="mt-3 text-left text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
>
  <span>Change Destination College</span>
  <ArrowRight className="h-2.5 w-2.5" />
</button>
             
            </>
          ) : (
            <div className="mt-2 text-left">
              <p className="text-xs text-slate-400 italic">No college locked in yet.</p>
              <button 
                onClick={() => setShowModal(true)}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-poppins py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 transition-all"
              >
                <span>Set Dream College</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Onboarding Dream College Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            
            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-xl font-black font-poppins text-slate-900 dark:text-white tracking-tight text-center">
              🏫 What is your dream college?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5">
              Lock in your ultimate destination! We will track your journey there.
            </p>

            <form onSubmit={handleSaveDreamCollege} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-2">
                {DREAM_COLLEGE_OPTIONS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      setSelectedCollege(col);
                      if (col !== 'Custom') {
                        setCustomCollege('');
                      }
                    }}
                    className={`p-3 text-xs font-bold font-poppins rounded-xl border text-center transition-all ${
                      selectedCollege === col
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>

              {selectedCollege === 'Custom' && (
                <div className="space-y-1 animate-slide-up">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 font-poppins">
                    Enter Custom College/University
                  </label>
                  <input
                    type="text"
                    value={customCollege}
                    onChange={(e) => setCustomCollege(e.target.value)}
                    placeholder="e.g. BITS Pilani, ISc Bangalore, KGMU Lucknow"
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-205 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-center text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                {user.dreamCollege && (
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center space-x-2 ${
                    saving ? 'opacity-80 cursor-wait' : ''
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{saving ? 'Locking in Seat...' : 'Lock in Destination'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

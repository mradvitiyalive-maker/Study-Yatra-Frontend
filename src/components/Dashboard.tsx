    import React, { useState, useEffect } from 'react';
import { UserProfile, StudyDay, Exam, AcademicLevel } from '../types';
import { getStoredStreakDays, calculateDashboardStats, DashboardStats, saveUserProfile } from '../utils/storage';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { Gift, Calendar, Award, Flame, FlameKindling, Activity, History, Clock, BookOpen, Layers, MapPin, Trophy, Target, Sparkles } from 'lucide-react';
import StudyYatraPassport from './StudyYatraPassport';
import { API_BASE_URL } from '../config';

interface DashboardProps {
  user: UserProfile;
  onChangeTab: (tabId: string) => void;
  onEditProfile: () => void;
  onUpdateProfile: () => void;
}

export default function Dashboard({ user, onChangeTab, onEditProfile, onUpdateProfile }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(calculateDashboardStats());
  const [streakDays, setStreakDays] = useState<StudyDay[]>(getStoredStreakDays());

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok && active) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats from database:", err);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [user.firebaseUid]);

  const dynamicJourneyStats = React.useMemo(() => {
    // Total questions resolved overall
    const totalSolved = (stats as any).totalSolved !== undefined ? (stats as any).totalSolved : (25 + (stats.solvedThisWeek || 0));
    const overallAccuracy = (stats as any).overallAccuracy !== undefined ? (stats as any).overallAccuracy : 80;
    const chaptersCompletedCount = stats.recentlyPracticed?.length || 2;
    
    // Total mins tracking
    const totalMins = totalSolved * 2; // approximation or direct formula
    const weekMins = (stats.solvedThisWeek || 0) * 2;
    const todayMins = (stats.solvedToday || 0) * 2;

    // Daily Goal progress from stats today
    const todayGoalProgress = stats.solvedToday || 0;

    return {
      totalSolved,
      overallAccuracy,
      chaptersCompletedCount,
      todayMins,
      weekMins,
      totalMins,
      todayGoalProgress
    };
  }, [stats]);

  // Inline editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editExam, setEditExam] = useState<Exam>(user.targetExam);
  const [editLevel, setEditLevel] = useState<AcademicLevel>(user.academicLevel);

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditExam(user.targetExam);
    setEditLevel(user.academicLevel);
    setIsEditing(true);
  };

 const handleSaveEdit = async (e: React.FormEvent) => {
  e.preventDefault();

  const updatedUser = {
    ...user,
    name: editName.trim(),
    targetExam: editExam,
    academicLevel: editLevel
  };

  // Optimistic local update — modal closes and UI reflects the
  // change immediately, regardless of network latency.
  saveUserProfile(updatedUser);
  setIsEditing(false);
  onUpdateProfile();

  // Persist the change to PostgreSQL via the existing sync endpoint.
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available; profile change not synced to server.');
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: updatedUser.name,
        targetExam: updatedUser.targetExam,
        academicLevel: updatedUser.academicLevel
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Failed to sync profile update to server:', res.status, errBody);
    }
  } catch (err) {
    console.error('Failed to sync profile update to server:', err);
  }
};

  const [selectedDayRecord, setSelectedDayRecord] = useState<StudyDay | null>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const rec = getStoredStreakDays().find(d => d.date === todayStr);
    if (rec) return rec;
    // Default to first found studied day, or mock empty record
    return getStoredStreakDays()[0] || null;
  });

  // Generate heatmap date grid representing the last 120 days, grouped into a matrix
  const generateHeatmapDays = (): { dateStr: string; dayLabel: number; monthLabel: string; record: StudyDay | null }[] => {
    const arr = [];
    const today = new Date();
    
    // We render exactly 112 days (16 weeks of 7 squares) for clean bento fit
    for (let i = 111; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = streakDays.find(sd => sd.date === dateStr) || null;
      
      arr.push({
        dateStr,
        dayLabel: d.getDate(),
        monthLabel: d.toLocaleString('en-US', { month: 'short' }),
        record
      });
    }
    return arr;
  };

  const heatmapDays = generateHeatmapDays();

  // Helper for color shading relative to question volumes
  const getHeatmapColorClass = (record: StudyDay | null): string => {
    if (!record) return 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700';
    const volume = record.questionsSolved;
    if (volume < 5) return 'bg-emerald-200 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-300 ring-1 ring-emerald-500/20';
    if (volume < 12) return 'bg-emerald-400 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-500 ring-1 ring-emerald-500/35';
    return 'bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-750 ring-2 ring-emerald-500/50';
  };

  // Human date formatter
  const formatHumanDate = (dateString: string): string => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header Profile Ribbon */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-premium dark:shadow-premium-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Profile Card details */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/70 border-2 border-blue-500/50 flex items-center justify-center text-blue-600 font-extrabold text-2xl shadow-sm overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span>{user.name ? user.name[0] : 'S'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h2 className="text-2xl font-bold font-poppins text-slate-900 dark:text-white leading-tight">
                {user.name || 'Student Aspirant'}
              </h2>
              {user.isPremium ? (
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center shadow-sm">
                  <Flame className="h-3 w-3 fill-current mr-0.5 animate-bounce" />
                  <span>PREMIUM PRO</span>
                </span>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                  Free Member
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-none">
              Aspirant Path: <strong className="text-blue-500">{user.targetExam}</strong> • Class: <strong className="text-emerald-500">{user.academicLevel}</strong>
            </p>
          </div>
        </div>

        {/* Edit profile actions */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            id="profile-edit-btn"
            onClick={handleOpenEdit}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Switch Target Exam / Class
          </button>
          
          {!user.isPremium && (
            <button
              id="dashboard-upgrade-premium"
              onClick={() => onChangeTab('subscription')}
              className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md relative overflow-hidden group cursor-pointer transition-all"
            >
              <span className="relative z-10">Get Expected PYQs (Premium)</span>
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
            </button>
          )}
        </div>

      </div>

      {/* DOUBLE-GRID CONTAINER FOR LANDING PROFILE SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column / Sidebar: Study Yatra Journey Panel */}
        <div id="dashboard-journey-sidebar" className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left space-y-6">
            
            {/* Section 1: 📍 YOUR STUDY YATRA */}
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-poppins">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>📍 YOUR STUDY YATRA</span>
              </div>
              <div className="space-y-2 text-xs font-sans">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wide">Current Chapter:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 font-poppins text-xs">
                    {stats?.recentlyPracticed?.[0] ?? (user.targetExam === 'JEE' ? 'Gravitation' : 'Cell Cycle and Cell Division')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wide">Subject:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {(stats as any)?.favSubject ?? (user.targetExam === 'JEE' ? 'Physics' : 'Biology')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wide">Class / Batch:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {user.academicLevel === 'Dropper' ? 'Dropper Batch' : user.academicLevel || 'Class 12th'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: 📚 Total Progress */}
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-poppins">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span>📚 Total Progress</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold mb-0.5">Solved</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 font-mono">{dynamicJourneyStats.totalSolved.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold mb-0.5">Chapters</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 font-mono">{dynamicJourneyStats.chaptersCompletedCount}</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/30 dark:border-emerald-900/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[9px] uppercase font-bold">Accuracy</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{dynamicJourneyStats.overallAccuracy}%</span>
                </div>
                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dynamicJourneyStats.overallAccuracy}%` }} />
                </div>
              </div>
            </div>

            {/* Section 3: ⏳ Total Study Time */}
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-poppins">
                <Clock className="h-4 w-4 text-cyan-500" />
                <span>⏳ Total Study Time</span>
              </div>
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Today</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {Math.floor(dynamicJourneyStats.todayMins / 60)}h {dynamicJourneyStats.todayMins % 60}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">This Week</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {Math.floor(dynamicJourneyStats.weekMins / 60)}h {dynamicJourneyStats.weekMins % 60}m
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50/40 dark:bg-slate-950/40 border border-blue-105 dark:border-slate-850 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Total Time</span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                    {Math.floor(dynamicJourneyStats.totalMins / 60)}h {dynamicJourneyStats.totalMins % 60}m
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: 🎯 Daily Goal */}
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-poppins">
                <Target className="h-4 w-4 text-rose-500" />
                <span>🎯 Daily Goal</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px]">Target: 50 Questions</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200 font-mono">
                    {dynamicJourneyStats.todayGoalProgress}/50
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-850">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (dynamicJourneyStats.todayGoalProgress / 50) * 100)}%` }} 
                  />
                </div>

                {dynamicJourneyStats.todayGoalProgress >= 50 && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/30 rounded-xl text-center text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center space-x-1 animate-pulse mt-1">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span>🎉 Daily Goal Achieved!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: 💡 Study Yatra Motivation Quotes */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-poppins">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>💡 Study Yatra Motivation</span>
              </div>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/15 border-l-2 border-amber-400 dark:border-amber-500 rounded-r-xl italic text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-sans">
                "Small daily improvements create big results. Rank is earned one question at a time."
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Main statistics and Heatmap visual logs */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">

      {/* Study Yatra Passport */}
      <StudyYatraPassport user={user} onUpdateProfile={onUpdateProfile} />

      {/* CORE INTENSITY HEATMAP (GitHub Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white">
              Study Streak Heatmap
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Yeh aapka daily consistency board hai. Click any grid square to see questions solved, practiced subjects, and study hours.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span>Not Studied</span>
            <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800 block" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-250 block" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-450 block" />
            <span className="w-3.5 h-3.5 rounded bg-emerald-650 block" />
            <span>High Intensity</span>
          </div>
        </div>

        {/* Calendar Box layout */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto">
          {/* Heatmap Grid containing 16 columns of 7 days */}
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[650px] justify-between">
            {heatmapDays.map((item, idx) => (
              <button
                key={item.dateStr}
                id={`heatmap-square-${item.dateStr}`}
                onClick={() => setSelectedDayRecord(item.record || { date: item.dateStr, questionsSolved: 0, chaptersPracticed: [], timeSpent: 0 })}
                className={`w-4 h-4 rounded-xs transition-all cursor-pointer ${getHeatmapColorClass(item.record)} ${
                  selectedDayRecord?.date === item.dateStr ? 'ring-2 ring-blue-500 scale-110 z-10' : ''
                }`}
                title={`${formatHumanDate(item.dateStr)}: ${item.record ? item.record.questionsSolved : 0} Questions solved`}
              />
            ))}
          </div>
        </div>

        {/* Click details reporter widget */}
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-2xl text-left">
          {selectedDayRecord ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center flex-wrap">
                <span className="text-sm font-bold text-blue-800 dark:text-blue-400 font-poppins">
                  Date: {formatHumanDate(selectedDayRecord.date)}
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full">
                  Status: {selectedDayRecord.questionsSolved > 0 ? '🚀 studied' : '💤 Not studied yet'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-slate-700 dark:text-slate-350">
                    Questions Solved: <strong className="font-mono text-sm">{selectedDayRecord.questionsSolved}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-cyan-500" />
                  <span className="text-xs text-slate-700 dark:text-slate-350">
                    Time Spent practicing: <strong className="font-mono text-sm">{selectedDayRecord.timeSpent} mins</strong>
                  </span>
                </div>

                <div className="flex items-start space-x-2 md:col-span-1">
                  <Layers className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div className="text-xs text-slate-705 dark:text-slate-350">
                    <span>Topics Practiced:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDayRecord.chaptersPracticed.length > 0 ? (
                        selectedDayRecord.chaptersPracticed.map((ch, i) => (
                          <span key={i} className="bg-purple-100/70 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {ch}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No topics started</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-500">
              Click on a heatmap square block above to view your daily progress summary.
            </div>
          )}
        </div>

      </div>

      {/* RECENTLY PRACTICE CHAPTERS CARD LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recently practiced chapter list */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
            <History className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-bold font-poppins">Recently Practiced Chapters</h3>
          </div>
          
          <div className="space-y-3">
            {stats.recentlyPracticed.map((ch, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-250 truncate max-w-[280px]">
                    {ch}
                  </span>
                </div>
                <button
                  onClick={() => onChangeTab('practice-onboarding')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Recall / Practice
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick mentorship & videos dashboard prompt card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-left text-white flex flex-col justify-between shadow-md">
          <div className="space-y-3">
            <span className="bg-white/20 border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-poppins inline-block">
              Free Guidance Session
            </span>
            <h3 className="text-2xl font-bold font-poppins leading-snug">
              Stuck on complex physics problems or chemical equations?
            </h3>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed max-w-md">
              Aap do demo lecture Bilkul free book kar sakte hain professional mentors ke saath, to review your board or entrance test syllabus.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => onChangeTab('mentorship')}
              className="px-4 py-2.5 bg-white text-indigo-950 font-bold font-poppins rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer shadow-md"
            >
              Book Free Demo Session
            </button>
            <button
              onClick={() => onChangeTab('doubt-support')}
              className="px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-white font-semibold rounded-xl text-xs border border-white/20 transition-all"
            >
              Upload Doubt Photo
            </button>
          </div>
        </div>

      </div> {/* Close recent chapter grid */}
    </div> {/* Close Right column */}
  </div> {/* Close DOUBLE-GRID CONTAINER */}

  {isEditing && (
        <div id="dashboard-profile-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-left relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white">
                Modify Preparation Goal
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Student Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white transition-all font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Target Preparation Exam</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JEE', 'NEET', 'CBSE'] as Exam[]).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setEditExam(ex)}
                      className={`py-2 px-1 text-[11px] font-bold font-poppins rounded-xl border transition-all cursor-pointer text-center ${
                        editExam === ex
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {ex === 'JEE' ? 'JEE Mains+' : ex === 'NEET' ? 'NEET UG' : 'CBSE Board'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Your Current Class / Year</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Class 11', 'Class 12', 'Dropper'] as AcademicLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEditLevel(lvl)}
                      className={`py-2 px-1 text-[11px] font-bold font-poppins rounded-xl border transition-all cursor-pointer text-center ${
                        editLevel === lvl
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {lvl === 'Dropper' ? 'Dropper Batch' : lvl === 'Class 11' ? 'Class 11th' : 'Class 12th'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                Apply Changes & Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

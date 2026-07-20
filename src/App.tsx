import React, { useState, useEffect } from 'react';
import { 
  getUserProfile, 
  saveUserProfile, 
  getBrandingConfig, 
  initializeDatabase,
  getStoredChapters,
  getStoredQuestions
} from './utils/storage';
import { UserProfile, BrandingConfig, ChapterVideo, Exam, AcademicLevel, Subject } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Features from './components/Features';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PracticeSession from './components/PracticeSession';
import DoubtSupport from './components/DoubtSupport';
import Mentorship from './components/Mentorship';
import Subscription from './components/Subscription';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import ChapterLibrary from './components/ChapterLibrary';
import LectureLibrary from './components/LectureLibrary';
import MockPredictor from './components/MockPredictor';
import PitStops from './components/PitStops';
import SingleQuestionPractice from './components/SingleQuestionPractice';
import { Play, X, Sparkles, BookOpen, Clock, Layers, Database, ShieldAlert, Terminal, Activity } from 'lucide-react';

import { auth, authReady } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthToken, getRestoredAuthUser, logAuthDebug, logoutUser, waitForAuthInit } from './utils/firebaseAuth';
import { API_BASE_URL } from './config';

function resolveTabFromPath(path: string): string {
  if (path.startsWith('/practice/question/')) return 'single-practice';
  if (path.startsWith('/stopovers') || path.startsWith('/pit-stops')) return 'pit-stops';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/passport')) return 'dashboard';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/practice')) return 'practice-onboarding';
  if (path.startsWith('/login')) return 'home';
  return 'home';
}

const DEFAULT_GUEST_PROFILE: UserProfile = {
  name: '',
  targetExam: 'JEE',
  academicLevel: 'Class 12',
  role: 'Student',
  isPremium: false,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
};

function buildGuestProfile(): UserProfile {
  return { ...DEFAULT_GUEST_PROFILE };
}

function isProtectedRoute(path: string): boolean {
  return (
    path.startsWith('/dashboard') ||
    path.startsWith('/practice') ||
    path.startsWith('/stopovers') ||
    path.startsWith('/pit-stops') ||
    path.startsWith('/passport') ||
    path.startsWith('/admin')
  );
}

// Protected tab NAMES (additional safety layer)
const PROTECTED_TABS = [
  'dashboard',
  'admin',
  'practice-onboarding',
  'chapter-library',
  'practice-session',
  'single-practice',
  'pit-stops',
  'lectures'
];

function isProtectedTab(tab: string): boolean {
  return PROTECTED_TABS.includes(tab);
}

function mapDatabaseUserToProfile(dbUser: any, firebaseUser: FirebaseUser, fallbackProfile: UserProfile): UserProfile {
  return {
    name: dbUser.name || firebaseUser.displayName || fallbackProfile.name || 'Student',
    targetExam: dbUser.targetExam || fallbackProfile.targetExam || 'JEE',
    academicLevel: dbUser.classLevel || fallbackProfile.academicLevel || 'Class 12',
    role: dbUser.plan === 'Admin' ? 'Admin' : 'Student',
    isPremium: dbUser.plan === 'Premium' || dbUser.plan === 'Admin',
    avatarUrl: firebaseUser.photoURL || fallbackProfile.avatarUrl,
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || fallbackProfile.email,
    dreamCollege: dbUser.dreamCollege || undefined,
    journeyProgress: dbUser.journeyProgress !== null && dbUser.journeyProgress !== undefined ? dbUser.journeyProgress : 0,
    passportStage: dbUser.passportStage || 'class11'
  };
}

export default function App() {
  // Database Initialized flag
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Application Global States
  const [user, setUser] = useState<UserProfile>(() => getUserProfile());
  const [authenticatedUser, setAuthenticatedUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [postgresUserFound, setPostgresUserFound] = useState<'Checking' | 'Found' | 'Not Found' | 'Offline' | 'Logged Out'>('Checking');
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true);

  // Check if Firebase Auth is initialized
  useEffect(() => {
    (async () => {
      await authReady;
      if (auth && auth.app) {
        setFirebaseInitialized(true);
      }
    })();
  }, []);

  const buildProfileFromFirebase = (firebaseUser: FirebaseUser, fallbackProfile: UserProfile): UserProfile => ({
    ...fallbackProfile,
    name: firebaseUser.displayName || fallbackProfile.name || 'Student',
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || fallbackProfile.email,
    avatarUrl: firebaseUser.photoURL || fallbackProfile.avatarUrl,
  });

  const syncAndLoadUserProfile = async (firebaseUser: FirebaseUser, fallbackProfile: UserProfile): Promise<UserProfile> => {
    const token = await getAuthToken(firebaseUser);
    if (!token) {
      throw new Error('No auth token available');
    }

    const syncRes = await fetch(`${API_BASE_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
  targetExam: fallbackProfile.targetExam || 'JEE',
  academicLevel: fallbackProfile.academicLevel || 'Class 12',
  name: fallbackProfile.name || firebaseUser.displayName || 'Student',
  email: firebaseUser.email
})
    });

    if (!syncRes.ok) {
      throw new Error(`User sync failed with status ${syncRes.status}`);
    }

    logAuthDebug('SYNC_SUCCESS', { uid: firebaseUser.uid });

    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`User profile load failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data?.user) {
      throw new Error('No user profile returned from /api/users/me');
    }

    const syncedProfile = mapDatabaseUserToProfile(data.user, firebaseUser, fallbackProfile);
    logAuthDebug('PROFILE_LOADED', { uid: firebaseUser.uid });
    return syncedProfile;
  };

  // Listen to Firebase Auth state change and handle session persistence
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      await waitForAuthInit();
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (cancelled) return;

        try {
          if (firebaseUser) {
            logAuthDebug('AUTH_RESTORED', { uid: firebaseUser.uid });
            setAuthenticatedUser(firebaseUser);
            setPostgresUserFound('Checking');

            const fallbackProfile = getUserProfile();
            const firebaseProfile = buildProfileFromFirebase(firebaseUser, fallbackProfile);
            setUser(firebaseProfile);
            saveUserProfile(firebaseProfile);

            try {
              const syncedProfile = await syncAndLoadUserProfile(firebaseUser, fallbackProfile);
              if (cancelled) return;
              setUser(syncedProfile);
              saveUserProfile(syncedProfile);
              setPostgresUserFound('Found');
            } catch (syncErr) {
              console.error('Error syncing auth profile:', syncErr);
              if (cancelled) return;
              setPostgresUserFound('Offline');
            }
          } else {
            logAuthDebug('AUTH_RESTORED', { uid: null });
            setAuthenticatedUser(null);
            setPostgresUserFound('Logged Out');
            const resetGuest = buildGuestProfile();
            setUser(resetGuest);
            saveUserProfile(resetGuest);
          }
        } catch (authErr) {
          console.error('Error handling auth state:', authErr);
          if (cancelled) return;
          setPostgresUserFound('Offline');
        } finally {
          if (!cancelled) {
            setAuthLoading(false);
          }
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const [branding, setBranding] = useState<BrandingConfig>(() => getBrandingConfig());

  // Custom SPA router layer to preserve path & back-button states across refreshes and history pops
  const [urlPath, setUrlPath] = useState<string>(window.location.pathname);
  const [urlSearch, setUrlSearch] = useState<string>(window.location.search);
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return resolveTabFromPath(window.location.pathname);
  });

  const navigateTo = (path: string, search: string = '') => {
    let fullUrl = path;
    if (search) {
      fullUrl += search.startsWith('?') ? search : '?' + search;
    }
    window.history.pushState(null, '', fullUrl);
    setUrlPath(path);
    setUrlSearch(search);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      setUrlPath(path);
      setUrlSearch(search);
      setCurrentTab(resolveTabFromPath(path));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Practice state
  const [activeChapterIdForPractice, setActiveChapterIdForPractice] = useState<string | null>(null);
  const [activeChapterIdForLectures, setActiveChapterIdForLectures] = useState<string | null>(null);
  const [loginGatewayChapterId, setLoginGatewayChapterId] = useState<string | null>(null);
  const [sessionYearForPractice, setSessionYearForPractice] = useState<number | 'All'>('All');
  const [sessionNameForPractice, setSessionNameForPractice] = useState<string | 'All'>('All');
  const [startQuestionIndexForPractice, setStartQuestionIndexForPractice] = useState<number>(0);

  // Onboarding preserved states
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [onboardExam, setOnboardExam] = useState<Exam>('JEE');
  const [onboardLevel, setOnboardLevel] = useState<AcademicLevel>('Class 12');
  const [onboardSubject, setOnboardSubject] = useState<Subject>('Physics');

  // Onboarding Exam deep path CTA trigger
  const [onboardExamDeepPath, setOnboardExamDeepPath] = useState<Exam | null>(null);

  // Concept Streaming Video state (YouTube Embed overlays)
  const [activePlayVideo, setActivePlayVideo] = useState<ChapterVideo | null>(null);

  // Scroll to absolute top of the webpage when any view/tab or active practice chapter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [currentTab, activeChapterIdForPractice]);

  // Route Protection Interceptor
  useEffect(() => {
    if (authLoading) return; // Wait until initial auth load settles

    const isAuth = !!authenticatedUser;

    if (isProtectedRoute(urlPath) && !isAuth) {
      if (!urlPath.startsWith('/login')) {
        navigateTo('/login', `?redirect=${encodeURIComponent(urlPath + urlSearch)}`);
        setCurrentTab('home');
      }
      setLoginGatewayChapterId('_general_');
    }
  }, [urlPath, urlSearch, authenticatedUser, authLoading]);

  useEffect(() => {
    if (urlPath.startsWith('/login') && !authenticatedUser) {
      setLoginGatewayChapterId('_general_');
    }
  }, [urlPath, authenticatedUser]);

  useEffect(() => {
    if (!urlPath.startsWith('/login')) return;
    if (!authenticatedUser) return;
    const redirectTo = new URLSearchParams(urlSearch).get('redirect');
    if (!redirectTo) return;
    const decoded = decodeURIComponent(redirectTo);
    const [pathPart, queryPart] = decoded.split('?');
    navigateTo(pathPart || '/', queryPart ? `?${queryPart}` : '');
    setCurrentTab(resolveTabFromPath(pathPart || '/'));
  }, [urlPath, urlSearch, authenticatedUser]);

  // Sync dynamic database reloads
  const refreshUserProfileState = async () => {
    try {
      const firebaseUser = await getRestoredAuthUser(authenticatedUser);
      if (!firebaseUser) {
        const guestProfile = buildGuestProfile();
        setAuthenticatedUser(null);
        setUser(guestProfile);
        saveUserProfile(guestProfile);
        return;
      }

      const syncedProfile = await syncAndLoadUserProfile(firebaseUser, getUserProfile());
      setAuthenticatedUser(firebaseUser);
      setUser(syncedProfile);
      saveUserProfile(syncedProfile);
      return;
    } catch (e) {
      console.error('Failed to async reload profile from server:', e);
    }
    setUser(getUserProfile());
  };

  const refreshBrandingState = () => {
    setBranding(getBrandingConfig());
  };

  // Toggle user permissions roles dynamically for rapid testing
  const handleToggleUserRole = () => {
    const nextRole = user.role === 'Admin' ? 'Student' : 'Admin';
    const updated: UserProfile = {
      ...user,
      role: nextRole
    };
    saveUserProfile(updated);
    setUser(updated);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      logAuthDebug('LOGOUT_SUCCESS');
    } catch (e) {
      console.error('Error signing out:', e);
    }
    const resetGuest = buildGuestProfile();
    setUser(resetGuest);
    saveUserProfile(resetGuest);
    setCurrentTab('home');
    navigateTo('/');
  };

  // On onboarding Chapter node card click
  const handleStartChapterPractice = (chapterId: string) => {
    if (authenticatedUser) {
      setActiveChapterIdForPractice(chapterId);
      setCurrentTab('chapter-library');
    } else {
      setLoginGatewayChapterId(chapterId);
    }
  };

  // Watch one-shot video inside frame popup
  const handleLaunchConceptVideo = (video: ChapterVideo) => {
    setActivePlayVideo(video);
  };

  // Initializing CTA actions on Home Screen hero
  const handleLaunchDirectExamPath = (selectedExam: Exam) => {
    setOnboardExamDeepPath(selectedExam);
    setCurrentTab('practice-onboarding');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-850"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-red-600 animate-spin"></div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase animate-pulse">
            Verifying Student Session & Syncing Database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
      
      {/* Dynamic branding styled top sticky Navbar banner */}
      <Navbar 
        user={user}
        branding={branding}
        currentTab={currentTab === 'single-practice' ? 'pit-stops' : currentTab}
        onChangeTab={(tab) => {
          if (isProtectedTab(tab) && !authenticatedUser) {
            navigateTo('/login', `?redirect=${encodeURIComponent(window.location.pathname)}`);
            setLoginGatewayChapterId('_general_');
            return;
          }

          setCurrentTab(tab);
          // Synchronize URL path with active tab click
          if (tab === 'pit-stops') {
            navigateTo('/stopovers');
          } else if (tab === 'home') {
            navigateTo('/');
          } else if (tab === 'dashboard') {
            navigateTo('/dashboard');
          } else if (tab === 'admin') {
            navigateTo('/admin');
          } else if (tab === 'practice-onboarding') {
            navigateTo('/practice');
          }
          // Clear active session pointers if they switch away
          if (tab !== 'practice-session' && tab !== 'chapter-library') {
            setActiveChapterIdForPractice(null);
            setOnboardExamDeepPath(null);
          }
        }}
        onToggleUserRole={handleToggleUserRole}
        onLogout={handleLogout}
      />

      {/* Main active views panels route router */}
      <main className="flex-grow">
        
        {/* HOMEPAGE VIEW (Combining Hero CTR and pre-organized SaaS Features list) */}
        {currentTab === 'home' && (
          <div className="space-y-12 pb-16 animate-fade-in">
            <Hero 
              branding={branding} 
              user={user}
              onInitiateExam={handleLaunchDirectExamPath} 
            />

            {/* Mock Test Rank Predictor Feature Block */}
            <MockPredictor user={user} />
            
            {/* Features section displaying six visual bento points */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-poppins">
                  🚀 SECURE YOUR COLLEGE TICKET
                </span>
                <h3 className="text-3xl font-extrabold font-poppins text-slate-900 dark:text-white tracking-tight">
                  Study Yatra Special Features
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Let's make learning easier and more productive. From simplified concept notes to live student mentorship panels, we have you fully covered.
                </p>
              </div>

              <Features 
                onSelectFeature={(featureTab) => {
                  if (featureTab === 'videos' || featureTab === 'concepts' || featureTab === 'pyqs' || featureTab === 'practice-onboarding') {
                    setCurrentTab('practice-onboarding');
                  } else if (featureTab === 'doubts' || featureTab === 'doubt-support') {
                    setCurrentTab('doubt-support');
                  } else if (featureTab === 'mentorship') {
                    setCurrentTab('mentorship');
                  } else if (featureTab === 'subscription') {
                    setCurrentTab('subscription');
                  }
                }} 
              />
            </div>
          </div>
        )}

        {/* PRACTICE MULTI-STEP ONBOARDING GRID */}
        {currentTab === 'practice-onboarding' && (
          <div className="animate-fade-in">
            <Onboarding 
              initialExam={onboardExamDeepPath}
              onSelectChapter={handleStartChapterPractice}
              onLaunchVideo={handleLaunchConceptVideo}
              onWatchLectures={(chapterId) => {
                setActiveChapterIdForLectures(chapterId);
                setCurrentTab('lectures');
              }}
              branding={branding}
              step={onboardStep}
              setStep={setOnboardStep}
              exam={onboardExam}
              setExam={setOnboardExam}
              level={onboardLevel}
              setLevel={setOnboardLevel}
              subject={onboardSubject}
              setSubject={setOnboardSubject}
            />
          </div>
        )}

        {/* CHAPTER QUESTION LIBRARY CONTROLLER VIEW */}
        {currentTab === 'chapter-library' && activeChapterIdForPractice && (
          <div className="animate-fade-in">
            <ChapterLibrary
              chapterId={activeChapterIdForPractice}
              onBack={() => {
                setOnboardStep(4);
                setCurrentTab('practice-onboarding');
              }}
              onStartPractice={(year, session, startIndex) => {
                setSessionYearForPractice(year);
                setSessionNameForPractice(session);
                setStartQuestionIndexForPractice(startIndex);
                setCurrentTab('practice-session');
              }}
            />
          </div>
        )}

        {/* STUDY YATRA - CHAPTER LECTURE LIBRARY TIMELINE */}
        {currentTab === 'lectures' && activeChapterIdForLectures && (
          <div className="animate-fade-in">
            <LectureLibrary
              chapterId={activeChapterIdForLectures}
              onBack={() => {
                setOnboardStep(4);
                setCurrentTab('practice-onboarding');
              }}
            />
          </div>
        )}

        {/* ACTIVE CLASSROOM TESTING FRAME AREA WORKSPACE */}
        {currentTab === 'practice-session' && activeChapterIdForPractice && (
          <div className="animate-fade-in">
            <PracticeSession 
              chapterId={activeChapterIdForPractice}
              onExit={() => {
                setCurrentTab('chapter-library'); // Redirect back to chapter question library (preview list)
              }}
              selectedYear={sessionYearForPractice}
              selectedSession={sessionNameForPractice}
              startQuestionIndex={startQuestionIndexForPractice}
            />
          </div>
        )}

        {/* SELF HEATMAP CONSISTENCY TRACKER DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="animate-fade-in">
            <Dashboard 
              user={user}
              onChangeTab={setCurrentTab}
              onEditProfile={() => {
                setOnboardExamDeepPath(null);
                setCurrentTab('practice-onboarding');
              }}
              onUpdateProfile={refreshUserProfileState}
            />
          </div>
        )}

        {/* DOUBT SUBMIT AND PUBLIC DISCUSSION LOG */}
        {currentTab === 'doubt-support' && (
          <div className="animate-fade-in">
            <DoubtSupport user={user} />
          </div>
        )}

        {/* STUDY YATRA - PIT STOPS BOOKMARKING */}
        {currentTab === 'pit-stops' && (
          <div className="animate-fade-in">
            <PitStops 
              user={user} 
              activeStopoverId={urlPath.startsWith('/stopovers/') ? urlPath.split('/').pop() : undefined}
              onSelectStopover={(stopoverId) => {
                const searchStr = window.location.search;
                if (stopoverId) {
                  navigateTo(`/stopovers/${stopoverId}`, searchStr);
                } else {
                  navigateTo('/stopovers', searchStr);
                }
              }}
              onNavigateToQuestion={(questionId, stopId) => {
                navigateTo(`/practice/question/${questionId}`, `?stopoverId=${stopId}`);
                setCurrentTab('single-practice');
              }}
            />
          </div>
        )}

        {/* CUSTOM SINGLE QUESTION PRACTICE WORKSPACE */}
        {currentTab === 'single-practice' && (
          <div className="animate-fade-in">
            <SingleQuestionPractice
              questionId={urlPath.split('/').pop() || ''}
              stopoverId={new URLSearchParams(urlSearch).get('stopoverId') || undefined}
              onNavigateBack={(stopId) => {
                if (stopId) {
                  navigateTo(`/stopovers/${stopId}`);
                  setCurrentTab('pit-stops');
                } else {
                  navigateTo('/stopovers');
                  setCurrentTab('pit-stops');
                }
              }}
            />
          </div>
        )}

        {/* 1-on-1 LIVE LECTURES SCHEDULER */}
        {currentTab === 'mentorship' && (
          <div className="animate-fade-in">
            <Mentorship user={user} />
          </div>
        )}

        {/* YATRA UNLIMITED CHOOSE PLANS */}
        {currentTab === 'subscription' && (
          <div className="animate-fade-in">
            <Subscription 
              user={user} 
              onUpgradeComplete={refreshUserProfileState} 
            />
          </div>
        )}

        {/* ADVANCED BRANDING AND EXAM CURRICULUM CONTROLLER */}
        {currentTab === 'admin' && (
          <div className="animate-fade-in">
            <AdminPanel 
              user={user} 
              branding={branding} 
              onRefreshBranding={refreshBrandingState}
              onRefreshUser={refreshUserProfileState}
            />
          </div>
        )}

      </main>

      {/* Persistent EdTech Footer banner */}
      <Footer branding={branding} onChangeTab={setCurrentTab} />

      {/* ONE-SHOT CONCEPT VIDEO MODAL STREAM OVERLAY */}
      {activePlayVideo && (
        <div id="video-streaming-player" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl border border-slate-205 dark:border-slate-800 shadow-premium overflow-hidden text-left font-sans">
            
            {/* Header title */}
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-red-500 fill-current" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold font-poppins">{activePlayVideo.title}</h4>
                  <span className="text-[10px] text-slate-400">Classroom One-Shot Webinar Lecture play</span>
                </div>
              </div>
              
              <button 
                onClick={() => setActivePlayVideo(null)}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-lg text-xs cursor-pointer font-bold transition-all"
              >
                Close Video [X]
              </button>
            </div>

            {/* Embed video container */}
            <div className="aspect-video w-full bg-black relative">
              <iframe
                id="chapter-youtube-iframe"
                src={activePlayVideo.url}
                title={activePlayVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Play overlay tags details */}
            <div className="p-5 space-y-3 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <span className="px-2.5 py-0.5 bg-red-105 text-red-600 bg-red-100 rounded uppercase text-[10px]">YouTube Streaming</span>
                <span className="text-slate-400">Chapter Topic Reference:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold">{activePlayVideo.chapterId}</span>
              </div>
              <p className="text-[11px] text-slate-450 leading-relaxed">
                Study Yatra brings standard revision series directly to help analyze numerical equations efficiently. Focus on keynotes and solve core chapters PYQs on completion.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* LOGIN MODAL AFTER CLICKING CONTINUE PRACTICE */}
      {loginGatewayChapterId && (
        <LoginModal
          chapterId={loginGatewayChapterId === '_general_' ? '' : loginGatewayChapterId}
          currentUser={user}
          branding={branding}
          onSuccess={() => {
            const redirectTo = new URLSearchParams(urlSearch).get('redirect');
            if (redirectTo) {
              const decoded = decodeURIComponent(redirectTo);
              const [pathPart, queryPart] = decoded.split('?');
              navigateTo(pathPart || '/', queryPart ? `?${queryPart}` : '');
              setCurrentTab(resolveTabFromPath(pathPart || '/'));
              setLoginGatewayChapterId(null);
              return;
            }
            if (loginGatewayChapterId !== '_general_') {
              setActiveChapterIdForPractice(loginGatewayChapterId);
              setLoginGatewayChapterId(null);
              setCurrentTab('chapter-library');
            } else {
              setLoginGatewayChapterId(null);
            }
          }}
          onClose={() => {
            setLoginGatewayChapterId(null);
            if (urlPath.startsWith('/login')) {
              navigateTo('/');
              setCurrentTab('home');
              return;
            }
            if (loginGatewayChapterId === '_general_') {
              setCurrentTab('home');
              navigateTo('/');
            }
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  X, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  HelpCircle,
  GraduationCap,
  Mail,
  Phone
} from 'lucide-react';
import { UserProfile, Chapter, Exam, AcademicLevel } from '../types';
import { getStoredChapters } from '../utils/storage';
import { loginWithGoogle, loginWithEmail, signUpWithEmail, logAuthDebug } from '../utils/firebaseAuth.ts';
import firebaseConfig from '../../firebase-applet-config.json';

const FIREBASE_AUTH_SETTINGS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

function getUnauthorizedDomainMessage(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return [
    `Google Sign-In is blocked for "${hostname}".`,
    'Add this exact domain in Firebase Console → Authentication → Settings → Authorized domains (no http://, no port).',
    origin.includes('127.0.0.1')
      ? 'Tip: open http://localhost:3000 instead — localhost is usually already authorized.'
      : `Your app is running at ${origin}. Add "${hostname}" to authorized domains.`,
    'Or use the Email & Password form below — it works without domain authorization.',
    `Open settings: ${FIREBASE_AUTH_SETTINGS_URL}`,
  ].join(' ');
}

interface LoginModalProps {
  chapterId: string;
  onSuccess: () => void;
  onClose: () => void;
  branding: {
    logoUrl?: string;
    logoText: string;
    logoColor: string;
  };
  currentUser: UserProfile;
}

export default function LoginModal({ 
  chapterId, 
  onSuccess, 
  onClose, 
  branding,
  currentUser 
}: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic targeting preferences loaded from UserProfile or safe default values
  const [targetExam, setTargetExam] = useState<Exam>(currentUser.targetExam || 'JEE');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(currentUser.academicLevel || 'Class 12');
  
  // Validation / Feedback states
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Active Chapter being unlocked
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    const chapters = getStoredChapters();
    const found = chapters.find(c => c.id === chapterId);
    if (found) {
      setActiveChapter(found);
    }
  }, [chapterId]);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const gUser = await loginWithGoogle();
      logAuthDebug('LOGIN_SUCCESS', { uid: gUser.uid, provider: 'google' });
      setIsSubmitting(false);
      setIsSuccess(true);
      setStudentName(gUser.displayName || currentUser.name || 'Student');

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';
      console.error('Core Google Sign-In catching error:', err);
      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user') || errCode === 'auth/popup-blocked' || errMsg.includes('popup')) {
        setError("Sign-In popup was closed or blocked. Because you are using the app within a sandbox iframe preview, popups are restricted. Try opening the app in a new tab OR use the quick 'Email & Password' form below, which works instantly and reliably!");
      } else if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
        setError(getUnauthorizedDomainMessage());
      } else {
        setError(errMsg || 'Google Sign-In failed');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mobile Number and Password Validations
    const cleaned = email.trim();
    let computedEmail = cleaned;
    
    const digitOnly = cleaned.replace(/\D/g, '');
    if (digitOnly.length >= 10 && !cleaned.includes('@')) {
      const tenDigits = digitOnly.slice(-10);
      computedEmail = `${tenDigits}@studyyatra.com`;
    } else if (!cleaned.includes('@')) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (mode === 'signup' && !studentName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      let firebaseUser;
      if (mode === 'signup') {
        console.log(`Attempting Firebase user registration: ${computedEmail}`);
        firebaseUser = await signUpWithEmail(computedEmail, password, studentName.trim());
        console.log(`Firebase registration success, UID: ${firebaseUser.uid}`);
      } else {
        console.log(`Attempting Firebase user login: ${computedEmail}`);
        firebaseUser = await loginWithEmail(computedEmail, password);
        console.log(`Firebase login success, UID: ${firebaseUser.uid}`);
      }
      logAuthDebug('LOGIN_SUCCESS', { uid: firebaseUser.uid, provider: 'password' });
      setStudentName(firebaseUser.displayName || studentName.trim() || 'Student');
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess();
      }, 1505);

    } catch (err: any) {
      const errMsg = err?.message || 'Authentication error';
      const errCode = err?.code || '';
      
      if (errCode === 'auth/operation-not-allowed' || errMsg.includes('operation-not-allowed')) {
        console.log('Firebase email/password auth is disabled for this project.');
        setIsSubmitting(false);
        setError('Email/Password sign-in is disabled in Firebase. Enable the Email/Password provider in Firebase Authentication to use this login form.');
        return;
      }

      console.error('Firebase/Server Authentication failure occurred:', err);

      setIsSubmitting(false);
      // Clean and short user feedback
      if (errCode === 'auth/email-already-in-use') {
        setError('This mobile number is already registered. Please login instead.');
      } else if (errCode === 'auth/wrong-password' || errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
        setError('Invalid credentials. Please verify your mobile number and password.');
      } else {
        setError(errMsg);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ tension: 240, friction: 22 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative"
      >
        
        {/* Top Header Controls bar */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 Transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          /* SUCCESS SCREEN STATE */
          <div className="p-8 sm:p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-[480px]">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="h-12 w-12" />
            </motion.div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-500 font-poppins">
                Authentication Successful
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">
                Great to see you, {mode === 'signup' ? studentName : (studentName || currentUser.name)}!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Your study profile has been loaded successfully. We are now unlocking your chapter-wise exam practice material.
              </p>
            </div>

            {activeChapter && (
              <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20 w-full max-w-xs text-left flex items-start space-x-3">
                <GraduationCap className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-poppins line-clamp-1">{activeChapter.name}</h4>
                  <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold">{activeChapter.subject} • PYQ Mock</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 animate-pulse">
              <span>Entering Online Simulator...</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        ) : (
          /* CORE LOGIN / SIGNUP VIEW */
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Logo, title and selected chapter info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <img 
                    src={branding.logoUrl || 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg'} 
                    alt="Study Yatra" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins leading-tight">
                    {branding.logoText} <span className="text-red-650 dark:text-red-500">Practice Portal</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">Student Secure Access Gateway</span>
                </div>
              </div>

              {/* Highlight context of why we are logging in */}
              {activeChapter && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 relative overflow-hidden">
                  <div className="absolute right-2 top-1 opacity-10">
                    <Sparkles className="h-10 w-10 text-rose-600" />
                  </div>
                  <div className="text-[10px] text-rose-650 dark:text-rose-400 font-extrabold uppercase tracking-wider font-poppins mb-1">
                    Unlocking Chapter Practice:
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-poppins line-clamp-1">
                    {activeChapter.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Target Exam: <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{activeChapter.exam}</span> • Subject: <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeChapter.subject}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Interactive Tab Bar */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-2 text-xs font-bold font-poppins rounded-xl transition-all cursor-pointer ${
                  mode === 'login' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Sign In / Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`py-2 text-xs font-bold font-poppins rounded-xl transition-all cursor-pointer ${
                  mode === 'signup' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Create Account (Free)
              </button>
            </div>

            {error && (
              <div className="text-left">
                {error.includes('operation-not-allowed') || error.includes('Email/Password') ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-slate-800 dark:text-slate-300 rounded-2xl border border-amber-200 dark:border-amber-900/30 text-xs space-y-3 shadow-inner">
                    <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider font-poppins">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Firebase Setup Required</span>
                    </div>
                    <p className="font-medium text-slate-650 dark:text-slate-400">
                      Email & Password authentication is not yet enabled in this Firebase project. To enable it, please follow these super simple steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 font-semibold text-slate-700 dark:text-slate-350 bg-white/40 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200/40">
                      <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700">Firebase Console</a></li>
                      <li>Go to <strong className="text-slate-900 dark:text-white">Authentication</strong> &rarr; <strong className="text-slate-900 dark:text-white">Sign-in method</strong></li>
                      <li>Click <strong className="text-slate-900 dark:text-white">Add new provider</strong> &rarr; select <strong className="text-slate-900 dark:text-white">Email/Password</strong></li>
                      <li>Toggle <strong className="text-amber-600 dark:text-amber-400">Enable</strong> &amp; click <strong className="text-blue-600 dark:text-blue-400">Save</strong></li>
                    </ol>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 italic">
                      After enabling the provider, refresh this page and sign in again. Google Sign-In also works if that provider is enabled and the domain is authorized.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 rounded-xl border border-red-200/40 text-[11px] font-semibold flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Google Sign In Quick Access */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer outline-none"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.5 15 0 12 0 7.4 0 3.4 2.7 1.6 6.6l3.9 3C6.4 6.7 9 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.5 14.3c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 6.6C.6 8.7 0 11 0 12s.6 3.3 1.6 5.4l3.9-3.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.6-1.7-6.5-4.5l-3.9 3C3.4 21.3 7.4 24 12 24z"
                />
              </svg>
              <span>{isSubmitting ? 'Verifying Account...' : 'Continue with Google (Secure)'}</span>
            </button>

            <div className="flex items-center my-1">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              <span className="px-3 text-[9px] uppercase font-bold text-slate-400 tracking-widest leading-none">or use mobile portal</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Interactive Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* STUDENT NAME FIELD IN SIGNUP MODE */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Full Student Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter full name for certificate & portal"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 transition-all text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* MOBILE NO FIELD */}
              <div id="mobile-number-field" className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Mobile / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="mobile-number-input"
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    pattern="[0-9]{10}"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 transition-all text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* TARGET EXAM & ACADEMIC COHORT SELECTORS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Target Exam Target
                  </label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value as Exam)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 transition-all text-slate-800 dark:text-slate-200"
                  >
                    <option value="JEE">JEE Mains</option>
                    <option value="NEET">NEET Pre-Medical</option>
                    <option value="CBSE">CBSE Boards Class 11-12</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Class / Year
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 transition-all text-slate-800 dark:text-slate-200"
                  >
                    <option value="Class 11">Class 11th</option>
                    <option value="Class 12">Class 12th</option>
                    <option value="Dropper">Dropper Batch</option>
                  </select>
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>Secure Account Password</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password (Min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800 transition-all font-mono text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* ACTION BTN SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Student Profile Linking...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Complete Profile & Start Practice' : 'Login & Unlock Practice Module'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>

            {/* Footer help line info */}
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center space-x-1">
              <HelpCircle className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] text-slate-400">
                Real student credentials stored securely in Firebase Auth. No credit card required.
              </span>
            </div>

          </div>
        )}

      </motion.div>
    </div>
  );
}

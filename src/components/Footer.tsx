import { BookOpen, Youtube, ArrowUpRight, Zap, Target, BookOpenCheck, HelpCircle, GraduationCap, Sparkles, Mail } from 'lucide-react';
import { BrandingConfig } from '../types';

interface FooterProps {
  branding: BrandingConfig;
  onChangeTab: (tab: string) => void;
}

export default function Footer({ branding, onChangeTab }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand/About Col */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm hover:scale-105 transition-transform">
                <img 
                  src={branding.logoUrl || 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg'} 
                  alt="Study Yatra Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xl font-bold font-poppins text-white tracking-tight">
                {branding.logoText}
              </span>
            </div>
            
            <p className="text-sm text-slate-400 font-poppins leading-relaxed">
              A structured study journey designed to simplify complex concepts for Class 11th and 12th students.
            </p>

            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/50 space-y-2.5">
              <span className="text-xs font-bold font-poppins text-blue-400 uppercase tracking-widest block">
                In this website you'll get:
              </span>
              <ul className="text-xs space-y-2 text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Easy-to-understand explanations of crucial core concepts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Exam-focused tips & tricks</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Chapter-wise videos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Thorough in-depth analysis of Previous Year Questions (PYQs)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Formulated tips & scoring strategies to boost your dynamic ranks</span>
                </li>
              </ul>
            </div>

            <p className="text-sm font-semibold text-blue-400 font-poppins">
              Making study exciting, structured, and interactive – with Study Yatra!
            </p>
            <p className="text-xs text-slate-500 font-poppins">
              Unlock your premium study journey and conquer your goals with confidence!
            </p>
          </div>

          {/* Quick Navigation Col */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold font-poppins text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Programmes
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button 
                    onClick={() => onChangeTab('practice-onboarding')}
                    className="hover:text-blue-400 transition-colors flex items-center space-x-1"
                  >
                    <span>JEE Practice</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-600" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onChangeTab('practice-onboarding')}
                    className="hover:text-blue-400 transition-colors flex items-center space-x-1"
                  >
                    <span>NEET Practice</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-600" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onChangeTab('practice-onboarding')}
                    className="hover:text-blue-400 transition-colors flex items-center space-x-1"
                  >
                    <span>CBSE Practice</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-600" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onChangeTab('subscription')}
                    className="hover:text-blue-400 text-amber-400 font-semibold transition-colors flex items-center space-x-1"
                  >
                    <span>Upgrade to Premium</span>
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold font-poppins text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Quick Links
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button onClick={() => onChangeTab('home')} className="hover:text-blue-400 transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => onChangeTab('doubt-support')} className="hover:text-blue-400 transition-colors">
                    Doubt Support
                  </button>
                </li>
                <li>
                  <button onClick={() => onChangeTab('mentorship')} className="hover:text-blue-400 transition-colors">
                    Mentorship
                  </button>
                </li>
                <li>
                  <button onClick={() => onChangeTab('dashboard')} className="hover:text-blue-400 transition-colors">
                    My Heatmap Dashboard
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Socials & YouTube channel promotion */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold font-poppins text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Official channel
            </h3>
            <p className="text-xs text-slate-400">
              Check out our YouTube channel, where daily core tips and trick videos are uploaded:
            </p>
            
            <a 
              href="https://www.youtube.com/@StudyYatra29" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600/20 hover:text-red-400 transition-all font-semibold"
            >
              <Youtube className="h-5 w-5 text-red-600" />
              <div className="text-left font-poppins">
                <span className="block text-sm leading-none font-bold">@StudyYatra29</span>
                <span className="text-[10px] text-red-600/80 font-normal">YouTube Channel • Join Us</span>
              </div>
            </a>

            <a 
              href="mailto:mrstudyyatra299@gmail.com"
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-blue-600/10 border border-blue-600/30 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-all font-semibold"
            >
              <Mail className="h-5 w-5 text-blue-500" />
              <div className="text-left font-poppins">
                <span className="block text-sm leading-none font-bold">Questions & Suggestions</span>
                <span className="text-[10px] text-blue-500/80 font-normal">mrstudyyatra299@gmail.com</span>
              </div>
            </a>

            <div className="pt-2 text-[10px] text-slate-500 space-y-1">
              <p>© {new Date().getFullYear()} Study Yatra. All rights reserved.</p>
              <p>Designed with ❤️ for aspirants across India.</p>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}

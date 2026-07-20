import React from 'react';
import { BookOpen, User, Shield, Sparkles, LogOut, Menu, X } from 'lucide-react';
import { UserProfile, BrandingConfig } from '../types';

interface NavbarProps {
  user: UserProfile;
  branding: BrandingConfig;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function Navbar({
  user,
  branding,
  currentTab,
  onChangeTab,
  onLogout
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'practice-onboarding', label: 'Practice PYQs' },
    { id: 'pit-stops', label: '🧭 Pit Stops' },
    { id: 'doubt-support', label: 'Doubt Support' },
    { id: 'mentorship', label: 'Mentorship 1-on-1' },
    { id: 'subscription', label: 'Premium Plan' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div 
            id="nav-logo"
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => { onChangeTab('home'); setMobileMenuOpen(false); }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200/60 dark:border-slate-800 transition-transform group-hover:scale-105">
              <img 
                src={branding.logoUrl || 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg'} 
                alt="Study Yatra Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xl font-bold font-poppins tracking-tight text-slate-900 dark:text-white transition-colors">
              {branding.logoText}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  currentTab === item.id || (item.id === 'practice-onboarding' && currentTab.startsWith('practice'))
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Admin Panel Link */}
            {user.role === 'Admin' && (
            <button
              id="nav-link-admin"
              onClick={() => onChangeTab('admin')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'admin'
                  ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin Panel</span>
            </button>
            )}
          </div>

          {/* User Metrics & Quick Actions */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Profile Brief */}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-700 pl-4">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 flex items-center justify-center cursor-pointer"
                onClick={() => onChangeTab('dashboard')}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="text-left cursor-pointer" onClick={() => onChangeTab('dashboard')}>
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[80px] leading-tight">
                  {user.name || 'Advitiya'}
                </p>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none truncate max-w-[60px]">
                    {user.targetExam}
                  </span>
                  {user.isPremium && (
                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/85 dark:text-amber-400 text-[8px] font-bold px-1 py-0.25 rounded">
                      PRO
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && user.firebaseUid && (
                <button
                  id="action-logout-btn"
                  onClick={onLogout}
                  title="Sign Out Account"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer ml-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Right Bar */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 select-none border-b border-slate-200 dark:border-slate-800 animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onChangeTab(item.id); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium whitespace-nowrap transition-all ${
                  currentTab === item.id || (item.id === 'practice-onboarding' && currentTab.startsWith('practice'))
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user.role === 'Admin' && (
            <button
              onClick={() => { onChangeTab('admin'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                currentTab === 'admin'
                  ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </span>
            </button>
            )}

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 px-3">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.targetExam} • {user.academicLevel}</p>
                  </div>
                </div>
                {user.isPremium && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    PRO
                  </span>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => { onChangeTab('dashboard'); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center space-x-1.5 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  <User className="h-4 w-4" />
                  <span>Go to My Dashboard</span>
                </button>

                {onLogout && user.firebaseUid && (
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center space-x-1.5 w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-650 dark:text-slate-400 dark:hover:text-red-400 rounded-lg text-sm font-semibold transition-all mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out / Log Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../utils/storage';
import { getAuthToken } from '../utils/firebaseAuth';
import { Check, Flame, Star, ShieldCheck, Sparkles, X, CreditCard, Lock, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface SubscriptionProps {
  user: UserProfile;
  onUpgradeComplete: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Subscription({ user, onUpgradeComplete }: SubscriptionProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleUpgradeClick = async () => {
    if (user.isPremium) return;
    setIsProcessing(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setNotification('You must be logged in to upgrade.');
        setIsProcessing(false);
        return;
      }

      const orderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ purpose: 'premium_upgrade' })
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Study Yatra',
        
        description: 'Premium Subscription',
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              setNotification('Payment verification failed. Please contact support if money was deducted.');
              setIsProcessing(false);
              return;
            }

            const updatedProfile: UserProfile = { ...user, isPremium: true };
            saveUserProfile(updatedProfile);
            onUpgradeComplete();


            setNotification('Welcome! Your Study Yatra Premium subscription is now active.');
            setTimeout(() => setNotification(null), 6000);
          } catch (err) {
            console.error('Payment verification error:', err);
            setNotification('Something went wrong verifying your payment. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email || ''
        },
        theme: {
          color: '#059669'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Failed to start payment:', err);
      setNotification('Failed to start payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDowngradeClick = () => {
    const updatedProfile: UserProfile = {
      ...user,
      isPremium: false
    };
    saveUserProfile(updatedProfile);
    onUpgradeComplete();
    
    setNotification('Downgraded to free plan. All unlimited chapters are still open for you.');
    setTimeout(() => setNotification(null), 4005);
  };

  const premiumBenefits = [
    { text: 'Predicted and expected questions', free: false, premium: true },
    { text: 'Mock generator (coming soon)', free: false, premium: true },
    { text: '10 questions doubt solve (video solution)', free: false, premium: true },
    { text: '1 lecture 1-on-1 live mentorship', free: false, premium: true },
    { text: 'All PYQs (Chapter-wise)', free: true, premium: true },
    { text: 'Chapter-wise concise lecture videos', free: true, premium: true },
    { text: 'Self Consistency Heatmap logs', free: true, premium: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-805 text-amber-800 dark:text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-poppins">
          ⭐ Unlock Speed Rank strategies
        </span>
        <h2 className="text-3xl font-extrabold font-poppins text-slate-900 dark:text-white tracking-tight">
          Select Your Study Yatra Plan
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Elevate your learning path. Free members get unlimited access to core questions, while Premium provides elite mock shortcuts.
        </p>
      </div>

      {notification && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-250/50 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm animate-fade-in text-left">
          <Check className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid containing two plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        
        {/* FREE PLAN CARD */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between text-left relative overflow-hidden">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-poppins block">Pre-organized access</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-poppins">Study Yatra Basic</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Our core educational content will always remain open. Unlimited access is preloaded to help strengthen your foundation.
            </p>

            <div className="flex items-baseline space-x-1 py-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">₹0</span>
              <span className="text-xs text-slate-400 font-medium">/ Always Free Access</span>
            </div>

            <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350">
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Unlimited JEE, NEET, CBSE Chapter PYQs</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Concept Explanations / keynotes</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Preloaded Chapter Videos</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Heatmap study streak logs</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Doubt Support public solver access</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed text-center select-none"
            >
              Active Free access profile
            </button>
          </div>
        </div>

        {/* PREMIUM PRO PLAN CARD */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl border-2 border-emerald-500 flex flex-col justify-between text-left relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl font-poppins">
            ⭐ BEST VALUE PREP
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-poppins block">Elite Speed Drillers</span>
              <h3 className="text-2xl font-black text-white font-poppins flex items-center">
                <span>Study Yatra Premium</span>
                <Sparkles className="h-5 w-5 text-amber-400 ml-1.5 animate-bounce" />
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Crack examinations with accuracy shortcuts, elite expected filters, prioritize doubt slots, and custom practice decks.
            </p>

            <div className="flex items-baseline space-x-1 py-2">
              <span className="text-4xl font-extrabold text-white font-mono">₹1000</span>
              <span className="text-xs text-slate-400 font-medium font-poppins">/ month (Auto-renewal off)</span>
            </div>

            <ul className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-300">Predicted and expected questions</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Mock generator (coming soon)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>10 questions doubt solve (video solution)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>1 lecture 1-on-1 live</span>
              </li>
            </ul>
          </div>

          <div className="pt-8 space-y-2">
            {user.isPremium ? (
              <div className="space-y-2">
                <button
                  id="cancel-sub-btn"
                  onClick={handleDowngradeClick}
                  className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-semibold select-none cursor-pointer text-center"
                >
                  Downgrade / Revert Premium
                </button>
                <span className="text-[10px] text-emerald-400 font-bold block text-center font-mono">✨ Premium Pro member enabled</span>
              </div>
            ) : (
              <button
                id="upgrade-premium-trigger"
                onClick={handleUpgradeClick}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs sm:text-sm cursor-pointer shadow-md text-center"
              >
                {isProcessing ? 'Opening secure checkout...' : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Matrix comparisons benefits */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-left space-y-4">
        <h4 className="text-base font-bold font-poppins text-slate-900 dark:text-white">Detailed benefit comparison log:</h4>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {premiumBenefits.map((b, i) => (
            <div key={i} className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-350">{b.text}</span>
              <div className="flex space-x-12 pr-4 text-[10px] font-bold">
                <span className={b.free ? 'text-emerald-505 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'}>
                  {b.free ? 'YES' : 'NO'}
                </span>
                <span className="text-emerald-505 dark:text-emerald-400 block w-10 text-right">
                  YES
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

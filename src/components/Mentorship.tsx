import React, { useState, useEffect } from 'react';
import { UserProfile, LectureBooking, Subject, Exam, AcademicLevel } from '../types';
import { getStoredBookings, saveBooking, updateBookingStatus } from '../utils/storage';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';
import { 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  BookOpen, 
  CreditCard, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Info,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface MentorshipProps {
  user: UserProfile;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Mentorship({ user }: MentorshipProps) {
  const [bookings, setBookings] = useState<LectureBooking[]>([]);
  const [studentName, setStudentName] = useState<string>(user.name || '');
  const [exam, setExam] = useState<Exam>(user.targetExam);
  const [level, setLevel] = useState<AcademicLevel>(user.academicLevel);
  const [subject, setSubject] = useState<Subject>('Physics');
  const [preferredTime, setPreferredTime] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  
  // Step tracker to determine if they qualify for Free Demo 1, Free Demo 2, or ₹500 Paid Session
  const [lectureType, setLectureType] = useState<'Demo 1 (Free)' | 'Demo 2 (Free)' | 'Paid Session (₹500)'>('Demo 1 (Free)');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setBookings(getStoredBookings());
    determineNextLectureType(getStoredBookings());
  }, []);

  const determineNextLectureType = (records: LectureBooking[]) => {
    const studentRecords = records.filter(b => b.studentName.toLowerCase().trim() === (user.name || '').toLowerCase().trim());
    if (studentRecords.length === 0) {
      setLectureType('Demo 1 (Free)');
    } else if (studentRecords.length === 1) {
      setLectureType('Demo 2 (Free)');
    } else {
      setLectureType('Paid Session (₹500)');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !preferredTime.trim() || !contactNumber.trim()) return;

    const amount = lectureType.includes('Free') ? 0 : 500;

    const draft: LectureBooking = {
      id: `booking-${Date.now()}`,
      studentName: studentName.trim(),
      exam,
      level,
      subject,
      preferredTime: preferredTime.trim(),
      contactNumber: contactNumber.trim(),
      type: lectureType,
      amount,
      status: 'Pending',
      paid: amount === 0, // Free sessions are pre-authorized
      timestamp: new Date().toISOString()
    };

    if (amount > 0) {
      await startRazorpayPayment(draft);
    } else {
      // Direct booking save
      saveBooking(draft);
      const updated = getStoredBookings();
      setBookings(updated);
      determineNextLectureType(updated);
      
      // Reset
      setPreferredTime('');
      setContactNumber('');
      setNotification('Free Demo Session Booking registered successfully! Mentor will call in 15 mins.');
      setTimeout(() => setNotification(null), 6000);
    }
  };

  // Real Razorpay checkout: creates a signed order on the backend, opens the
  // official Razorpay widget, and only marks the booking as paid after the
  // backend has verified the payment signature server-side.
  const startRazorpayPayment = async (draft: LectureBooking) => {
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setNotification('You must be logged in to book a paid session.');
        setIsProcessing(false);
        return;
      }

      const orderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          purpose: 'mentorship',
          metadata: {
            subject: draft.subject,
            studentName: draft.studentName,
            preferredTime: draft.preferredTime,
            contactNumber: draft.contactNumber
          }
        })
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
        description: 'Mentorship Paid Session (₹500)',
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

            const paidBooking: LectureBooking = {
              ...draft,
              paid: true,
              status: 'Approved'
            };

            saveBooking(paidBooking);
            const updated = getStoredBookings();
            setBookings(updated);
            determineNextLectureType(updated);

            setPreferredTime('');
            setContactNumber('');
            setNotification('Payment verified! Lecture ₹500 booked. Mentor will confirm your slot shortly.');
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
          name: draft.studentName,
          contact: draft.contactNumber
        },
        theme: {
          color: '#2563eb'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title section */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="bg-blue-105 border border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-poppins">
          ✨ Personal Mentorship 1-on-1 Guidance
        </span>
        <h2 className="text-3xl font-extrabold font-poppins text-slate-900 dark:text-white tracking-tight">
          Want a Complete live Lecture on a Topic?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
          Get a dedicated, full-length , live lecture on any chapter or topic — taught exactly the way you need it
        </p>
      </div>

      {notification && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-250/50 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm animate-fade-in text-left">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Progressive Demo Roadmap Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Lecture 1 trial card */}
        <div className={`p-5 rounded-2xl border text-left flex items-start space-x-3.5 relative overflow-hidden transition-all ${
          lectureType === 'Demo 1 (Free)'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md scale-102 z-10'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-305'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            lectureType === 'Demo 1 (Free)' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
          }`}>
            1
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold block text-blue-200 font-poppins">Free trial</span>
            <h4 className="text-base font-extrabold font-poppins">Lecture 1: FREE Demo</h4>
            <p className="text-[11px] opacity-80 mt-1 max-w-[210px]">Pehla lecture bilkul muft. No card details required. Select subject and register.</p>
          </div>
          {lectureType !== 'Demo 1 (Free)' && (
            <div className="absolute top-2 right-2 text-emerald-500 font-bold text-xs flex items-center space-x-0.5 uppercase font-mono bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>DONE</span>
            </div>
          )}
        </div>

        {/* Lecture 2 trial card */}
        <div className={`p-5 rounded-2xl border text-left flex items-start space-x-3.5 relative overflow-hidden transition-all ${
          lectureType === 'Demo 2 (Free)'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md scale-102 z-10'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-305'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            lectureType === 'Demo 2 (Free)' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
          }`}>
            2
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold block text-blue-200 font-poppins">Second trial</span>
            <h4 className="text-base font-extrabold font-poppins">Lecture 2: FREE Demo</h4>
            <p className="text-[11px] opacity-80 mt-1 max-w-[210px]">Doosra conceptual session bhi free hai, so you verify quality before subscribing.</p>
          </div>
          {bookings.filter(b => b.studentName.toLowerCase().trim() === (user.name || '').toLowerCase().trim()).length >= 2 && (
            <div className="absolute top-2 right-2 text-emerald-500 font-bold text-xs flex items-center space-x-0.5 uppercase font-mono bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>DONE</span>
            </div>
          )}
        </div>

        {/* Paid session info */}
        <div className={`p-5 rounded-2xl border text-left flex items-start space-x-3.5 relative overflow-hidden transition-all ${
          lectureType === 'Paid Session (₹500)'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-purple-500 shadow-md scale-102 z-10'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-305'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            lectureType === 'Paid Session (₹500)' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
          }`}>
            ₹
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold block text-purple-200 font-poppins">Advanced mentorship</span>
            <h4 className="text-base font-extrabold font-poppins">Lecture 3+: ₹500/session</h4>
            <p className="text-[11px] opacity-80 mt-1 max-w-[210px]">Subsequent sessions are paid at ₹500 key slot fees, powered by secure transactions.</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Booking Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-6">
          <div className="flex items-center space-x-2 text-slate-905 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="text-lg font-bold font-poppins">Mentorship Scheduler</h3>
              <p className="text-[10px] text-slate-400 font-medium">Classroom slots book inside 1 minute</p>
            </div>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            
            {/* Academic indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Exam:</span>
                <span className="block px-3 py-2 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 rounded-lg select-none">
                  {exam}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Class:</span>
                <span className="block px-3 py-2 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-755 dark:text-slate-355 rounded-lg select-none">
                  {level}
                </span>
              </div>
            </div>

            {/* Student Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Student Name:</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter Student Name"
                  className="pl-9 pr-3 py-2 w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Subject Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Subject Topic:</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="pl-9 pr-3 py-2 w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                  <option value="Botany">Botany</option>
                  <option value="Zoology">Zoology</option>
                </select>
              </div>
            </div>

            {/* Preferred Time Slot */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Preferred Time Date:</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. Tomorrow 4:00 PM, or 15 June 2PM"
                  className="pl-9 pr-3 py-2 w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-705 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Contact / WhatsApp Number:</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 - Mobile number for SMS link"
                  className="pl-9 pr-3 py-2 w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-705 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Price block */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 rounded-xl flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-505 dark:text-slate-400">Class Type: <strong className="text-blue-600">{lectureType}</strong></span>
              <span className="font-bold text-slate-900 dark:text-white text-sm font-mono">
                {lectureType.includes('Free') ? '₹0 (FREE)' : '₹500 PAY'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-750 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{isProcessing ? 'Opening secure checkout...' : lectureType.includes('Free') ? 'Register Free Lecture Slot' : 'Proceed to Razorpay Checkout'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>

          </form>
        </div>

        {/* Right Side: Log of Bookings list */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white text-left">Your Mentorship Slot Bookings ({bookings.length})</h3>

          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No mentorship sessions scheduled yet. Post a booking to start live lessons.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                        b.type.includes('Free') 
                          ? 'bg-blue-105 text-blue-700 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400' 
                          : 'bg-purple-105 text-purple-700 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400'
                      }`}>
                        {b.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{new Date(b.timestamp).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 dark:text-white font-poppins capitalize leading-snug">
                      {b.subject} Mentorship call
                    </h4>
                    
                    <p className="text-xs text-slate-405 leading-none">
                      Schedule: <strong className="text-slate-700 dark:text-slate-300 font-mono">{b.preferredTime}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Contact: {b.contactNumber} • Candidate: {b.studentName} ({b.exam} {b.level})
                    </p>
                  </div>

                  {/* Actions Status */}
                  <div className="shrink-0 flex items-center space-x-2 w-full sm:w-auto justify-end sm:justify-start">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350 font-mono">
                      {b.amount === 0 ? 'FREE' : `₹${b.amount} PAID`}
                    </span>
                    
                    {b.status === 'Approved' ? (
                      <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        <CheckCircle className="h-3 w-3 fill-current" />
                        <span>Confirmed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 text-xs font-bold px-3 py-0.5 rounded-full animate-pulse">
                        <Clock className="h-3 w-3" />
                        <span>Awaiting Verify</span>
                      </span>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

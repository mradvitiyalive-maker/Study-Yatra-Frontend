import React, { useState, useEffect } from 'react';
import { UserProfile, Doubt, Subject } from '../types';
import { HelpCircle, MessageSquarePlus, Image, FileText, Send, CheckCircle2, AlertCircle, Clock, UserCheck, ShieldAlert, CreditCard, ShieldCheck, Zap, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';

interface DoubtSupportProps {
  user: UserProfile;
}

export default function DoubtSupport({ user }: DoubtSupportProps) {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [subject, setSubject] = useState<Subject>('Physics');
  const [doubtText, setDoubtText] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // Drag-and-drop file statuses
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Razorpay Doubt payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Admin reply inputs
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [replyVideoInput, setReplyVideoInput] = useState<Record<string, string>>({});

  const loadDoubts = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setNotification({ type: 'error', message: 'You must be logged in to view doubts.' });
        setDoubts([]);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/doubts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setDoubts(data);
    } catch (err) {
      console.error('Failed to load doubts from database:', err);
      setNotification({ type: 'error', message: 'Could not load doubts from the database. Please check your connection and try again.' });
      setDoubts([]);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, [user.firebaseUid]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setNotification({
      type: 'success',
      message: `Image "${file.name}" uploaded to draft successfully!`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit a doubt to the database. Requires auth - no localStorage fallback,
  // since a doubt that only exists in the student's own browser will never
  // reach a real teacher.
  const processDoubtSubmission = async (targetSubject: Subject, textQuestion: string, imgUrl: string | null) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setNotification({ type: 'error', message: 'You must be logged in to submit a doubt.' });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/doubts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: targetSubject,
          question: textQuestion,
          imageUrl: imgUrl || null
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      await loadDoubts();

      setDoubtText('');
      setImagePreviewUrl(null);

      setNotification({
        type: 'success',
        message: 'Doubt submitted successfully! Humare expert teachers jaldi hi answer karenge.'
      });
      setTimeout(() => setNotification(null), 5550);
    } catch (err) {
      console.error('Failed to submit doubt to database:', err);
      setNotification({ type: 'error', message: 'Could not submit your doubt. Please check your connection and try again.' });
    }
  };

  // Submit Doubt Click
  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim()) return;

    if (!user.isPremium) {
      await startDoubtPayment(subject, doubtText.trim(), imagePreviewUrl);
      return;
    }

    // Is premium PRO, submits direct - no payment required
    await processDoubtSubmission(subject, doubtText.trim(), imagePreviewUrl);
  };

  // Initiate real Razorpay payment flow for a single doubt question (Rs 50)
  const startDoubtPayment = async (targetSubject: Subject, textQuestion: string, imgUrl: string | null) => {
    setIsProcessingPayment(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setNotification({ type: 'error', message: 'You must be logged in to submit a doubt.' });
        setIsProcessingPayment(false);
        return;
      }

      const orderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          purpose: 'doubt_question',
          metadata: {
            subject: targetSubject,
            question: textQuestion,
            imageUrl: imgUrl || null
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
        description: 'Doubt Resolution - Single Question',
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
              setNotification({ type: 'error', message: 'Payment verification failed. Please contact support if money was deducted.' });
              setIsProcessingPayment(false);
              return;
            }

            // Doubt was already inserted server-side by /api/payments/verify
            await loadDoubts();
            setDoubtText('');
            setImagePreviewUrl(null);

            setNotification({ type: 'success', message: 'Payment successful! Your doubt has been submitted to our experts.' });
            setTimeout(() => setNotification(null), 5550);
          } catch (err) {
            console.error('Payment verification error:', err);
            setNotification({ type: 'error', message: 'Something went wrong verifying your payment. Please contact support.' });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email || ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Failed to start doubt payment:', err);
      setNotification({ type: 'error', message: 'Failed to start payment. Please try again.' });
      setIsProcessingPayment(false);
    }
  };

  // Admin writes a Reply directly to doubt. Requires auth - no localStorage
  // fallback, since a reply that only lands in the admin's own browser will
  // never reach the actual student.
  const handleAdminReply = async (doubtId: string) => {
    const reply = replyInput[doubtId];
    const videoUrl = replyVideoInput[doubtId] || '';
    if (!reply || !reply.trim()) return;

    try {
      const token = await getAuthToken();
      if (!token) {
        setNotification({ type: 'error', message: 'You must be logged in as an admin to reply.' });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/doubts/${doubtId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          replyText: reply.trim(),
          replyVideoUrl: videoUrl.trim() || null
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      await loadDoubts();

      setReplyInput(prev => {
        const copy = { ...prev };
        delete copy[doubtId];
        return copy;
      });
      setReplyVideoInput(prev => {
        const copy = { ...prev };
        delete copy[doubtId];
        return copy;
      });

      setNotification({
        type: 'success',
        message: 'Reply submitted to student dashboard successfully!'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to submit reply to database:', err);
      setNotification({ type: 'error', message: 'Could not submit your reply. Please check your connection and try again.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Doubt Section Heading */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold font-poppins text-slate-900 dark:text-white tracking-tight">
          Have a Doubt? We've Got You!
        </h2>
        <p className="text-sm text-slate-505 dark:text-slate-400 mt-2 leading-relaxed">
          Submit your question and get help your way (Rs 50/ per ques)
        </p>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-200/50 dark:border-red-800/50'
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Submit Doubt Panel (Grid 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-205 dark:border-slate-800 shadow-sm text-left space-y-6">
          
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
            <MessageSquarePlus className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-bold font-poppins">Post a New Doubt</h3>
          </div>

          <form onSubmit={handleSubmitDoubt} className="space-y-4">
            
            {/* Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subject Select:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-semibold"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="Botany">Botany</option>
                <option value="Zoology">Zoology</option>
              </select>
            </div>

            {/* Doubt text query */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ask your doubt:</label>
              <textarea
                rows={4}
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="Type your question or concept roadblock clearly in Hindi or English... (e.g. why is EMF zero under steady direct currents?)"
                className="w-full px-3.5 py-3 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-205 border border-slate-220 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-400 leading-relaxed font-sans"
              />
            </div>

            {/* DRAG AND DROP FILE UPLOAD AREA */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upload Question Photo (Optional):</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center space-y-2 relative ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-750 hover:border-slate-300'
                }`}
              >
                <input
                  type="file"
                  id="doubt-file-upload"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {imagePreviewUrl ? (
                  <div className="space-y-3 w-full">
                    <img 
                      src={imagePreviewUrl} 
                      alt="Attachment Preview" 
                      referrerPolicy="no-referrer"
                      className="h-28 mx-auto object-contain rounded-xl border border-slate-100" 
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreviewUrl(null)}
                      className="text-[10px] text-red-500 font-bold hover:underline"
                    >
                      Remove Photo / Clear attachment
                    </button>
                  </div>
                ) : (
                  <label htmlFor="doubt-file-upload" className="cursor-pointer space-y-1">
                    <Image className="h-8 w-8 text-slate-400 mx-auto" />
                    <span className="text-xs font-bold text-blue-600 block hover:underline">Click to Upload photo</span>
                    <span className="text-[10px] text-slate-400 block font-poppins">or drag and drop photographic copy</span>
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!doubtText.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Send className="h-4 w-4" />
              <span>Submit Question to Experts</span>
            </button>

          </form>

        </div>

        {/* Right Side: Doubt feeds and replies board (Grid 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex items-center justify-between text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold font-poppins">Recent Doubts Log ({doubts.length})</h3>
            <span className="text-xs text-slate-400 font-mono">Expert Replies Real-Time</span>
          </div>

          <div className="space-y-6">
            {doubts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-205 dark:border-slate-800">
                <HelpCircle className="h-10 w-10 text-slate-350 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-705 dark:text-slate-300">No doubts posted yet</h4>
                <p className="text-xs text-slate-400">Be the first to ask a query on the forum!</p>
              </div>
            ) : (
              doubts.map((d) => (
                <div 
                  key={d.id} 
                  id={`doubt-card-${d.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs text-left"
                >
                  {/* Doubt Header: Student, time, subject */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-blue-105 text-blue-600 dark:text-blue-400 text-xs font-bold leading-none flex items-center justify-center border border-blue-50 bg-blue-100">
                        {d.studentName[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{d.studentName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{new Date(d.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                        {d.subject}
                      </span>
                      {d.status === 'Replied' ? (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-0.5 fill-current" />
                          <span>Replied</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center animate-pulse">
                          <Clock className="h-3 w-3 mr-0.5" />
                          <span>Awaiting Expert</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doubt Content */}
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-line">
                      {d.doubtText}
                    </p>

                    {d.imageUrl && (
                      <div className="rounded-xl overflow-hidden max-w-sm border border-slate-150">
                        <img 
                          src={d.imageUrl} 
                          alt="Student uploaded question document" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-contain max-h-48"
                        />
                      </div>
                    )}
                  </div>

                  {/* Reply container or Admin feedback area */}
                  {d.status === 'Replied' ? (
                    <div className="p-5 bg-emerald-500/[0.04] border-t border-emerald-500/10 text-left space-y-2">
                      <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-401">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-xs font-bold font-poppins">Study Yatra Expert Solution Response:</span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-emerald-500/15 p-4 rounded-2xl whitespace-pre-line font-sans">
                        {d.replyText}
                      </p>

                      {d.replyVideoUrl ? (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-xl space-y-2">
                          <div className="flex items-center space-x-1.5 text-red-600 dark:text-red-400">
                            <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-600"></span>
                            <span className="text-xs font-bold">Expert Doubt Solver Video Ready</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400-tight leading-normal font-sans">
                            Our primary teacher has recorded a personalized explanation video solving this roadblock query.
                          </p>
                          <a 
                            href={d.replyVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs transition-transform duration-100 hover:scale-[1.01] cursor-pointer"
                          >
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span>Watch Video Solver ↗</span>
                          </a>
                        </div>
                      ) : null}

                      {d.replyTimestamp && (
                        <span className="text-[9px] text-slate-400 block text-right font-mono">Solved on: {new Date(d.replyTimestamp).toLocaleString()}</span>
                      )}
                    </div>
                  ) : (
                    // IF student is toggled in user.role === 'Admin', render reply box immediately! Extremely cool RBAC simulation
                    user.role === 'Admin' ? (
                      <div className="p-5 bg-purple-500/[0.04] border-t border-purple-500/10 text-left space-y-3">
                        <div className="flex items-center space-x-1.5 text-purple-650 font-bold text-xs font-poppins">
                          <ShieldAlert className="h-4 w-4 text-purple-500" />
                          <span>Admin perspective: Answer student query:</span>
                        </div>
                        
                        <textarea
                          rows={2}
                          placeholder="Teacher/Expert answers here..."
                          value={replyInput[d.id] || ''}
                          onChange={(e) => setReplyInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-700 rounded-xl focus:outline-none"
                        />

                        <div>
                          <label className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-1">Doubt Solver Video URL (Optional):</label>
                          <input
                            type="url"
                            value={replyVideoInput[d.id] || ''}
                            onChange={(e) => setReplyVideoInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                            placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border text-slate-800 border-slate-220 rounded-xl placeholder:text-slate-400 text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleAdminReply(d.id)}
                          className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg text-xs hover:bg-purple-750 font-poppins"
                        >
                          Submit Solution Reply & Video Solver
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-850/30 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-slate-400 text-xs">
                        <Clock className="h-4 w-4" />
                        <span>Teacher solution process coordinates active. You will be notified in 1-2 hours.</span>
                      </div>
                    )
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>


    </div>
  );
}

import re

path = "src/components/Mentorship.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

def apply(content, old, new, label):
    count = content.count(old)
    assert count == 1, f"{label}: expected exactly 1 match, found {count}"
    return content.replace(old, new)

# Edit 1: imports
old = """import { getStoredBookings, saveBooking, updateBookingStatus } from '../utils/storage';
import { """
new = """import { getStoredBookings, saveBooking, updateBookingStatus } from '../utils/storage';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';
import { """
content = apply(content, old, new, "Edit 1 (imports)")

# Edit 2: window.Razorpay type
old = """interface MentorshipProps {
  user: UserProfile;
}"""
new = """interface MentorshipProps {
  user: UserProfile;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}"""
content = apply(content, old, new, "Edit 2 (Razorpay type)")

# Edit 3: state
old = """  // Razorpay simulator overlay trigger
  const [showRazorpay, setShowRazorpay] = useState<boolean>(false);
  const [activeDraftBooking, setActiveDraftBooking] = useState<LectureBooking | null>(null);"""
new = """  const [isProcessing, setIsProcessing] = useState<boolean>(false);"""
content = apply(content, old, new, "Edit 3 (state)")

# Edit 4: handlers (the big one)
old = """  const handleBookingSubmit = (e: React.FormEvent) => {
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
      // Trigger Razorpay Simulator gate
      setActiveDraftBooking(draft);
      setShowRazorpay(true);
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

  // Simulate official payment authorization
  const handleSimulateRazorpaySuccess = () => {
    if (!activeDraftBooking) return;

    const paidBooking: LectureBooking = {
      ...activeDraftBooking,
      paid: true,
      status: 'Approved' // Pre-approved after real-time successful transaction
    };

    saveBooking(paidBooking);
    const updated = getStoredBookings();
    setBookings(updated);
    determineNextLectureType(updated);

    // Reset States
    setShowRazorpay(false);
    setActiveDraftBooking(null);
    setPreferredTime('');
    setContactNumber('');

    setNotification('Payment Authorised! Lecture ₹500 booked. OTP sent to registered number.');
    setTimeout(() => setNotification(null), 6000);
  };"""
new = """  const handleBookingSubmit = async (e: React.FormEvent) => {
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
  };"""
content = apply(content, old, new, "Edit 4 (handlers)")

# Edit 5: submit button
old = """            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{lectureType.includes('Free') ? 'Register Free Lecture Slot' : 'Proceed to Razorpay Checkout'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>"""
new = """            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-750 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{isProcessing ? 'Opening secure checkout...' : lectureType.includes('Free') ? 'Register Free Lecture Slot' : 'Proceed to Razorpay Checkout'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>"""
content = apply(content, old, new, "Edit 5 (submit button)")

# Edit 6: delete the fake modal entirely
old = """      {/* RAZORPAY SECURE PAYMENT SIMULATOR GATEWAY OVERLAY MODAL */}
      {showRazorpay && activeDraftBooking && (
        <div id="razorpay-interactive-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden text-left font-sans">
            
            {/* Razorpay Logo Title */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-850">
              <div className="flex items-center space-x-2">
                <div className="p-1 px-2.5 bg-blue-600 rounded text-xs font-black tracking-widest font-mono">
                  RAZORPAY
                </div>
                <span className="text-xs text-slate-400 font-semibold font-mono">Official Secure Gateway</span>
              </div>
              <button 
                onClick={() => { setShowRazorpay(false); setActiveDraftBooking(null); }}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                Cancel / Esc
              </button>
            </div>

            {/* Transaction details block */}
            <div className="p-6 space-y-6">
              
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-400 block font-mono">Study Yatra Mentorship Booking charges:</span>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white font-mono">₹500.00</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono block mx-auto w-max">
                  ORDER_ID: {activeDraftBooking.id.toUpperCase()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 max-h-48 overflow-y-auto text-xs space-y-2 text-slate-600 dark:text-slate-350 leading-relaxed">
                <div className="flex justify-between font-bold">
                  <span>Mentoring Subject:</span>
                  <span className="text-slate-900 dark:text-white">{activeDraftBooking.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span>Candidate:</span>
                  <span>{activeDraftBooking.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact schedule:</span>
                  <span>{activeDraftBooking.preferredTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Notifications SMS:</span>
                  <span>{activeDraftBooking.contactNumber}</span>
                </div>
              </div>

              {/* Secure Trust credentials */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 rounded-xl flex items-center space-x-2.5">
                <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  UPI/Debit dynamic credentials are encrypted using SHA-256 protocols. Your purchase supports premium quality student guidance.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  id="razorpay-pay-success"
                  onClick={handleSimulateRazorpaySuccess}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold font-poppins rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Simulate Payment Authorization Successful</span>
                </button>
                
                <p className="text-[9px] text-center text-slate-400">
                  By clicking accept, Razorpay mock ledger appends ₹500 transactions into the database logs.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}"""
new = """    </div>
  );
}"""
content = apply(content, old, new, "Edit 6 (delete fake modal)")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend patched successfully: fake Razorpay simulator replaced with real checkout flow in Mentorship.tsx")

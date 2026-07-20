import React, { useState, useEffect } from 'react';
import { 
Compass, 
FolderPlus, 
Trash2, 
Edit3, 
Play, 
BookOpen, 
Calendar, 
Clock, 
ChevronRight, 
Bookmark, 
X, 
ChevronLeft, 
Check, 
Loader2, 
AlertCircle,
Folder,
ArrowLeft,
CheckCircle2,
XCircle,
RotateCcw,
Sparkles
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { PitStop, Question, UserProfile } from '../types';
import { API_BASE_URL } from '../config';
interface PitStopsProps {
user: UserProfile;
activeStopoverId?: string;
onNavigateToQuestion?: (questionId: string, stopoverId: string) => void;
onSelectStopover?: (stopoverId: string | null) => void;
}
export default function PitStops({ 
user,
activeStopoverId,
onNavigateToQuestion,
onSelectStopover
}: PitStopsProps) {
const [pitStops, setPitStops] = useState<PitStop[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
// Active view state
const [activeStop, setActiveStop] = useState<PitStop | null>(null);
const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
// Creation State
const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
const [newTitle, setNewTitle] = useState<string>('');
const [newDescription, setNewDescription] = useState<string>('');
// Editing State
const [editingStop, setEditingStop] = useState<PitStop | null>(null);
const [editTitle, setEditTitle] = useState<string>('');
const [editDescription, setEditDescription] = useState<string>('');
// Deletion State
const [deletingStop, setDeletingStop] = useState<PitStop | null>(null);
const [confirmingDeleteQuestionId, setConfirmingDeleteQuestionId] = useState<number | null>(null);
// Active question Practice states
const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
const [submitted, setSubmitted] = useState<boolean>(false);
const [feedback, setFeedback] = useState<string>('');
useEffect(() => {
fetchPitStops();
  }, []);
// Sync activeStopoverId prop to activeStop state
useEffect(() => {
if (activeStopoverId && pitStops.length > 0) {
const targetStop = pitStops.find((s: PitStop) => String(s.id) === String(activeStopoverId));
if (targetStop) {
setActiveStop(targetStop);
if (targetStop.questions.length > 0 && !activeQuestion) {
setActiveQuestion(targetStop.questions[0]);
        }
      }
    } else if (!activeStopoverId) {
setActiveStop(null);
setActiveQuestion(null);
    }
  }, [activeStopoverId, pitStops]);
const fetchPitStops = async () => {
setLoading(true);
setError(null);
try {
const idToken = await getAuthToken();
const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (idToken) {
headers['Authorization'] = `Bearer ${idToken}`;
      }
const res = await fetch(`${API_BASE_URL}/api/pit-stops`, { headers });
if (res.ok) {
const data = await res.json();
const retrievedStops = data.pitStops || [];
setPitStops(retrievedStops);
// Auto-select stopover if the id is matching activeStopoverId on active list load
if (activeStopoverId) {
const targetStop = retrievedStops.find((s: PitStop) => String(s.id) === String(activeStopoverId));
if (targetStop) {
setActiveStop(targetStop);
if (targetStop.questions.length > 0 && !activeQuestion) {
setActiveQuestion(targetStop.questions[0]);
            }
          }
        } else if (activeStop) {
// If an activeStop is currently open, let's refresh its data is well!
const freshStop = retrievedStops.find((s: PitStop) => s.id === activeStop.id);
if (freshStop) {
setActiveStop(freshStop);
// Sync active question
if (activeQuestion) {
const freshQ = freshStop.questions.find((q: any) => q.questionId === activeQuestion.questionId);
if (freshQ) {
// Keep it
              } else {
setActiveQuestion(null);
              }
            }
          } else {
setActiveStop(null);
setActiveQuestion(null);
          }
        }
      } else {
const data = await res.json();
setError(data.error || 'Failed to fetch Pit Stops.');
      }
    } catch (err) {
console.error('Error fetching pit stops:', err);
setError('Connection failure. Could not fetch collections.');
    } finally {
setLoading(false);
    }
  };
const handleCreatePitStop = async (e: React.FormEvent) => {
e.preventDefault();
if (!newTitle.trim()) {
setError('Title cannot be empty.');
return;
    }
setLoading(true);
setError(null);
try {
const idToken = await getAuthToken();
const headers: Record<string, string> = { 
'Content-Type': 'application/json',
...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
      };
const res = await fetch(`${API_BASE_URL}/api/pit-stops`, {
method: 'POST',
headers,
body: JSON.stringify({
title: newTitle.trim(),
description: newDescription.trim()
        })
      });
const data = await res.json();
if (res.ok && data.success) {
setSuccess('Pit Stop collection created!');
setNewTitle('');
setNewDescription('');
setShowCreateForm(false);
await fetchPitStops();
setTimeout(() => setSuccess(null), 3000);
      } else {
setError(data.error || 'Failed to create collection.');
      }
    } catch (e) {
setError('Error communicating with server.');
    } finally {
setLoading(false);
    }
  };
const handleRenamePitStop = async (e: React.FormEvent) => {
e.preventDefault();
if (!editingStop || !editTitle.trim()) return;
setLoading(true);
setError(null);
try {
const idToken = await getAuthToken();
const headers: Record<string, string> = { 
'Content-Type': 'application/json',
...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
      };
const res = await fetch(`${API_BASE_URL}/api/pit-stops/${editingStop.id}`, {
method: 'PUT',
headers,
body: JSON.stringify({
title: editTitle.trim(),
description: editDescription.trim()
        })
      });
const data = await res.json();
if (res.ok && data.success) {
setSuccess('Collection details updated successfully!');
setEditingStop(null);
await fetchPitStops();
setTimeout(() => setSuccess(null), 3000);
      } else {
setError(data.error || 'Could not rename collection.');
      }
    } catch (e) {
setError('Connection failure.');
    } finally {
setLoading(false);
    }
  };
const handleDeletePitStop = async (id: number) => {
setLoading(true);
setError(null);
try {
const idToken = await getAuthToken();
const headers: Record<string, string> = { 
'Content-Type': 'application/json',
...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
      };
const res = await fetch(`${API_BASE_URL}/api/pit-stops/${id}`, {
method: 'DELETE',
headers
      });
if (res.ok) {
setSuccess('Stopover deleted successfully');
// Instantly filter out deleted stopover from state
setPitStops((prev) => prev.filter((stop) => stop.id !== id));
if (activeStop?.id === id) {
setActiveStop(null);
setActiveQuestion(null);
if (onSelectStopover) {
onSelectStopover(null);
          }
        }
await fetchPitStops();
setTimeout(() => setSuccess(null), 3050);
      } else {
        const data = await res.json();
        setError(data.error || `Delete failed (${res.status})`);
      }
    } catch (e: any) {
      setError(e.message || 'Unable to delete Stopover');
    } finally {
setLoading(false);
setDeletingStop(null);
    }
  };
const handleRemoveQuestion = async (stopId: number, questionId: number) => {
setLoading(true);
setError(null);
try {
const idToken = await getAuthToken();
const headers: Record<string, string> = { 
...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
      };
const res = await fetch(`${API_BASE_URL}/api/pit-stops/${stopId}/questions/${questionId}`, {
method: 'DELETE',
headers
      });
if (res.ok) {
// Optimistically update local activeStop questions list immediately
if (activeStop) {
const updatedQuestions = activeStop.questions.filter((q: any) => q.questionId !== questionId);
setActiveStop({
...activeStop,
questions: updatedQuestions,
questionCount: updatedQuestions.length
          });
// Sync the active question inside this stopover panel
if (activeQuestion?.questionId === questionId) {
if (updatedQuestions.length > 0) {
setActiveQuestion(updatedQuestions[0]);
// Reset interactive practice answers
setSelectedAnswer(null);
setSubmitted(false);
setFeedback('');
            } else {
setActiveQuestion(null);
            }
          }
        }
// Also update inside main pitStops collection array to keep gallery cards in sync
setPitStops((prevStops) =>
prevStops.map((stop) => {
if (stop.id === stopId) {
const updatedQuestions = stop.questions.filter((q: any) => q.questionId !== questionId);
return {
...stop,
questions: updatedQuestions,
questionCount: updatedQuestions.length
              };
            }
return stop;
          })
        );
setSuccess('Question removed from custom collection.');
await fetchPitStops();
setTimeout(() => setSuccess(null), 3000);
      } else {
setError('Failed to remove question.');
      }
    } catch (e) {
setError('Network communication failure.');
    } finally {
setLoading(false);
    }
  };
const handleOpenStop = (stop: PitStop) => {
setActiveStop(stop);
if (stop.questions.length > 0) {
handleSelectQuestion(stop.questions[0]);
    } else {
setActiveQuestion(null);
    }
if (onSelectStopover) {
onSelectStopover(String(stop.id));
    }
  };
const handleSelectQuestion = (q: any) => {
setActiveQuestion(q);
setSelectedAnswer(null);
setSubmitted(false);
setFeedback('');
  };
const handleCheckAnswer = () => {
if (!activeQuestion || !selectedAnswer) return;
const correctQuotes = [
"🎯 Bullseye! Concept is fully locked-in.",
"🔥 Incredible solve. Your revision pays off!",
"🚀 Outstanding checkpoint clear! Onward!",
"💪 Champion answer. High-weightage concept nailed!"
    ];
const incorrectQuotes = [
"💡 Valuable learning point! Let's check why.",
"📚 Galti se hi seekhte hain! Read the explanation below.",
"🔄 Don't worry. Keep refining! Concept cleared soon.",
"📖 Is topic ko ek quick revision do."
    ];
const isCorrect = selectedAnswer === activeQuestion.correctAnswer;
const rndQuote = isCorrect 
? correctQuotes[Math.floor(Math.random() * correctQuotes.length)]
: incorrectQuotes[Math.floor(Math.random() * incorrectQuotes.length)];
setFeedback(rndQuote);
setSubmitted(true);
  };
// Format dates
const formatDateString = (dt: string) => {
try {
const parsed = new Date(dt);
if (isNaN(parsed.getTime())) return 'Recently updated';
return parsed.toLocaleDateString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric'
      });
    } catch {
return 'Recently updated';
    }
  };
return (
<div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans transition-colors duration-300">
{/* Travel themed Banner */}
<div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-805 to-indigo-900 text-white relative overflow-hidden shadow-xl">
<div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
<Compass className="w-48 h-48 animate-spin" style={{ animationDuration: '40s' }} />
</div>
<div className="relative z-10 space-y-2.5 max-w-xl text-left">
<div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold font-mono tracking-wider text-blue-200">
<Compass className="h-3.5 w-3.5" />
<span>STUDY YATRA CHECKPOINTS</span>
</div>
<h1 className="text-3xl sm:text-4xl font-extrabold font-poppins tracking-tight">
            🧭 Pit Stops
</h1>
<p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-sans">
            Your personal waypoints during the study expedition. Store critical PYQs and tough conceptual questions in custom revision collections to fuel your focus before exams.
</p>
</div>
</div>
{success && (
<div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 rounded-r-2xl text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-fade-in text-left">
<CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
<span>{success}</span>
</div>
      )}
{error && (
<div className="p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded-r-2xl text-red-800 dark:text-red-400 text-xs font-semibold flex items-center space-x-2 animate-fade-in text-left">
<AlertCircle className="h-4.5 w-4.5 shrink-0" />
<span>{error}</span>
</div>
      )}
{/* VIEW: MAIN PORT / ACTIVE PIT STOP WORKSPACE VIEW */}
{activeStop ? (
<div className="space-y-6 animate-fade-in">
{/* Back Action Bar */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
<button
onClick={() => {
setActiveStop(null);
setActiveQuestion(null);
fetchPitStops();
if (onSelectStopover) {
onSelectStopover(null);
                }
              }}
className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition duration-150 ease-in-out cursor-pointer group"
>
<ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
<span className="hover:underline">My Checkpoints Station</span>
</button>
<div className="text-left sm:text-right flex flex-col sm:items-end">
<div className="flex items-center gap-2 justify-start sm:justify-end">
<h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white tracking-tight">
                  Collection: {activeStop.title}
</h2>
<button
type="button"
title="Delete Stopover"
onClick={() => setDeletingStop(activeStop)}
className="p-1.5 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
>
<Trash2 className="h-4 w-4" />
</button>
</div>
<p className="text-xs text-slate-400 mt-0.5">
{activeStop.questionCount} solved bookmark{activeStop.questionCount === 1 ? '' : 's'} • Saved in personal log
</p>
</div>
</div>
{activeStop.questions.length === 0 ? (
<div className="p-16 text-center max-w-sm mx-auto space-y-4">
<Folder className="h-12 w-12 text-slate-300 mx-auto" />
<div className="space-y-1">
<h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">This Pit Stop is Empty</h4>
<p className="text-xs text-slate-400 leading-relaxed">
                  Start practicing PYQs, and click the <strong>🧭 Save to Pit Stop</strong> button on any question to collect it.
</p>
</div>
<button
onClick={() => {
setActiveStop(null);
                }}
className="px-4 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-semibold cursor-pointer"
>
                Assemble checkports
</button>
</div>
          ) : (
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
{/* Left Column: Vertical Questions listing */}
<div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-left max-h-[600px] overflow-y-auto">
<div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-start gap-2">
<div>
<h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Checkpoints List
</h3>
<span className="text-[10px] text-slate-400">Click a question to open in Practice Mode</span>
</div>
<button
type="button"
title="Delete entire collection"
onClick={(e) => {
e.stopPropagation();
setDeletingStop(activeStop);
                    }}
className="p-1.5 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-950/45 rounded-lg text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all font-bold text-[10px] inline-flex items-center space-x-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
>
<Trash2 className="h-3.5 w-3.5 shrink-0" />
<span>Delete Stopover</span>
</button>
</div>
<div className="space-y-2">
{activeStop.questions.map((q, idx) => {
const isSelected = activeQuestion?.questionId === q.questionId;
return (
<div 
key={q.id}
className={`group relative p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
isSelected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40'
}`}
onClick={() => handleSelectQuestion(q)}
>
<div className="flex items-start space-x-2.5 max-w-[85%]">
<span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
}`}>
                            Q{idx + 1}
</span>
<div className="space-y-0.5">
<p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-normal">
{q.questionText}
</p>
<div className="flex items-center space-x-1 flex-wrap text-[9px] font-semibold text-slate-400">
<span>{q.subject}</span>
<span>•</span>
<span>Year {q.year}</span>
{onNavigateToQuestion && (
<>
<span>•</span>
<button
type="button"
onClick={(e) => {
e.stopPropagation();
onNavigateToQuestion(String(q.questionId), String(activeStop.id));
                                    }}
className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
>
                                    Open Question 🚀
</button>
</>
                              )}
</div>
</div>
</div>
{confirmingDeleteQuestionId === q.questionId ? (
<div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
<button
type="button"
onClick={(e) => {
e.stopPropagation();
setConfirmingDeleteQuestionId(null);
                              }}
className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition whitespace-nowrap cursor-pointer"
>
                              Cancel
</button>
<button
type="button"
onClick={(e) => {
e.stopPropagation();
handleRemoveQuestion(activeStop.id, q.questionId);
setConfirmingDeleteQuestionId(null);
                              }}
className="px-2.5 py-1 text-[10px] font-black bg-red-650 hover:bg-red-750 text-white rounded transition whitespace-nowrap cursor-pointer"
>
                              Delete
</button>
</div>
                        ) : (
<button
type="button"
title="Remove bookmark"
onClick={(e) => {
e.stopPropagation();
setConfirmingDeleteQuestionId(q.questionId);
                            }}
className="text-slate-400 hover:text-red-650 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/30 transition-all opacity-85 group-hover:opacity-100 pointer-events-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20 shrink-0"
>
<Trash2 className="h-4 w-4" />
</button>
                        )}
</div>
                    );
                  })}
</div>
</div>
{/* Right Column: Integrated full-featured Active Practice workspace */}
<div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 text-left">
{activeQuestion ? (
<>
{/* Headers & Difficulty badges */}
<div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
<div className="flex items-center space-x-2 text-xs font-mono font-medium text-slate-400">
<span>Checkport ID: #{activeQuestion.questionId}</span>
<span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
<span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
activeQuestion.difficulty === 'Easy' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                            : activeQuestion.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-805 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
}`}>
{activeQuestion.difficulty || 'Medium'} Level
</span>
</div>
<div className="flex items-center space-x-1 text-[10px] font-extrabold font-mono text-white">
<span className="bg-blue-600 px-2 py-0.5 rounded uppercase">
{activeQuestion.subject}
</span>
<span className="bg-slate-905 bg-slate-800 px-2 py-0.5 rounded">
                          PYQ {activeQuestion.year}
</span>
</div>
</div>
{/* Standalone immersive Practice Mode launcher banner */}
{onNavigateToQuestion && (
<div className="flex items-center justify-between p-3.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-950 rounded-2xl">
<div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
<Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
<span className="text-xs font-medium">Want an immersive, focused practicing space?</span>
</div>
<button
type="button"
onClick={() => onNavigateToQuestion(String(activeQuestion.questionId), String(activeStop.id))}
className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition duration-100 uppercase tracking-wider font-poppins"
>
                          Practice Fullscreen 🚀
</button>
</div>
                    )}
<div className="space-y-4">
<p className="text-base sm:text-lg font-medium text-slate-850 dark:text-slate-100 leading-relaxed leading-normal">
{activeQuestion.questionText}
</p>
</div>
{/* Interactive Multiple Choice options */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
{(['A', 'B', 'C', 'D'] as const).map((key) => {
const isSelected = selectedAnswer === key;
const optionText = activeQuestion[`option${key}`] || activeQuestion[`option_${key.toLowerCase()}`] || '';
let cardStyle = 'border-slate-200 dark:border-slate-700 hover:border-slate-350 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
if (isSelected) {
cardStyle = 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20';
                        }
if (submitted) {
const isCorrect = activeQuestion.correctAnswer === key;
if (isCorrect) {
cardStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-850 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold';
                          } else if (isSelected) {
cardStyle = 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-800 dark:text-red-400 ring-2 ring-red-500/20';
                          } else {
cardStyle = 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 opacity-60';
                          }
                        }
return (
<button
key={key}
onClick={() => !submitted && setSelectedAnswer(key)}
disabled={submitted}
className={`p-4 rounded-2xl border-2 transition-all text-left flex items-start space-x-3 cursor-pointer focus:outline-none ${cardStyle}`}
>
<span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
isSelected 
                                ? 'bg-blue-600 text-white' 
                                : submitted && activeQuestion.correctAnswer === key
                                ? 'bg-emerald-500 text-white'
                                : submitted && isSelected
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
}`}>
{key}
</span>
<span className="text-sm leading-snug">{optionText}</span>
</button>
                        );
                      })}
</div>
{/* Action button */}
<div className="flex justify-end pt-3">
{!submitted ? (
<button
onClick={handleCheckAnswer}
disabled={!selectedAnswer}
className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
>
<Play className="h-3 h-3 fill-current" />
<span>Submit & Check Checkpoint</span>
</button>
                      ) : (
<button
onClick={() => {
setSelectedAnswer(null);
setSubmitted(false);
setFeedback('');
                          }}
className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
>
<RotateCcw className="h-3.5 w-3.5" />
<span>Retry to refresh</span>
</button>
                      )}
</div>
{/* Feedback and Solution Explanations */}
{submitted && (
<div className="p-5 bg-slate-50/80 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3.5 animate-slide-up text-left">
<div className="flex items-center space-x-2">
{selectedAnswer === activeQuestion.correctAnswer ? (
<CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
<XCircle className="h-5 w-5 text-red-500" />
                          )}
<span className="text-xs sm:text-sm font-extrabold font-poppins text-slate-805 dark:text-slate-200">
{feedback}
</span>
</div>
<div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-3 space-y-1">
<span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Solution Explanation</span>
<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans whitespace-pre-line">
{activeQuestion.explanation || 'No step-by-step solution is logged for this question yet. Try evaluating thermal boundary limit values.'}
</p>
</div>
</div>
                    )}
</>
                ) : (
<div className="py-12 text-center text-slate-400">
<Compass className="h-8 w-8 animate-spin text-slate-300 mx-auto mb-2" />
<span>Select a question from left checkpoints sidebar to begin solving.</span>
</div>
                )}
</div>
</div>
          )}
</div>
      ) : (
/* VIEW: GENERAL COLLECTIONS GALLERY CARDS */
<div className="space-y-6">
<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
<div className="text-left">
<h2 className="text-xl font-extrabold font-poppins text-slate-900 dark:text-white tracking-tight">
                My Checkpoints Station
</h2>
<p className="text-xs text-slate-400 mt-0.5">
                Manage your saved bookmarked question portfolios.
</p>
</div>
<button
id="sum-create-stop"
onClick={() => {
setError(null);
setShowCreateForm(!showCreateForm);
              }}
className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-poppins flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
>
<FolderPlus className="h-4 w-4" />
<span>Create New Checked Stop</span>
</button>
</div>
{/* Form Create Pit Stop */}
{showCreateForm && (
<form 
onSubmit={handleCreatePitStop}
className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-left max-w-lg space-y-4 animate-scale-up"
>
<div className="flex justify-between items-center sm:pb-2 border-b border-slate-100 dark:border-slate-800">
<h4 className="text-sm font-black font-poppins text-slate-800 dark:text-white uppercase tracking-wider">
                  Create custom Pit Stop container
</h4>
<button
type="button"
onClick={() => setShowCreateForm(false)}
className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
>
<X className="h-4.5 w-4.5" />
</button>
</div>
<div className="space-y-3">
<div className="space-y-1">
<label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Collection Title</label>
<input
type="text"
required
placeholder="e.g. Weak Electrostatics, Revision..."
value={newTitle}
onChange={(e) => setNewTitle(e.target.value)}
maxLength={50}
className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-805 dark:text-slate-200 focus:outline-none"
/>
</div>
<div className="space-y-1">
<label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Optional Description</label>
<textarea
placeholder="Provide description details for revision timeline..."
value={newDescription}
onChange={(e) => setNewDescription(e.target.value)}
maxLength={200}
rows={2}
className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-805 dark:text-slate-200 focus:outline-none resize-none"
/>
</div>
</div>
<div className="flex justify-end space-x-2 pt-2">
<button
type="button"
onClick={() => setShowCreateForm(false)}
className="px-4 py-2 border border-slate-205 dark:border-slate-800 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
>
                  Cancel
</button>
<button
type="submit"
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
>
                  Create Collection
</button>
</div>
</form>
          )}
{/* Form Rename Pit Stop */}
{editingStop && (
<form 
onSubmit={handleRenamePitStop}
className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-left max-w-lg space-y-4 animate-scale-up"
>
<div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
<h4 className="text-sm font-black font-poppins text-slate-805 dark:text-white uppercase tracking-wider">
                  Update Pit Stop details
</h4>
<button
type="button"
onClick={() => setEditingStop(null)}
className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
>
<X className="h-4.5 w-4.5" />
</button>
</div>
<div className="space-y-3">
<div className="space-y-1">
<label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-poppins">Collection Title</label>
<input
type="text"
required
value={editTitle}
onChange={(e) => setEditTitle(e.target.value)}
maxLength={50}
className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-205 focus:outline-none"
/>
</div>
<div className="space-y-1">
<label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Description</label>
<textarea
value={editDescription}
onChange={(e) => setEditDescription(e.target.value)}
maxLength={200}
rows={2}
className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-205 focus:outline-none resize-none"
/>
</div>
</div>
<div className="flex justify-end space-x-2 pt-2">
<button
type="button"
onClick={() => setEditingStop(null)}
className="px-4 py-2 border border-slate-205 dark:border-slate-800 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
>
                  Cancel
</button>
<button
type="submit"
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
>
                  Save Changes
</button>
</div>
</form>
          )}
{loading && pitStops.length === 0 ? (
<div className="py-16 text-center text-slate-400">
<Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
<span>Inspecting checkpoint stations...</span>
</div>
          ) : pitStops.length === 0 ? (
<div className="p-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center max-w-sm mx-auto space-y-4">
<Compass className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto animate-spin" style={{ animationDuration: '10s' }} />
<div className="space-y-1">
<h4 className="text-sm font-bold text-slate-705 dark:text-slate-300">No Checkpoints Created Yet</h4>
<p className="text-xs text-slate-420 leading-relaxed">
                  Start mapping difficult questions into custom check-ports. Create your very first Pit Stop container above to begin.
</p>
</div>
</div>
          ) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
{pitStops.map((stop) => (
<div 
key={stop.id}
className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md dark:shadow-premium-dark/40 transition-all flex flex-col justify-between space-y-5 text-left relative overflow-hidden"
>
{/* Card travel highlights decoration */}
<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />
<div className="space-y-3">
<div className="flex items-start justify-between">
<div className="p-2.5 bg-blue-50 dark:bg-slate-800 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-slate-700/50">
<Bookmark className="h-5 w-5 fill-current" />
</div>
<div className="flex items-center space-x-1">
<button
title="Rename Collection"
onClick={() => {
setEditingStop(stop);
setEditTitle(stop.title);
setEditDescription(stop.description || '');
setError(null);
                          }}
className="p-1.5 hover:bg-slate-105 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
>
<Edit3 className="h-4 w-4" />
</button>
<button
title="Delete Collection"
onClick={() => setDeletingStop(stop)}
className="p-1.5 hover:bg-slate-105 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
>
<Trash2 className="h-4 w-4" />
</button>
</div>
</div>
<div className="space-y-1 block">
<h3 className="text-base font-black font-poppins text-slate-90s text-slate-900 dark:text-white line-clamp-1">
{stop.title}
</h3>
<p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
{stop.description || 'Custom revision portfolio logged.'}
</p>
</div>
</div>
<div className="border-t border-slate-100 dark:border-slate-850/60 pt-4 flex items-center justify-between text-xs">
<div className="space-y-0.5">
<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Bookmarks</span>
<strong className="text-slate-800 dark:text-slate-200 font-mono font-black">{stop.questionCount} Questions</strong>
</div>
<button
onClick={() => handleOpenStop(stop)}
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-poppins inline-flex items-center space-x-1 cursor-pointer shadow-sm group-hover:scale-[1.03] transition-all"
>
<span>Open Station</span>
<ChevronRight className="h-3.5 w-3.5" />
</button>
</div>
</div>
              ))}
</div>
          )}
</div>
      )}
{/* Delete Pit Stop Confirmation Dialog */}
{deletingStop && (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-xs animate-fade-in">
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl text-left max-w-md w-full space-y-4 animate-scale-up">
<div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
<AlertCircle className="h-6 w-6 shrink-0" />
<h4 className="text-base font-black font-poppins uppercase tracking-wider">
                Delete Stopover?
</h4>
</div>
<div className="space-y-2 text-slate-600 dark:text-slate-300">
<p className="text-sm font-medium leading-relaxed font-sans">
                Are you sure you want to delete "<strong className="text-slate-900 dark:text-white">{deletingStop.title}</strong>" and all of its bookmarked questions?
</p>
<p className="text-xs text-slate-400 font-medium italic">
                This action cannot be undone.
</p>
</div>
<div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-850/65 animate-fade-in">
<button
type="button"
onClick={() => setDeletingStop(null)}
className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
>
                Cancel
</button>
<button
type="button"
onClick={() => handleDeletePitStop(deletingStop.id)}
className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition select-none"
>
                Delete
</button>
</div>
</div>
</div>
      )}
</div>
  );
}
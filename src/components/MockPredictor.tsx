import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Award, 
  AlertCircle, 
  BookOpen, 
  Workflow, 
  Activity
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { getAuthToken } from '../utils/firebaseAuth';
import { API_BASE_URL } from '../config';

interface PredictionItem {
  id: number;
  userId: string;
  examType: string;
  physicsMarks: number;
  chemistryMarks: number;
  mathsOrBiologyMarks: number;
  totalMarks: number;
  predictedPercentile: string;
  predictedRank: string;
  createdAt: string;
}

interface MockPredictorProps {
  user: UserProfile | null;
}

export default function MockPredictor({ user }: MockPredictorProps) {
  const initialExam = user?.targetExam === 'NEET' ? 'NEET' : 'JEE Main';
  
  const [examType, setExamType] = useState<'JEE Main' | 'NEET'>(initialExam);
  const [physicsMarks, setPhysicsMarks] = useState<string>('');
  const [chemistryMarks, setChemistryMarks] = useState<string>('');
  const [mathsOrBiologyMarks, setMathsOrBiologyMarks] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [currentPrediction, setCurrentPrediction] = useState<PredictionItem | null>(null);
  const [historyList, setHistoryList] = useState<PredictionItem[]>([]);
  const [isLedgerOpen, setIsLedgerOpen] = useState<boolean>(false);

  const handleClearHistory = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/predictions`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          setHistoryList([]);
          setCurrentPrediction(null);
        }
      } else {
        localStorage.removeItem(`mock_history_${examType}`);
        setHistoryList([]);
        setCurrentPrediction(null);
      }
    } catch (err) {
      console.error("Failed to clear prediction history:", err);
    }
  };

  // Read prediction history
  const fetchHistory = async () => {
    try {
      const token = await getAuthToken();
      const localHistoryData = localStorage.getItem(`mock_history_${examType}`);
      const fallbackList = localHistoryData ? JSON.parse(localHistoryData) : [];

      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/predictions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setHistoryList(data.history || []);
            return;
          }
        }
      }
      
      // Guest or Offline fallback to localStorage
      setHistoryList(fallbackList);
    } catch (err) {
      console.error("Failed to load historical mock predictions:", err);
      // fallback to localStorage
      const localHistoryData = localStorage.getItem(`mock_history_${examType}`);
      setHistoryList(localHistoryData ? JSON.parse(localHistoryData) : []);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Reset active fields when switching exams
    setPhysicsMarks('');
    setChemistryMarks('');
    setMathsOrBiologyMarks('');
    setCurrentPrediction(null);
    setError('');
  }, [examType]);

  // Max cap parameters
  const getMaxMarks = (subject: string): number => {
    if (examType === 'JEE Main') return 100;
    if (subject === 'Physics' || subject === 'Chemistry') return 180;
    return 360; // Biology for NEET
  };

  const getSubjectLabel = () => {
    return examType === 'JEE Main' ? 'Mathematics' : 'Biology';
  };

  const pNum = Number(physicsMarks) || 0;
  const cNum = Number(chemistryMarks) || 0;
  const mbNum = Number(mathsOrBiologyMarks) || 0;
  const totalMarks = pNum + cNum + mbNum;
  const maxExamTotal = examType === 'JEE Main' ? 300 : 720;

  // Local calculations for offline/guest mode
  const localJEEPrediction = (marks: number) => {
    const m = Math.max(0, Math.min(300, marks));
    let percentile = 0;
    if (m >= 280) {
      percentile = 99.95 + ((m - 280) / 20) * 0.05;
    } else if (m >= 250) {
      percentile = 99.80 + ((m - 250) / 30) * 0.15;
    } else if (m >= 220) {
      percentile = 99.50 + ((m - 220) / 30) * 0.30;
    } else if (m >= 180) {
      percentile = 98.70 + ((m - 180) / 40) * 0.80;
    } else if (m >= 150) {
      percentile = 97.20 + ((m - 150) / 30) * 1.50;
    } else if (m >= 120) {
      percentile = 94.00 + ((m - 120) / 30) * 3.20;
    } else if (m >= 90) {
      percentile = 88.00 + ((m - 90) / 30) * 6.00;
    } else if (m >= 60) {
      percentile = 75.00 + ((m - 60) / 30) * 13.00;
    } else if (m >= 30) {
      percentile = 50.00 + ((m - 30) / 30) * 25.00;
    } else {
      percentile = (m / 30) * 50.00;
    }
    percentile = Math.max(0.01, Math.min(100.00, percentile));
    const exactAIR = (100 - percentile) / 100 * 1400000;
    let rankMin = Math.round(exactAIR * 0.9);
    let rankMax = Math.round(exactAIR * 1.1);
    if (rankMin < 1) rankMin = 1;
    if (rankMax < 5) rankMax = 5;
    if (percentile > 99.99) { rankMin = 1; rankMax = 15; }
    return { percentile: parseFloat(percentile.toFixed(4)), rankMin, rankMax };
  };

  const localNEETPrediction = (marks: number) => {
    const m = Math.max(0, Math.min(720, marks));
    let percentile = 0;
    if (m >= 700) {
      percentile = 99.98 + ((m - 700) / 20) * 0.02;
    } else if (m >= 680) {
      percentile = 99.93 + ((m - 680) / 20) * 0.05;
    } else if (m >= 650) {
      percentile = 99.78 + ((m - 650) / 30) * 0.15;
    } else if (m >= 600) {
      percentile = 98.60 + ((m - 600) / 50) * 1.18;
    } else if (m >= 550) {
      percentile = 96.50 + ((m - 550) / 50) * 2.10;
    } else if (m >= 500) {
      percentile = 92.50 + ((m - 500) / 50) * 4.00;
    } else if (m >= 400) {
      percentile = 78.00 + ((m - 400) / 100) * 14.50;
    } else if (m >= 300) {
      percentile = 58.50 + ((m - 300) / 100) * 19.50;
    } else {
      percentile = (m / 300) * 58.50;
    }
    percentile = Math.max(0.01, Math.min(100.00, percentile));
    const exactAIR = (100 - percentile) / 100 * 2400000;
    let rankMin = Math.round(exactAIR * 0.92);
    let rankMax = Math.round(exactAIR * 1.08);
    if (rankMin < 1) rankMin = 1;
    if (rankMax < 5) rankMax = 5;
    if (percentile > 99.995) { rankMin = 1; rankMax = 20; }
    return { percentile: parseFloat(percentile.toFixed(4)), rankMin, rankMax };
  };

  const handlePredictRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Core validations
    const maxP = getMaxMarks('Physics');
    const maxC = getMaxMarks('Chemistry');
    const maxMB = getMaxMarks('MathsOrBiology');

    if (pNum < 0 || pNum > maxP) {
      setError(`Physics marks must be between 0 and ${maxP}`);
      return;
    }
    if (cNum < 0 || cNum > maxC) {
      setError(`Chemistry marks must be between 0 and ${maxC}`);
      return;
    }
    if (mbNum < 0 || mbNum > maxMB) {
      setError(`${getSubjectLabel()} marks must be between 0 and ${maxMB}`);
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      
      if (token) {
        // Authenticated Request to server PostgreSQL API
        const res = await fetch(`${API_BASE_URL}/api/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            examType,
            physicsMarks: pNum,
            chemistryMarks: cNum,
            mathsOrBiologyMarks: mbNum
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setCurrentPrediction(data.prediction);
            fetchHistory();
            setLoading(false);
            return;
          }
        }
      }

      // Guest / Local Fallback Mode
      const stats = examType === 'JEE Main' ? localJEEPrediction(totalMarks) : localNEETPrediction(totalMarks);
      const generatedItem: PredictionItem = {
        id: Date.now(),
        userId: 'guest',
        examType,
        physicsMarks: pNum,
        chemistryMarks: cNum,
        mathsOrBiologyMarks: mbNum,
        totalMarks,
        predictedPercentile: stats.percentile.toString(),
        predictedRank: `${stats.rankMin}-${stats.rankMax}`,
        createdAt: new Date().toISOString()
      };

      setCurrentPrediction(generatedItem);
      
      // update local storage
      const localHistoryData = localStorage.getItem(`mock_history_${examType}`);
      const fallbackList = localHistoryData ? JSON.parse(localHistoryData) : [];
      let updatedList;
      if (fallbackList.length >= 5) {
        updatedList = [generatedItem];
      } else {
        updatedList = [generatedItem, ...fallbackList];
      }
      localStorage.setItem(`mock_history_${examType}`, JSON.stringify(updatedList));
      setHistoryList(updatedList);
      
    } catch (err: any) {
      console.error(err);
      setError('System occurred a connection error. Fallback calculations engaged.');
    } finally {
      setLoading(false);
    }
  };

  const getRankTierText = (percentile: number) => {
    if (percentile >= 99) return { title: 'Premier Tier (Highly Elite)', desc: 'Assured seat in top NITs, IIITs or Govt Medical Colleges!' };
    if (percentile >= 95) return { title: 'Meritorious Tier (Competitive)', desc: 'Strong prospects for premium courses and colleges.' };
    if (percentile >= 85) return { title: 'Budding Tier (Qualifying)', desc: 'Passing boundary secured. Boost weak concepts to advance ranks.' };
    return { title: 'Focus Required', desc: 'Accelerate syllabus completion and revise mock patterns.' };
  };

  return (
    <div id="mock-test-rank-predictor-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-xl overflow-hidden">
        
        {/* Banner/Header Block */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 px-6 py-8 text-center sm:text-left sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
              <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/15 flex items-center gap-1">
                <Workflow className="h-3 w-3 animate-spin text-indigo-200" />
                Drizzle PostgreSQL Powered
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-poppins flex items-center justify-center sm:justify-start gap-2">
              <span>🎯</span> Study Yatra Mock Test Rank Predictor
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-normal font-sans">
              Evaluate mock performance results, map marks against highly audited national percentile & AIR datasets, and build custom IIT-JEE and NEET roadmap goals.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-10">

          {/* Selector Tabs for JEE vs NEET */}
          <div className="flex justify-center border-b border-slate-100 dark:border-slate-900 pb-5">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-2 w-full max-w-md">
              <button
                type="button"
                onClick={() => setExamType('JEE Main')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  examType === 'JEE Main'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Target className="h-4 w-4" />
                JEE Main
              </button>
              <button
                type="button"
                onClick={() => setExamType('NEET')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  examType === 'NEET'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Award className="h-4 w-4" />
                NEET Entrance
              </button>
            </div>
          </div>

          {/* Form and Gauge Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Form Column (5 blocks) */}
            <div className="lg:col-span-5 bg-slate-50/55 dark:bg-slate-900/35 p-6 rounded-3xl border border-slate-100 dark:border-slate-900 space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight flex items-center gap-2 uppercase font-poppins">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Score Entry Desk
                </h4>
                <span className="text-xxs px-2.5 py-1 bg-indigo-55 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-mono font-bold">
                  Max: {maxExamTotal} Marks
                </span>
              </div>

              {error && (
                <div id="predictor-error" className="p-3.5 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2.5 border border-rose-100 dark:border-rose-950">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePredictRank} className="space-y-4">
                
                {/* Physics Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>⚡ Physics Marks</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xxxs">Max: {getMaxMarks('Physics')}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={getMaxMarks('Physics')}
                    required
                    placeholder={`e.g. ${Math.min(75, getMaxMarks('Physics'))}`}
                    value={physicsMarks}
                    onChange={(e) => setPhysicsMarks(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono transition-all"
                  />
                </div>

                {/* Chemistry Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>🧪 Chemistry Marks</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xxxs">Max: {getMaxMarks('Chemistry')}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={getMaxMarks('Chemistry')}
                    required
                    placeholder="e.g. 68"
                    value={chemistryMarks}
                    onChange={(e) => setChemistryMarks(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono transition-all"
                  />
                </div>

                {/* Maths or Biology Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>📖 {getSubjectLabel()} Marks</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xxxs">Max: {getMaxMarks('MathsOrBiology')}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={getMaxMarks('MathsOrBiology')}
                    required
                    placeholder={examType === 'JEE Main' ? 'e.g. 80' : 'e.g. 310'}
                    value={mathsOrBiologyMarks}
                    onChange={(e) => setMathsOrBiologyMarks(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono transition-all"
                  />
                </div>

                {/* Auto Calculated Total Display Block */}
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Total Calculated Score</span>
                    <span className="text-xl font-black font-mono text-slate-800 dark:text-white">
                      {totalMarks} <span className="text-xs font-medium text-slate-400">/ {maxExamTotal}</span>
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-100 dark:bg-slate-900"></div>
                  <div className="text-right">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider mr-1">Aggregate Efficiency</span>
                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {Math.round((totalMarks / maxExamTotal) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Disclaimer */}
                <p id="predictor-disclaimer-text" className="text-[10px] text-slate-400/90 leading-relaxed font-normal bg-slate-100/40 dark:bg-slate-900/10 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-850">
                  <span className="font-extrabold text-rose-500 dark:text-rose-450 uppercase tracking-wider block text-[8px] mb-0.5">⚠️ Estimation Disclaimer:</span>
                  Predictions are estimates based on historical trends and are not official ranks. Act solely for diagnostic roadmap purposes.
                </p>

                {/* Submit Trigger */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Structuring Audits...
                    </>
                  ) : (
                    <>
                      <Workflow className="h-4 w-4 shrink-0" />
                      Calculate & Predict My Rank RANGE
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results Visualization Column (7 blocks) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 dark:bg-slate-900/15 p-6 rounded-3xl min-h-[420px] flex flex-col justify-between gap-6">
              {currentPrediction ? (
                <div className="space-y-6 animate-fade-in flex-grow">
                  
                  {/* Result Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
                    <div>
                      <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {currentPrediction.examType} Outcome
                      </span>
                      <h4 className="text-xl font-bold text-slate-800 dark:text-white font-poppins mt-1">
                        Predictive Analysis Card
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Generated: {new Date(currentPrediction.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>

                  {/* Main Metric Visualization (Percentile and AIR block) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Animated Progress Gauge */}
                    <div className="bg-slate-50/40 dark:bg-slate-900/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block mb-3 font-mono">Estimated Percentile</span>
                      
                      <div className="relative h-32 w-32 flex items-center justify-center">
                        {/* Circle Track */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            className="stroke-slate-200 dark:stroke-slate-800 fill-transparent"
                            strokeWidth="8"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            className="stroke-indigo-600 fill-transparent transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={339.3}
                            strokeDashoffset={339.3 - (339.3 * parseFloat(currentPrediction.predictedPercentile)) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        
                        <div className="text-center space-y-0.5 z-10">
                          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                            {currentPrediction.predictedPercentile}%
                          </span>
                          <span className="text-[9px] text-indigo-700 dark:text-indigo-400 block font-semibold">National Tile</span>
                        </div>
                      </div>
                    </div>

                    {/* AIR Range Box */}
                    <div className="bg-slate-50/40 dark:bg-slate-900/10 p-5 rounded-3xl flex flex-col justify-center text-center border border-slate-100 dark:border-slate-900 gap-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block font-mono">Estimated AIR range</span>
                      
                      <div className="space-y-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tighter block">
                          AIR {currentPrediction.predictedRank}
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-350 leading-relaxed font-sans mt-2">
                          Based on standard aggregate competing volumes of {examType === 'JEE Main' ? '1.4M' : '2.4M'} total applicants.
                        </p>
                      </div>

                      <div className="bg-blue-100/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-blue-200/20 dark:border-blue-900/20">
                        {getRankTierText(parseFloat(currentPrediction.predictedPercentile)).title}
                      </div>
                    </div>

                  </div>

                  {/* Rank Meter (Visual scale) */}
                  <div className="space-y-2 bg-slate-50/40 dark:bg-slate-900/10 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-900">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 font-mono">
                      <span>Low Competitive (AIR 500k+)</span>
                      <span>Targeting Tier (AIR 50k)</span>
                      <span>Elite Tier (AIR &lt; 5k)</span>
                    </div>

                    <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                      {/* ROSE ZONE */}
                      <div className="h-full w-[60%] bg-rose-500"></div>
                      {/* AMBER ZONE */}
                      <div className="h-full w-[25%] bg-amber-500"></div>
                      {/* BLUE ZONE */}
                      <div className="h-full w-[10%] bg-blue-500"></div>
                      {/* EMERALD ZONE */}
                      <div className="h-full w-[5%] bg-emerald-500"></div>

                      {/* Ticker Indicator Pin */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white border border-slate-950 dark:border-slate-100 shadow-lg animate-pulse"
                        style={{
                          left: `${Math.max(2, Math.min(98, 100 - (100 - parseFloat(currentPrediction.predictedPercentile)) * 8))}%`
                        }}
                      ></div>
                    </div>
                    
                    <p className="text-[10px] text-slate-450 italic leading-relaxed text-center font-medium">
                      Indicator pin placement represents your estimated distribution density. {getRankTierText(parseFloat(currentPrediction.predictedPercentile)).desc}
                    </p>
                  </div>

                  {/* Performance Subject Card Breakdown */}
                  <div className="space-y-3 bg-slate-50/40 dark:bg-slate-900/10 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-900">
                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-indigo-400 block font-mono">Subject Performance Ratios</h5>
                    
                    <div className="space-y-4">
                      {/* Physics Ratio */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350 font-sans">
                          <span>Physics</span>
                          <span className="font-mono text-xs">{pNum} / {getMaxMarks('Physics')} ({Math.round((pNum / getMaxMarks('Physics')) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${(pNum / getMaxMarks('Physics')) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Chemistry Ratio */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350 font-sans">
                          <span>Chemistry</span>
                          <span className="font-mono text-xs">{cNum} / {getMaxMarks('Chemistry')} ({Math.round((cNum / getMaxMarks('Chemistry')) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${(cNum / getMaxMarks('Chemistry')) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Maths or Biology Ratio */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350 font-sans">
                          <span>{getSubjectLabel()}</span>
                          <span className="font-mono text-xs">{mbNum} / {getMaxMarks('MathsOrBiology')} ({Math.round((mbNum / getMaxMarks('MathsOrBiology')) * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(mbNum / getMaxMarks('MathsOrBiology')) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-grow flex flex-col justify-center items-center text-center p-8 space-y-4">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                    <Target className="h-8 w-8 text-indigo-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-white font-poppins">Awaiting Marks Calculation</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                      Input your mock exam scores in the scoring desk on the left, click calculate, and view key prediction metrics.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* History Ledger Container */}
          <div className="max-w-3xl mx-auto pt-5 w-full flex flex-col items-center gap-4">
            
            <button
              id="attempt-ledger-toggle-button"
              type="button"
              onClick={() => setIsLedgerOpen(!isLedgerOpen)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-md border hover:scale-[1.02] active:scale-[0.99] ${
                isLedgerOpen
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-900/50 dark:to-rose-950/50 border-red-200 dark:border-rose-900/60 text-white shadow-rose-200/50 dark:shadow-none'
                  : 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-900/40 border-indigo-150 dark:border-indigo-950 text-indigo-750 dark:text-indigo-400 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-slate-850 dark:hover:to-slate-850 shadow-indigo-100/30 dark:shadow-none'
              }`}
            >
              <BookOpen className={`h-[18px] w-[18px] shrink-0 ${isLedgerOpen ? 'animate-bounce' : ''}`} />
              <span>{isLedgerOpen ? 'Close Attempt Ledger' : 'Open Attempt Ledger'}</span>
              <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${
                isLedgerOpen
                  ? 'bg-rose-700/60 dark:bg-rose-950/60 text-white'
                  : 'bg-indigo-200/50 dark:bg-indigo-950/50 text-indigo-850 dark:text-indigo-300'
              }`}>
                {historyList.length} saves
              </span>
            </button>

            {isLedgerOpen && (
              /* History Table Column */
              <div className="bg-slate-50/40 dark:bg-slate-900/15 p-6 rounded-3xl border border-slate-100 dark:border-slate-900 space-y-4 w-full animate-fade-in">
                <div className="border-b border-slate-100 dark:border-slate-900 pb-3 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-2 font-poppins">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    Attempt Ledger
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {historyList.length} saves
                    </span>
                    {historyList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="px-2.5 py-1 text-xxs font-extrabold border border-red-200/50 hover:border-red-500 rounded-xl bg-red-50 hover:bg-red-550 text-red-600 hover:text-white dark:bg-red-955/20 dark:hover:bg-red-950/60 transition-all cursor-pointer font-sans"
                      >
                        Delete Ledger Data
                      </button>
                    )}
                  </div>
                </div>

                {historyList.length === 0 ? (
                  <div className="py-14 text-center text-xs text-slate-400 font-sans">
                    No prediction attempts compiled yet. Submit scores to start log tracks!
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {historyList.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setCurrentPrediction(item);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                          currentPrediction?.id === item.id 
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60'
                            : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              Score: {item.totalMarks}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              ({Math.round((item.totalMarks / maxExamTotal) * 100)}%)
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono block">
                            {item.predictedPercentile}%tile
                          </span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-md mt-0.5 inline-block">
                            AIR {item.predictedRank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

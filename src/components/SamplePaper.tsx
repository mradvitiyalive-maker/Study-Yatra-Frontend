import React, { useEffect, useState } from 'react';
import { Exam } from '../types';
import { API_BASE_URL } from '../config';
import { FileText, PlayCircle, Target, GraduationCap, BookOpenCheck, ChevronLeft, Lock } from 'lucide-react';

interface SamplePaperSolution {
  id: string;
  subject: string;
  youtubeUrl: string;
  solutionOrder: number;
}

interface SamplePaperTest {
  id: string;
  examType: string;
  testType: 'chapterwise' | 'full_length';
  testName: string;
  testOrder: number;
  syllabusPdfUrl: string;
  testPdfUrl: string;
  status: string;
  solutions: SamplePaperSolution[];
}

type Step = 'exam' | 'type' | 'list' | 'detail';

export default function SamplePaper() {
  const [step, setStep] = useState<Step>('exam');
  const [exam, setExam] = useState<Exam | null>(null);
  const [tests, setTests] = useState<SamplePaperTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<SamplePaperTest | null>(null);
  const [attempted, setAttempted] = useState(false);

  const examOptions: { id: Exam; desc: string; icon: any }[] = [
    { id: 'JEE', desc: 'Joint Entrance Exam (Engineering)', icon: Target },
    { id: 'NEET', desc: 'National Eligibility cum Entrance Test', icon: GraduationCap },
    { id: 'CBSE', desc: 'Central Board Secondary Education', icon: BookOpenCheck },
  ];

  const handleSelectExam = (ex: Exam) => {
    setExam(ex);
    setStep('type');
  };

  const loadChapterwiseTests = async (ex: Exam) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sample-papers?examType=${ex}&testType=chapterwise`);
      const data = await res.json();
      setTests(data.papers || []);
    } catch (err) {
      console.error('Failed to load sample papers:', err);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapterwise = () => {
    if (exam) loadChapterwiseTests(exam);
    setStep('list');
  };

  const openTest = (test: SamplePaperTest) => {
    setActiveTest(test);
    setAttempted(false);
    setStep('detail');
  };

  const goBack = () => {
    if (step === 'detail') setStep('list');
    else if (step === 'list') setStep('type');
    else if (step === 'type') setStep('exam');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-poppins tracking-tight">
          Sample Paper
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Practice full syllabus sample tests with video solutions, subject-wise.
        </p>
      </div>

      {step !== 'exam' && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}

      {/* STEP 1: Choose Exam */}
      {step === 'exam' && (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-up">
          {examOptions.map((e) => {
            const Icon = e.icon;
            return (
              <button
                key={e.id}
                onClick={() => handleSelectExam(e.id)}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg transition-all text-left cursor-pointer"
              >
                <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xl font-bold font-poppins text-slate-800 dark:text-white mt-4">{e.id}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 2: Full-length mocks vs Chapter-wise test */}
      {step === 'type' && exam && (
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 animate-slide-up">
          <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed relative">
            <Lock className="h-5 w-5 text-slate-400 absolute top-4 right-4" />
            <h4 className="text-lg font-bold font-poppins text-slate-600 dark:text-slate-300">Full-length Mocks</h4>
            <p className="text-xs text-slate-400 mt-1">Coming soon</p>
          </div>
          <button
            onClick={handleSelectChapterwise}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg transition-all text-left cursor-pointer"
          >
            <h4 className="text-lg font-bold font-poppins text-slate-800 dark:text-white">Chapter-wise Test</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attempt topic-focused sample tests</p>
          </button>
        </div>
      )}

      {/* STEP 3: Test list (columns) */}
      {step === 'list' && (
        <div className="animate-slide-up">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-12">Loading tests...</p>
          ) : tests.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No tests available yet for {exam}. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold font-poppins text-slate-800 dark:text-white">{test.testName}</span>
                    <button
                      onClick={() => openTest(test)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80 cursor-pointer"
                      title="Attempt test"
                    >
                      <PlayCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <a
                      href={test.syllabusPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400"
                    >
                      <FileText className="h-3.5 w-3.5" /> View test syllabus (PDF)
                    </a>
                    <button
                      onClick={() => openTest(test)}
                      className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-xs cursor-pointer transition-all"
                    >
                      Attempt Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Test detail - test pdf + subject-wise solutions */}
      {step === 'detail' && activeTest && (
        <div className="max-w-2xl mx-auto animate-slide-up space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold font-poppins text-slate-800 dark:text-white mb-3">{activeTest.testName}</h4>
            <a
              href={activeTest.syllabusPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 mb-4"
            >
              <FileText className="h-3.5 w-3.5" /> View test syllabus (PDF)
            </a>
            <a
              href={activeTest.testPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAttempted(true)}
              className="block w-full text-center py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm cursor-pointer transition-all"
            >
              Open Test PDF
            </a>
          </div>

          {attempted && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-slide-up">
              <h5 className="text-xs uppercase tracking-wide font-bold text-slate-500 mb-3">Subject-wise Solutions</h5>
              {activeTest.solutions.length === 0 ? (
                <p className="text-xs text-slate-400">Solutions will be added soon.</p>
              ) : (
                <div className="space-y-2">
                  {activeTest.solutions.map((sol) => (
                    <a
                      key={sol.id}
                      href={sol.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-all"
                    >
                      <PlayCircle className="h-4 w-4 text-red-500" /> Video Solution — {sol.subject}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

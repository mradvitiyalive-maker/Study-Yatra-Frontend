import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { 
  UserProfile, 
  Question, 
  Chapter, 
  Doubt, 
  LectureBooking, 
  ChapterVideo, 
  BrandingConfig, 
  Subject, 
  Exam, 
  AcademicLevel 
} from '../types';
import { 
  getStoredQuestions, 
  saveQuestion, 
  deleteStoredQuestion, 
  getStoredChapters, 
  getStoredDoubts, 
  replyToDoubt, 
  getStoredBookings, 
  updateBookingStatus, 
  getStoredVideos, 
  saveVideo, 
  getBrandingConfig, 
  saveBrandingConfig,
  getStoredStreakDays
} from '../utils/storage';
import { RAW_CHAPTER_STRUCTURE } from '../data/chapters';
import { 
  ShieldAlert, 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Settings, 
  HelpCircle, 
  Video, 
  Users, 
  ShieldCheck, 
  BarChart, 
  Trash, 
  Copy, 
  Edit, 
  Send, 
  DollarSign, 
  CheckCircle, 
  BookOpen,
  Image,
  RefreshCw,
  Search,
  Sparkles,
  Tv,
  Eye,
  FileText
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface AdminPanelProps {
  user: UserProfile;
  branding: BrandingConfig;
  onRefreshBranding: () => void;
  onRefreshUser: () => void;
}

export default function AdminPanel({ user, branding, onRefreshBranding, onRefreshUser }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('analytics');

  // Core Data Logs
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [bookings, setBookings] = useState<LectureBooking[]>([]);
  const [videos, setVideos] = useState<ChapterVideo[]>([]);

  // Daily Dose Manager States
  const [dailyDoseList, setDailyDoseList] = useState<any[]>([]);
  const [loadingDailyDoses, setLoadingDailyDoses] = useState(false);

  // Lecture Manager States
  const [adminLectures, setAdminLectures] = useState<any[]>([]);
  const [loadingLectures, setLoadingLectures] = useState<boolean>(false);
  const [lectureDeleteConfirmId, setLectureDeleteConfirmId] = useState<number | null>(null);
  const [dailyDoseDeleteConfirmId, setDailyDoseDeleteConfirmId] = useState<string | null>(null);
  const [lectureFormLoading, setLectureFormLoading] = useState<boolean>(false);
  const [lecturePreviewUrl, setLecturePreviewUrl] = useState<string | null>(null);
  const [lecturePreviewTitle, setLecturePreviewTitle] = useState<string | null>(null);
  const [lectureForm, setLectureForm] = useState({
    id: '',
    examType: 'JEE',
    classLevel: 'Class 12',
    subject: 'Physics',
    chapter: '', // Chapter ID
    lectureTitle: '',
    lectureDescription: '',
    youtubeUrl: '',
    lectureOrder: '1',
    thumbnailUrl: ''
  });
  // Sample Paper Manager States
  const [adminSamplePapers, setAdminSamplePapers] = useState<any[]>([]);
  const [loadingSamplePapers, setLoadingSamplePapers] = useState<boolean>(false);
  const [samplePaperFormLoading, setSamplePaperFormLoading] = useState<boolean>(false);
  const [samplePaperDeleteConfirmId, setSamplePaperDeleteConfirmId] = useState<string | null>(null);
  const [expandedSamplePaperId, setExpandedSamplePaperId] = useState<string | null>(null);
  const [solutionFormLoading, setSolutionFormLoading] = useState<boolean>(false);
  const [samplePaperForm, setSamplePaperForm] = useState({
    id: '',
    examType: 'JEE',
    testType: 'chapterwise',
    testName: '',
    testOrder: '1',
    syllabusPdfUrl: '',
    testPdfUrl: '',
    status: 'Active'
  });
  const [solutionForm, setSolutionForm] = useState({
    id: '',
    samplePaperId: '',
    subject: '',
    youtubeUrl: '',
    solutionOrder: '1'
  });

  const [ddId, setDdId] = useState<string | null>(null);
  const [ddDate, setDdDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [ddExamType, setDdExamType] = useState<string>('JEE');
  const [ddSubject, setDdSubject] = useState<string>('Physics');
  const [ddQuestion, setDdQuestion] = useState<string>('');
  const [ddOptionA, setDdOptionA] = useState<string>('');
  const [ddOptionB, setDdOptionB] = useState<string>('');
  const [ddOptionC, setDdOptionC] = useState<string>('');
  const [ddOptionD, setDdOptionD] = useState<string>('');
  const [ddCorrectAnswer, setDdCorrectAnswer] = useState<string>('A');
  const [ddExplanation, setDdExplanation] = useState<string>('');
  const [ddCorrectMotivation, setDdCorrectMotivation] = useState<string>('Ek question roz, rank ki taraf ek aur kadam. 🎯');
  const [ddWrongMotivation, setDdWrongMotivation] = useState<string>('Galtiyaan hi topper banati hain. Re-read the explanation! 📚');
  const [ddMotivationImageUrl, setDdMotivationImageUrl] = useState<string>('');
  const [ddPublishDate, setDdPublishDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [ddStatus, setDdStatus] = useState<string>('Active');

  // CSV text draft
  const [csvText, setCsvText] = useState<string>('');
  
  // Manual Question Draft Formula
  const [qExam, setQExam] = useState<Exam>('JEE');
  const [qSubject, setQSubject] = useState<Subject>('Physics');
  const [qChapterId, setQChapterId] = useState<string>('');
  const [qYear, setQYear] = useState<number>(2024);
  const [qExamDate, setQExamDate] = useState<string>('');
  const [qText, setQText] = useState<string>('');
  const [qOptA, setQOptA] = useState<string>('');
  const [qOptB, setQOptB] = useState<string>('');
  const [qOptC, setQOptC] = useState<string>('');
  const [qOptD, setQOptD] = useState<string>('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qExp, setQExp] = useState<string>('');
  const [qConcept, setQConcept] = useState<string>('');
  const [qDiff, setQDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qImgUrl, setQImgUrl] = useState<string>('');

  // Branding config variables
  const [bLogoText, setBLogoText] = useState<string>('');
  const [bLogoColor, setBLogoColor] = useState<string>('');
  const [bHeadline, setBHeadline] = useState<string>('');
  const [bSubhead, setBSubhead] = useState<string>('');
  const [bBannerUrl, setBBannerUrl] = useState<string>('');
  const [bLogoUrl, setBLogoUrl] = useState<string>('');
  const [bPlaylistUrl, setBPlaylistUrl] = useState<string>('');

  // Video assign variables
  const [vidChapterId, setVidChapterId] = useState<string>('');
  const [vidTitle, setVidTitle] = useState<string>('');
  const [vidUrl, setVidUrl] = useState<string>('');

  // Doubt draft responses
  const [adminReplyText, setAdminReplyText] = useState<Record<string, string>>({});
  const [adminReplyVideoUrl, setAdminReplyVideoUrl] = useState<Record<string, string>>({});

  // Status notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Year Range Settings (Admin Analytics) States
  const [yearStats, setYearStats] = useState<{ year: string; count: number }[]>([]);
  const [yearStatsMin, setYearStatsMin] = useState<number | null>(null);
  const [yearStatsMax, setYearStatsMax] = useState<number | null>(null);
  const [loadingYearStats, setLoadingYearStats] = useState<boolean>(false);
  const [yearStatsExamFilter, setYearStatsExamFilter] = useState<string>('All');

  // Custom Year Range Override States (admin-set range shown to students)
  const [yearOverride, setYearOverride] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [yearOverrideMinInput, setYearOverrideMinInput] = useState<string>('');
  const [yearOverrideMaxInput, setYearOverrideMaxInput] = useState<string>('');
  const [savingYearOverride, setSavingYearOverride] = useState<boolean>(false);

  // Chapter Images States
  const [chapterImagesList, setChapterImagesList] = useState<any[]>([]);
  const [ciClassFilter, setCiClassFilter] = useState<'11' | '12'>('11');
  const [ciSubjectFilter, setCiSubjectFilter] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Botany' | 'Zoology'>('Physics');
  const [ciEditingUrls, setCiEditingUrls] = useState<Record<string, string>>({});
  const [ciSavingRows, setCiSavingRows] = useState<Record<string, boolean>>({});

  // User search
  const [userSearchText, setUserSearchText] = useState<string>('');

  // Import System States
  const [importMode, setImportMode] = useState<'csv' | 'pdf'>('csv');
  const [csvPreview, setCsvPreview] = useState<{ total: number; valid: number; invalid: number; questions: any[] } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);

  // PDF Import States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [pdfQuestions, setPdfQuestions] = useState<any[]>([]);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  // PDF Bulk Assignment States
  const [bulkExam, setBulkExam] = useState<Exam>('JEE');
  const [bulkClass, setBulkClass] = useState<AcademicLevel>('Class 12');
  const [bulkSubject, setBulkSubject] = useState<Subject>('Physics');
  const [bulkChapter, setBulkChapter] = useState<string>('');
  const [bulkYear, setBulkYear] = useState<string>('2024');
  const [bulkSession, setBulkSession] = useState<string>('January');

  // PDF Report State
  const [pdfReport, setPdfReport] = useState<{
    totalExtracted: number;
    withExplanations: number;
    withoutExplanations: number;
    successfullyMapped: number;
    savedToDb: number;
    failedRecords: number;
    errors: string[];
  } | null>(null);

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "exam_type,class_level,subject,chapter,year,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty\n"
      + "JEE,Class 12,Physics,Electrostatics,2024,\"What is the electric field inside a perfectly conducting sphere?\",Zero,Infinite,Variable,Depends on charge,A,\"Electric field inside a conductor is zero under electrostatic conditions.\",Easy\n"
      + "NEET,Class 11,Chemistry,Some Basic Concepts of Chemistry,2023,\"Who proposed the law of conservation of mass?\",Antoine Lavoisier,John Dalton,Joseph Proust,Robert Boyle,A,\"Antoine Lavoisier established mass conservation in chemical reactions.\",Medium";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "study_yatra_sample_pyqs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
      analyzeCSVData(text);
    };
    reader.readAsText(file);
  };

  const analyzeCSVData = async (rawText: string) => {
    setIsParsing(true);
    setCsvPreview(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/parse-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: rawText })
      });
      const data = await res.json();
      if (res.ok) {
        setCsvPreview(data);
      } else {
        triggerNotification(data.error || 'Failed to parse CSV data.');
      }
    } catch (err: any) {
      triggerNotification('Failed to communicate with CSV analysis service.');
    } finally {
      setIsParsing(false);
    }
  };

  const commitCSVImport = async () => {
    if (!csvPreview || csvPreview.questions.length === 0) return;
    const validQuestions = csvPreview.questions.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      triggerNotification('No valid questions found to import.');
      return;
    }

    setImportProgress(10);
    try {
      const interval = setInterval(() => {
        setImportProgress(p => p !== null && p < 90 ? p + 20 : p);
      }, 300);

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/questions/import-commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questionsList: validQuestions })
      });

      clearInterval(interval);
      setImportProgress(100);

      const data = await res.json();
      if (res.ok) {
        triggerNotification(`Mubarak ho! ${data.count} questions successfully committed to Cloud SQL PostgreSQL database!`);
        setCsvPreview(null);
        setCsvText('');
        loadAllAdminData();
      } else {
        triggerNotification(data.error || 'Failed to write CSV questions.');
      }
    } catch (err: any) {
      triggerNotification('Connection error while committing questions.');
    } finally {
      setTimeout(() => setImportProgress(null), 1000);
    }
  };

  const handlePDFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePDFProcess = async () => {
    if (!pdfBase64) {
      triggerNotification('Please select or upload a valid PDF document.');
      return;
    }
    setIsProcessingPdf(true);
    setPdfQuestions([]);
    try {
      const token = await getAuthToken();
      if (!token) {
        triggerNotification('You must be logged in as an admin to use AI PDF extraction.');
        setIsProcessingPdf(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/pdf/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pdfBase64,
          chaptersList: chapters.map(c => c.name)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPdfQuestions(data.questions);
        triggerNotification(`Gemini parsed ${data.count} MCQ questions successfully with chapter detection!`);
      } else {
        triggerNotification(data.error || 'AI PDF Extraction failed.');
      }
    } catch (err: any) {
      triggerNotification('AI Service communication failed.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const applyBulkAssignmentToPDFQuestions = () => {
    if (pdfQuestions.length === 0) {
      triggerNotification('No extracted questions found to apply bulk assignment.');
      return;
    }
    const updated = pdfQuestions.map(q => ({
      ...q,
      examType: bulkExam,
      classLevel: bulkClass,
      subject: bulkSubject,
      chapter: bulkChapter,
      year: bulkYear,
      session: bulkSession
    }));
    setPdfQuestions(updated);
    triggerNotification(`Applied bulk assignment (Exam: ${bulkExam}, Topic: ${bulkChapter}) to all ${pdfQuestions.length} questions!`);
  };

  const commitPDFQuestions = async () => {
    if (pdfQuestions.length === 0) return;

    const validationErrors: string[] = [];
    let successfullyMapped = 0;
    let failedRecords = 0;

    const validatedList = pdfQuestions.map((q, idx) => {
      const errorPrefix = `Question ${idx + 1}: `;
      let isLocalValid = true;

      // 1. Exam exists
      if (!q.examType || String(q.examType).trim() === '') {
        validationErrors.push(`${errorPrefix}Exam selection is missing.`);
        isLocalValid = false;
      }

      // 2. Class Level exists
      if (!q.classLevel || String(q.classLevel).trim() === '') {
        validationErrors.push(`${errorPrefix}Class level selection is missing.`);
        isLocalValid = false;
      }

      // 3. Subject exists
      if (!q.subject || String(q.subject).trim() === '') {
        validationErrors.push(`${errorPrefix}Subject selection is missing.`);
        isLocalValid = false;
      }

      // 4. Chapter exists AND matches system chapter database
      if (!q.chapter || String(q.chapter).trim() === '') {
        validationErrors.push(`${errorPrefix}Chapter is required.`);
        isLocalValid = false;
      } else {
        const matchingChapter = chapters.some(
          c => c.name.toLowerCase() === String(q.chapter).trim().toLowerCase()
        );
        if (!matchingChapter) {
          validationErrors.push(`${errorPrefix}Chapter "${q.chapter}" does not exist in the active chapters list of the system.`);
          isLocalValid = false;
        }
      }

      // 5. Year exists
      if (!q.year || String(q.year).trim() === '') {
        validationErrors.push(`${errorPrefix}Exam year is missing.`);
        isLocalValid = false;
      }

      // 6. Correct Answer exists and is one of A, B, C, D
      if (!q.correctAnswer || !['A', 'B', 'C', 'D'].includes(String(q.correctAnswer).trim().toUpperCase())) {
        validationErrors.push(`${errorPrefix}Correct option key is missing or invalid (must be A, B, C, or D).`);
        isLocalValid = false;
      }

      if (isLocalValid) {
        successfullyMapped++;
      } else {
        failedRecords++;
      }

      return {
        ...q,
        isValid: isLocalValid
      };
    });

    if (validationErrors.length > 0) {
      const withExp = pdfQuestions.filter(q => q.explanation && q.explanation.trim() !== '').length;
      setPdfReport({
        totalExtracted: pdfQuestions.length,
        withExplanations: withExp,
        withoutExplanations: pdfQuestions.length - withExp,
        successfullyMapped,
        savedToDb: 0,
        failedRecords,
        errors: validationErrors
      });
      triggerNotification(`Validation failed! ${validationErrors.length} errors found. Please align correct chapters before saving.`);
      return;
    }

    setImportProgress(20);
    try {
      const interval = setInterval(() => {
        setImportProgress(p => p !== null && p < 95 ? p + 15 : p);
      }, 250);

      // Clean explanation field to be NULL if missing
      const preparedQuestions = validatedList.map(q => ({
        ...q,
        explanation: q.explanation && q.explanation.trim() !== '' ? q.explanation : null
      }));

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/questions/import-commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questionsList: preparedQuestions })
      });

      clearInterval(interval);
      setImportProgress(100);

      const data = await res.json();
      if (res.ok) {
        triggerNotification(`Mubarak ho! Successfully saved ${data.count} questions to the database.`);
        const withExp = preparedQuestions.filter(q => q.explanation !== null).length;
        setPdfReport({
          totalExtracted: preparedQuestions.length,
          withExplanations: withExp,
          withoutExplanations: preparedQuestions.length - withExp,
          successfullyMapped: preparedQuestions.length,
          savedToDb: data.count,
          failedRecords: 0,
          errors: []
        });
        setPdfQuestions([]);
        setPdfFile(null);
        setPdfBase64('');
        loadAllAdminData();
      } else {
        const withExp = pdfQuestions.filter(q => q.explanation && q.explanation.trim() !== '').length;
        setPdfReport({
          totalExtracted: pdfQuestions.length,
          withExplanations: withExp,
          withoutExplanations: pdfQuestions.length - withExp,
          successfullyMapped: pdfQuestions.length,
          savedToDb: 0,
          failedRecords: pdfQuestions.length,
          errors: [data.error || 'Server rejected database commit of validated questions.']
        });
        triggerNotification(data.error || 'Failed saving PDF questions.');
      }
    } catch (err: any) {
      triggerNotification('Failed connection during saving.');
    } finally {
      setTimeout(() => setImportProgress(null), 1000);
    }
  };
  
  // Real Platform Stats (Admin Analytics tab) - loaded from Postgres
  const [platformStats, setPlatformStats] = useState<{
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    questionsSolvedToday: number;
    premiumRevenue: number;
  } | null>(null);
  const [loadingPlatformStats, setLoadingPlatformStats] = useState<boolean>(false);

  const [topChapters, setTopChapters] = useState<{ chapter: string; subject: string; count: number }[]>([]);
  const [topSubjects, setTopSubjects] = useState<{ subject: string; count: number; percentage: number }[]>([]);

  // Real User Ledger (Admin Users tab) - loaded from Postgres users table
  interface AdminLedgerUser {
    uid: string;
    email: string;
    name: string;
    targetExam: string;
    classLevel: string;
    plan: string;
  }
  const [adminUsersList, setAdminUsersList] = useState<AdminLedgerUser[]>([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState<boolean>(false);

  useEffect(() => {
    loadAllAdminData();
    
    // Prep branding inputs
    setBLogoText(branding.logoText);
    setBLogoColor(branding.logoColor);
    setBHeadline(branding.heroHeadline);
    setBSubhead(branding.heroSubheadline);
    setBBannerUrl(branding.heroBannerUrl);
    setBLogoUrl(branding.logoUrl || 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg');
    setBPlaylistUrl(branding.youtubePlaylistUrl || 'https://youtube.com/playlist?list=PLgr_pCxL9SgBtG3epg2NMy-9X-2aB0xH0');
  }, [branding]);

  const loadAllAdminData = async () => {
    setChapters(getStoredChapters());
    setBookings(getStoredBookings());
    setVideos(getStoredVideos());

    // Load Questions from database API
    try {
      const qRes = await fetch(`${API_BASE_URL}/api/questions?all=true`);
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData);
      } else {
        setQuestions(getStoredQuestions());
      }
    } catch (e) {
      console.error('Failed to load questions from db API, fallback:', e);
      setQuestions(getStoredQuestions());
    }

    // Load Doubts from database API
    try {
      const token = await getAuthToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/doubts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const doubtsData = await res.json();
          setDoubts(doubtsData);
        } else {
          setDoubts(getStoredDoubts());
        }
      } else {
        setDoubts(getStoredDoubts());
      }
    } catch (err) {
      console.error('Failed to load doubts from db:', err);
      setDoubts(getStoredDoubts());
    }

    // Load custom chapter images from database API
    try {
      const ciRes = await fetch(`${API_BASE_URL}/api/chapter-images`);
      if (ciRes.ok) {
        const ciData = await ciRes.json();
        setChapterImagesList(ciData);
      }
    } catch (e) {
      console.error('Failed to load chapter images from db:', e);
    }

    // Autofill first chapter choice
    const initialChs = getStoredChapters();
    if (initialChs.length > 0) {
      setQChapterId(initialChs[0].id);
      setVidChapterId(initialChs[0].id);
      setBulkChapter(initialChs[0].name);
    }
  };

  const loadDailyDoses = async () => {
    try {
      setLoadingDailyDoses(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyDoseList(data);
      }
    } catch (err) {
      console.error('Failed to load admin daily doses:', err);
    } finally {
      setLoadingDailyDoses(false);
    }
  };

  const loadYearStats = async () => {
    try {
      setLoadingYearStats(true);
      const token = await getAuthToken();
      const query = yearStatsExamFilter !== 'All' ? `?examType=${encodeURIComponent(yearStatsExamFilter)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/admin/year-stats${query}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setYearStats(data.yearBreakdown || []);
        setYearStatsMin(data.minYear);
        setYearStatsMax(data.maxYear);
      }
    } catch (err) {
      console.error('Failed to load year range stats:', err);
    } finally {
      setLoadingYearStats(false);
    }
  };

  const loadYearRangeOverride = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/year-range-override`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setYearOverride(data.override);
        if (data.override) {
          setYearOverrideMinInput(String(data.override.minYear));
          setYearOverrideMaxInput(String(data.override.maxYear));
        }
      }
    } catch (err) {
      console.error('Failed to load year-range override:', err);
    }
  };

  const loadPlatformStats = async () => {
    try {
      setLoadingPlatformStats(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/stats/overview`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformStats({
          dailyActiveUsers: data.dailyActiveUsers,
          monthlyActiveUsers: data.monthlyActiveUsers,
          questionsSolvedToday: data.questionsSolvedToday,
          premiumRevenue: data.premiumRevenue
        });
      }
    } catch (err) {
      console.error('Failed to load platform stats overview:', err);
    } finally {
      setLoadingPlatformStats(false);
    }
  };

  const loadTopChapters = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/stats/top-chapters`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTopChapters(data.topChapters || []);
      }
    } catch (err) {
      console.error('Failed to load top chapter practices:', err);
    }
  };

  const loadTopSubjects = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/stats/top-subjects`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTopSubjects(data.topSubjects || []);
      }
    } catch (err) {
      console.error('Failed to load top subjects breakdown:', err);
    }
  };

  const loadAdminUsers = async () => {
    try {
      setLoadingAdminUsers(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  const handleUpgradeRealUser = async (uid: string, name: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${uid}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ plan: 'Premium' })
      });
      if (res.ok) {
        setAdminUsersList(prev => prev.map(u => u.uid === uid ? { ...u, plan: 'Premium' } : u));
        triggerNotification(`Upgraded ${name} to Premium plan.`);
      } else {
        triggerNotification('Failed to upgrade user plan.');
      }
    } catch (err) {
      console.error('Failed to upgrade user:', err);
      triggerNotification('Connection error while upgrading user.');
    }
  };

  const handleDowngradeRealUser = async (uid: string, name: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${uid}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ plan: 'Free' })
      });
      if (res.ok) {
        setAdminUsersList(prev => prev.map(u => u.uid === uid ? { ...u, plan: 'Free' } : u));
        triggerNotification(`Reverted ${name} to Free plan.`);
      } else {
        triggerNotification('Failed to downgrade user plan.');
      }
    } catch (err) {
      console.error('Failed to downgrade user:', err);
      triggerNotification('Connection error while downgrading user.');
    }
  };

  const handleSaveYearOverride = async () => {
    if (!yearOverrideMinInput.trim() || !yearOverrideMaxInput.trim()) {
      triggerNotification('Please enter both a min and max year before saving.');
      return;
    }
    setSavingYearOverride(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/year-range-override/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ minYear: yearOverrideMinInput, maxYear: yearOverrideMaxInput })
      });
      const data = await res.json();
      if (res.ok) {
        setYearOverride(data.override);
        triggerNotification('Custom PYQ year range saved! Students will now see this range.');
      } else {
        triggerNotification(data.error || 'Failed to save custom year range.');
      }
    } catch (err) {
      console.error('Failed to save year-range override:', err);
      triggerNotification('Connection error while saving custom year range.');
    } finally {
      setSavingYearOverride(false);
    }
  };

  const handleResetYearOverride = async () => {
    setSavingYearOverride(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/year-range-override/reset`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setYearOverride(null);
        setYearOverrideMinInput('');
        setYearOverrideMaxInput('');
        triggerNotification('Reverted to live DB-derived year range.');
      }
    } catch (err) {
      console.error('Failed to reset year-range override:', err);
    } finally {
      setSavingYearOverride(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'daily-dose') {
      loadDailyDoses();
    }
    if (activeSubTab === 'lectures') {
      loadAdminLectures();
    }
    if (activeSubTab === 'sample-papers') {
      loadAdminSamplePapers();
    }
    if (activeSubTab === 'analytics') {
      loadYearStats();
      loadYearRangeOverride();
      loadPlatformStats();
      loadTopChapters();
      loadTopSubjects();
    }
    if (activeSubTab === 'users') {
      loadAdminUsers();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'analytics') {
      loadYearStats();
    }
  }, [yearStatsExamFilter]);

  const loadAdminLectures = async () => {
    try {
      setLoadingLectures(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminLectures(data || []);
      }
    } catch (err) {
      console.error('Failed to load admin lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureForm.chapter || !lectureForm.lectureTitle || !lectureForm.youtubeUrl) {
      triggerNotification('Please provide Chapter, Lecture Title, and YouTube link.');
      return;
    }

    try {
      setLectureFormLoading(true);
      
      const chs = getStoredChapters();
      const matchedChapter = chs.find(c => c.id === lectureForm.chapter);
      
      const payload = {
        ...lectureForm,
        examType: matchedChapter ? matchedChapter.exam : lectureForm.examType,
        classLevel: matchedChapter ? matchedChapter.level : lectureForm.classLevel,
        subject: matchedChapter ? matchedChapter.subject : lectureForm.subject,
      };

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerNotification(lectureForm.id ? 'Lecture successfully updated!' : 'Lecture successfully created!');
        setLectureForm({
          id: '',
          examType: 'JEE',
          classLevel: 'Class 12',
          subject: 'Physics',
          chapter: '',
          lectureTitle: '',
          lectureDescription: '',
          youtubeUrl: '',
          lectureOrder: String((adminLectures.filter(l => l.chapter === lectureForm.chapter).length + 1) || 1),
          thumbnailUrl: ''
        });
        loadAdminLectures();
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || 'Failed to save lecture.');
      }
    } catch (err: any) {
      console.error('Failed to save lecture:', err);
      triggerNotification(err.message || 'Error occurred while saving lecture.');
    } finally {
      setLectureFormLoading(false);
    }
  };

  const handleDeleteLecture = async (id: number) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/lectures/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        triggerNotification('Lecture successfully deleted.');
        loadAdminLectures();
      } else {
        triggerNotification('Failed to delete lecture.');
      }
    } catch (err) {
      console.error('Failed to delete lecture:', err);
    }
  };

  const loadAdminSamplePapers = async () => {
    try {
      setLoadingSamplePapers(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/sample-papers`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSamplePapers(data.papers || []);
      }
    } catch (err) {
      console.error('Failed to load admin sample papers:', err);
    } finally {
      setLoadingSamplePapers(false);
    }
  };

  const resetSamplePaperForm = () => {
    setSamplePaperForm({
      id: '',
      examType: 'JEE',
      testType: 'chapterwise',
      testName: '',
      testOrder: String((adminSamplePapers.length || 0) + 1),
      syllabusPdfUrl: '',
      testPdfUrl: '',
      status: 'Active'
    });
  };

  const handleSaveSamplePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!samplePaperForm.testName || !samplePaperForm.syllabusPdfUrl || !samplePaperForm.testPdfUrl) {
      triggerNotification('Please provide Test Name, Syllabus PDF link, and Test PDF link.');
      return;
    }
    try {
      setSamplePaperFormLoading(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/sample-papers/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(samplePaperForm)
      });
      if (res.ok) {
        triggerNotification(samplePaperForm.id ? 'Sample paper test updated!' : 'Sample paper test created!');
        resetSamplePaperForm();
        loadAdminSamplePapers();
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || 'Failed to save sample paper test.');
      }
    } catch (err: any) {
      console.error('Failed to save sample paper test:', err);
      triggerNotification(err.message || 'Error occurred while saving sample paper test.');
    } finally {
      setSamplePaperFormLoading(false);
    }
  };

  const handleEditSamplePaperClick = (test: any) => {
    setSamplePaperForm({
      id: String(test.id),
      examType: test.examType || 'JEE',
      testType: test.testType || 'chapterwise',
      testName: test.testName || '',
      testOrder: String(test.testOrder || 1),
      syllabusPdfUrl: test.syllabusPdfUrl || '',
      testPdfUrl: test.testPdfUrl || '',
      status: test.status || 'Active'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSamplePaper = async (id: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/sample-papers/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        triggerNotification('Sample paper test deleted.');
        loadAdminSamplePapers();
      } else {
        triggerNotification('Failed to delete sample paper test.');
      }
    } catch (err) {
      console.error('Failed to delete sample paper test:', err);
    } finally {
      setSamplePaperDeleteConfirmId(null);
    }
  };

  const handleSaveSolution = async (e: React.FormEvent, samplePaperId: string) => {
    e.preventDefault();
    if (!solutionForm.subject || !solutionForm.youtubeUrl) {
      triggerNotification('Please provide Subject and YouTube link for the solution.');
      return;
    }
    try {
      setSolutionFormLoading(true);
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/sample-papers/solutions/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...solutionForm, samplePaperId })
      });
      if (res.ok) {
        triggerNotification(solutionForm.id ? 'Solution link updated!' : 'Solution link added!');
        setSolutionForm({ id: '', samplePaperId: '', subject: '', youtubeUrl: '', solutionOrder: '1' });
        loadAdminSamplePapers();
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || 'Failed to save solution link.');
      }
    } catch (err: any) {
      console.error('Failed to save solution link:', err);
      triggerNotification(err.message || 'Error occurred while saving solution link.');
    } finally {
      setSolutionFormLoading(false);
    }
  };

  const handleDeleteSolution = async (id: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/sample-papers/solutions/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        triggerNotification('Solution link deleted.');
        loadAdminSamplePapers();
      } else {
        triggerNotification('Failed to delete solution link.');
      }
    } catch (err) {
      console.error('Failed to delete solution link:', err);
    }
  };

  const handleEditLectureClick = (lec: any) => {
    setLectureForm({
      id: String(lec.id),
      examType: lec.examType || 'JEE',
      classLevel: lec.classLevel || 'Class 12',
      subject: lec.subject || 'Physics',
      chapter: lec.chapter || '',
      lectureTitle: lec.lectureTitle || '',
      lectureDescription: lec.lectureDescription || '',
      youtubeUrl: lec.youtubeUrl || '',
      lectureOrder: String(lec.lectureOrder || '1'),
      thumbnailUrl: lec.thumbnailUrl || ''
    });
    document.getElementById('lecture-management-form-main')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveDailyDose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ddDate || !ddExamType || !ddSubject || !ddQuestion || !ddOptionA || !ddOptionB || !ddOptionC || !ddOptionD || !ddCorrectAnswer) {
      triggerNotification('Please fill in all core daily dose setup fields.');
      return;
    }
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: ddId,
          date: ddDate,
          examType: ddExamType,
          subject: ddSubject,
          question: ddQuestion,
          optionA: ddOptionA,
          optionB: ddOptionB,
          optionC: ddOptionC,
          optionD: ddOptionD,
          correctAnswer: ddCorrectAnswer,
          explanation: ddExplanation,
          correctMotivationMessage: ddCorrectMotivation,
          wrongMotivationMessage: ddWrongMotivation,
          motivationImageUrl: ddMotivationImageUrl,
          publishDate: ddPublishDate || ddDate,
          status: ddStatus
        })
      });

      if (res.ok) {
        triggerNotification(ddId ? 'Daily Dose question was updated successfully!' : 'New Daily Dose question published!');
        setDdId(null);
        setDdQuestion('');
        setDdOptionA('');
        setDdOptionB('');
        setDdOptionC('');
        setDdOptionD('');
        setDdExplanation('');
        setDdMotivationImageUrl('');
        loadDailyDoses();
      } else {
        triggerNotification('Failed to commit Daily Dose transaction.');
      }
    } catch (err) {
      console.error('Failed Daily Dose edit step:', err);
    }
  };

  const handleEditDailyDoseChoice = (item: any) => {
    setDdId(item.id);
    setDdDate(item.date);
    setDdExamType(item.examType);
    setDdSubject(item.subject);
    setDdQuestion(item.question);
    setDdOptionA(item.optionA);
    setDdOptionB(item.optionB);
    setDdOptionC(item.optionC);
    setDdOptionD(item.optionD);
    setDdCorrectAnswer(item.correctAnswer);
    setDdExplanation(item.explanation);
    setDdCorrectMotivation(item.correctMotivationMessage || '');
    setDdWrongMotivation(item.wrongMotivationMessage || '');
    setDdMotivationImageUrl(item.motivationImageUrl || '');
    setDdPublishDate(item.publishDate || item.date);
    setDdStatus(item.status);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteDailyDoseChoice = async (id: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/daily-dose/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        triggerNotification('Daily Dose question deleted.');
        loadDailyDoses();
      }
    } catch (err) {
      console.error('Failed deletion command:', err);
    }
  };

  // 1.5. CHAPTER IMAGES CRUD ACTIONS
  const handleSaveChapterImage = async (chapterName: string) => {
    const rawUrl = ciEditingUrls[chapterName];
    // Find current config in state to determine default
    const existingConfig = chapterImagesList.find(c => c.classLevel === ciClassFilter && c.subject === ciSubjectFilter && c.chapterName === chapterName);
    const urlValue = rawUrl !== undefined ? rawUrl : (existingConfig?.imageUrl || '');

    setCiSavingRows(prev => ({ ...prev, [chapterName]: true }));
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/chapter-images/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          classLevel: ciClassFilter,
          subject: ciSubjectFilter,
          chapterName,
          imageUrl: urlValue
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local list
        setChapterImagesList(prev => {
          const filtered = prev.filter(item => !(item.classLevel === ciClassFilter && item.subject === ciSubjectFilter && item.chapterName === chapterName));
          return [...filtered, data.data];
        });
        if (typeof (window as any).triggerNotification === 'function') {
          (window as any).triggerNotification(`Mubarak ho! Custom image for "${chapterName}" updated successfully.`);
        } else {
          setNotification(`Mubarak ho! Custom image for "${chapterName}" updated successfully.`);
          setTimeout(() => setNotification(null), 4000);
        }
      } else {
        setNotification('Opps! Failed to save chapter image config.');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save chapter image configuration:', err);
      setNotification('Failed connection during saving chapter image.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setCiSavingRows(prev => ({ ...prev, [chapterName]: false }));
    }
  };

  const getChaptersForCuration = (cls: '11' | '12', sub: string): string[] => {
    const levelKey = cls === '11' ? 'Class 11' : 'Class 12';
    try {
      if (sub === 'Physics' || sub === 'Chemistry' || sub === 'Mathematics') {
        return (RAW_CHAPTER_STRUCTURE.CBSE_JEE as any)[sub][levelKey] || [];
      } else if (sub === 'Botany' || sub === 'Zoology') {
        return (RAW_CHAPTER_STRUCTURE.NEET as any)[sub][levelKey] || [];
      }
    } catch (err) {
      console.error('Error fetching chapters for curation:', err);
    }
    return [];
  };

  const getEditingUrl = (chName: string) => {
    if (ciEditingUrls[chName] !== undefined) {
      return ciEditingUrls[chName];
    }
    const config = chapterImagesList.find(c => c.classLevel === ciClassFilter && c.subject === ciSubjectFilter && c.chapterName === chName);
    return config?.imageUrl || '';
  };

  const handleSaveAllChapterImages = async () => {
    const activeChapters = getChaptersForCuration(ciClassFilter, ciSubjectFilter);
    let successCount = 0;
    
    // Set all as saving
    const newSavingState = { ...ciSavingRows };
    activeChapters.forEach(ch => {
      if (ciEditingUrls[ch] !== undefined) {
        newSavingState[ch] = true;
      }
    });
    setCiSavingRows(newSavingState);

    try {
      // Loop through modified chapters in filter
      for (const chName of activeChapters) {
        const rawUrl = ciEditingUrls[chName];
        if (rawUrl === undefined) continue; // Not modified, skip!
        
        try {
          const token = await getAuthToken();
          const res = await fetch(`${API_BASE_URL}/api/chapter-images/upsert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              classLevel: ciClassFilter,
              subject: ciSubjectFilter,
              chapterName: chName,
              imageUrl: rawUrl
            })
          });
          if (res.ok) {
            const data = await res.json();
            // Update local state incrementally
            setChapterImagesList(prev => {
              const filtered = prev.filter(item => !(item.classLevel === ciClassFilter && item.subject === ciSubjectFilter && item.chapterName === chName));
              return [...filtered, data.data];
            });
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to save chapter image for ${chName}:`, err);
        }
      }
      
      if (successCount > 0) {
        setNotification(`Bahut badhiya! Saved ${successCount} chapter background images.`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(`No unsaved modifications in the active filters.`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (gErr) {
      console.error('Failed bulk editing save operation:', gErr);
    } finally {
      // Clear saving animation indicators
      const clearedSaving = { ...ciSavingRows };
      activeChapters.forEach(ch => {
        clearedSaving[ch] = false;
      });
      setCiSavingRows(clearedSaving);
    }
  };

  // 1. QUESTION MANAGEMENT ACTIONS
  const handleManualQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qOptA.trim()) return;

    const matchedChapter = chapters.find(c => c.id === qChapterId);
    const chapterName = matchedChapter?.name || 'Units and Measurements';
    const classLevel = matchedChapter?.level || 'Class 12';

    const payload = {
      examType: qExam,
      classLevel: classLevel,
      subject: qSubject,
      chapter: chapterName,
      year: Number(qYear) || 2024,
      session: qExam === 'JEE' ? 'January' : (qExam === 'NEET' ? 'NEET' : 'CBSE'),
      examDate: qExamDate || null,
      questionText: qText.trim(),
      optionA: qOptA.trim(),
      optionB: qOptB.trim(),
      optionC: qOptC.trim(),
      optionD: qOptD.trim(),
      correctAnswer: qCorrect,
      explanation: qExp.trim() || 'No explanation provided yet.',
      difficulty: qDiff,
      imageUrl: qImgUrl.trim() || null
    };

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/questions/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setQuestions(prev => [created, ...prev]);
        triggerNotification('Manual PYQ question saved to database successfully.');
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.error('Failed to save to database backend, falling back to local storage:', err);
      const newQ: Question = {
        id: `question-${Date.now()}`,
        chapterId: qChapterId,
        examType: qExam,
        subject: qSubject,
        year: Number(qYear),
        examDate: qExamDate || undefined,
        questionText: qText.trim(),
        options: {
          A: qOptA.trim(),
          B: qOptB.trim(),
          C: qOptC.trim(),
          D: qOptD.trim()
        },
        correctAnswer: qCorrect,
        explanation: qExp.trim() || 'No explanation provided yet.',
        concept: qConcept.trim() || 'General Practice Chapter',
        difficulty: qDiff,
        imageUrl: qImgUrl.trim() || undefined
      };
      saveQuestion(newQ);
      setQuestions(getStoredQuestions());
      triggerNotification('PYQ saved to Local Storage backup successfully.');
    }
    
    // Reset inputs
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQExp('');
    setQConcept('');
    setQImgUrl('');
  };

  const handleDuplicateQuestion = async (q: Question) => {
    const isDbId = !isNaN(Number(q.id));
    if (isDbId) {
      try {
        const payload = {
          examType: q.examType,
          classLevel: q.chapterId.includes('class-11') ? 'Class 11' : 'Class 12',
          subject: q.subject,
          chapter: q.concept.replace(' Concept Drill', ''),
          year: q.year,
          session: q.session,
          questionText: `[DUPLICATE] ${q.questionText}`,
          optionA: q.options.A,
          optionB: q.options.B,
          optionC: q.options.C,
          optionD: q.options.D,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          imageUrl: q.imageUrl || null
        };
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/questions/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setQuestions(prev => [created, ...prev]);
          triggerNotification('Question duplicated to database successfully.');
          return;
        }
      } catch (err) {
        console.error('Failed to duplicate question on DB:', err);
      }
    }

    const dup: Question = {
      ...q,
      id: `question-dup-${Date.now()}`,
      questionText: `[DUPLICATE] ${q.questionText}`
    };
    saveQuestion(dup);
    setQuestions(getStoredQuestions());
    triggerNotification('Question duplicated to Local Storage successfully.');
  };

  const handleDeleteQuestion = async (id: string) => {
    const isDbId = !isNaN(Number(id));
    if (isDbId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setQuestions(prev => prev.filter(q => q.id !== id));
          triggerNotification('Question permanently deleted from database.');
          return;
        }
      } catch (err) {
        console.error('Failed to delete from DB:', err);
      }
    }

    deleteStoredQuestion(id);
    setQuestions(getStoredQuestions());
    triggerNotification('Question deleted from Local Storage.');
  };

  // 3. VIDEOS
  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle.trim() || !vidUrl.trim()) return;

    const newV: ChapterVideo = {
      id: `video-${Date.now()}`,
      chapterId: vidChapterId,
      title: vidTitle.trim(),
      url: vidUrl.trim()
    };

    saveVideo(newV);
    setVideos(getStoredVideos());
    
    setVidTitle('');
    setVidUrl('');
    triggerNotification('Chapter conceptual video assigned successfully!');
  };

  // 4. BRANDING MANAGEMENT
  const handleBrandingSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config: BrandingConfig = {
      logoText: bLogoText.trim(),
      logoColor: bLogoColor.trim(),
      heroHeadline: bHeadline.trim(),
      heroSubheadline: bSubhead.trim(),
      heroBannerUrl: bBannerUrl.trim(),
      logoUrl: bLogoUrl.trim(),
      youtubePlaylistUrl: bPlaylistUrl.trim()
    };

    saveBrandingConfig(config);
    onRefreshBranding(); // reload top parent branding
    triggerNotification('Study Yatra application branding assets updated successfully!');
  };

  // 5. DOUBT RESOLVE
  const handleDoubtReplySubmit = async (id: string) => {
    const text = adminReplyText[id];
    const videoUrl = adminReplyVideoUrl[id] || '';
    if (!text || !text.trim()) return;

    replyToDoubt(id, text.trim(), videoUrl.trim() || undefined);
    
    try {
      const token = await getAuthToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/doubts/${id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            replyText: text.trim(),
            replyVideoUrl: videoUrl.trim() || null
          })
        });
      }
    } catch (err) {
      console.error('Failed to reply to doubt in db:', err);
    }

    loadAllAdminData();
    
    // reset draft
    setAdminReplyText(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setAdminReplyVideoUrl(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    triggerNotification('Solution reply with video solver submitted to student workspace.');
  };

  // 6. BOOKING RESOLVE
  const handleApproveBooking = (id: string) => {
    updateBookingStatus(id, 'Approved');
    setBookings(getStoredBookings());
    triggerNotification('Mentorship demo booking pre-authorized and approved! OTP is dispatched.');
  };

  const handleCompleteBooking = (id: string) => {
    updateBookingStatus(id, 'Completed');
    setBookings(getStoredBookings());
    triggerNotification('Live mentorship tutorial class marked completed across files.');
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  // Render RBAC Guard if not labeled Admin
  if (user.role !== 'Admin') {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 font-sans text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-3xl mx-auto shadow-md">
          <ShieldAlert className="h-10 w-10 text-purple-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-poppins text-slate-800 dark:text-white">Admin Privileges Required</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Aap abhi <strong>Student Perspective</strong> se website view kar rahe ho. Admin control panel ko explore karne ke liye:
          </p>
        </div>

        {/* Quick helper switch action */}
        <div className="p-4 bg-purple-50/50 dark:bg-slate-900 border border-purple-200/50 dark:border-purple-800 rounded-2xl text-xs space-y-3 leading-normal">
          <p className="text-purple-800 dark:text-purple-300 font-semibold">
            🚀 Screen ke sabse upar, Navbar me right corner me <strong className="bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded ml-1">Role: Student</strong> button coordinate toggle click karein!
          </p>
          <p className="text-slate-400">
            Switching roles dynamically swaps database visibility between Students testing practice class rooms and Teachers managing exam curriculum CSVs.
          </p>
        </div>
      </div>
    );
  }

  // Searched real users (client-side filter on top of loaded admin users)
  const searchedRealUsers = adminUsersList.filter(u =>
    (u.name || '').toLowerCase().includes(userSearchText.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchText.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-205 dark:border-slate-800 pb-4 gap-4">
        <div className="text-left">
          <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider font-poppins">
            🛡️ ROLE: SYSTEM ADMINISTRATOR CONTROL SUITE
          </span>
          <h2 className="text-3xl font-extrabold font-poppins text-slate-900 dark:text-white mt-1">Study Yatra System Management</h2>
        </div>

        {/* Sub Navigation Bar of Admin */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'analytics', label: 'Platform Stats', icon: BarChart },
            { id: 'questions', label: 'PYQ Upload', icon: Upload },
            { id: 'users', label: 'User Ledger', icon: Users },
            { id: 'chapter-images', label: 'Chapter Images', icon: BookOpen },
            { id: 'videos', label: 'Videos Curator', icon: Video },
            { id: 'doubts', label: 'Doubt Inbox', icon: HelpCircle },
            { id: 'mentorship', label: 'Guidance slots', icon: ShieldCheck },
            { id: 'branding', label: 'Home Branding', icon: Settings },
            { id: 'daily-dose', label: 'Daily Dose Spec', icon: Sparkles },
            { id: 'lectures', label: 'Lecture Management', icon: Tv },
            { id: 'sample-papers', label: 'Sample Papers', icon: FileText }
          ].map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.id}
                id={`admin-tab-${sub.id}`}
                onClick={() => setActiveSubTab(sub.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === sub.id
                    ? 'bg-purple-600 text-white shadow-sm font-semibold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {notification && (
        <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border border-purple-250 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm animate-fade-in text-left">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SUB-TABS VIEWER PANELS */}

      {/* A. ANALYTICS PRESETS PANEL */}
      {activeSubTab === 'analytics' && (
        <div id="sub-panel-analytics" className="space-y-6 animate-slide-up">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Daily Active Users</span>
              <p className="text-3xl font-mono font-black text-slate-800 dark:text-white mt-1">
                {loadingPlatformStats || !platformStats ? '—' : platformStats.dailyActiveUsers.toLocaleString()}
              </p>
              <div className="flex items-center text-[10px] text-emerald-500 font-semibold mt-2">
                <span>Distinct users active in last 24h</span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Monthly Active Users</span>
              <p className="text-3xl font-mono font-black text-slate-800 dark:text-white mt-1">
                {loadingPlatformStats || !platformStats ? '—' : platformStats.monthlyActiveUsers.toLocaleString()}
              </p>
              <div className="flex items-center text-[10px] text-emerald-500 font-semibold mt-2">
                <span>Distinct users active in last 30 days</span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Questions Solved Today</span>
              <p className="text-3xl font-mono font-black text-slate-800 dark:text-white mt-1">
                {loadingPlatformStats || !platformStats ? '—' : platformStats.questionsSolvedToday.toLocaleString()}
              </p>
              <div className="flex items-center text-[10px] text-blue-500 font-semibold mt-2">
                <span>Core classroom practicing metrics</span>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl shadow-md text-left">
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest block font-poppins">Premium Revenue</span>
              <p className="text-3xl font-mono font-black mt-1">
                ₹{loadingPlatformStats || !platformStats ? '—' : platformStats.premiumRevenue.toLocaleString()}
              </p>
              <div className="flex items-center text-[10px] text-amber-300 font-semibold mt-2">
                <span>Sum of paid Razorpay transactions</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top chapters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-4">
              <h3 className="text-sm font-bold font-poppins uppercase tracking-wider text-slate-500">Top Chapter Practices:</h3>
              <div className="space-y-3">
                {topChapters.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No attempt data recorded yet.</p>
                ) : (
                  topChapters.map((tc, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{tc.chapter}</span>
                        <span className="text-[10px] text-slate-450 block font-mono">{tc.subject}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{tc.count.toLocaleString()} attempts</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top subjects */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-4">
              <h3 className="text-sm font-bold font-poppins uppercase tracking-wider text-slate-500">Top Subjects:</h3>
              <div className="space-y-3">
                {topSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No attempt data recorded yet.</p>
                ) : (
                  topSubjects.map((tc, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{tc.subject}</span>
                        <span>{tc.percentage}% volume</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${i === 0 ? 'bg-purple-600' : 'bg-blue-500'}`}
                          style={{ width: `${tc.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Year Range Settings */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-poppins uppercase tracking-wider text-slate-500">Year Range Settings</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Live min/max PYQ years pulled directly from Cloud SQL PostgreSQL — no hardcoded ranges.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={yearStatsExamFilter}
                  onChange={(e) => setYearStatsExamFilter(e.target.value)}
                  className="p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-220 dark:border-slate-800 rounded-lg font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="All">All Exam Types</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="CBSE">CBSE</option>
                </select>
                <button
                  onClick={loadYearStats}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 rounded-lg transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingYearStats ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Live Earliest Year</span>
                <p className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">{yearStatsMin ?? '—'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-poppins">Live Latest Year</span>
                <p className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">{yearStatsMax ?? '—'}</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest font-poppins">Custom Year Range (shown to students)</span>
                {yearOverride ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold uppercase">Override Active</span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-150 text-slate-500 font-bold uppercase">Using Live DB Range</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Min Year</span>
                  <input
                    type="number"
                    value={yearOverrideMinInput}
                    onChange={(e) => setYearOverrideMinInput(e.target.value)}
                    placeholder={yearStatsMin !== null ? String(yearStatsMin) : 'e.g. 2019'}
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-800 rounded-lg font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Max Year</span>
                  <input
                    type="number"
                    value={yearOverrideMaxInput}
                    onChange={(e) => setYearOverrideMaxInput(e.target.value)}
                    placeholder={yearStatsMax !== null ? String(yearStatsMax) : 'e.g. 2026'}
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-800 rounded-lg font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Once saved, students will see this exact range instead of the live database range everywhere the PYQ year range is displayed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleResetYearOverride}
                  disabled={savingYearOverride}
                  className="px-3 py-1.5 bg-slate-150 hover:bg-slate-205 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Reset to Live DB Range
                </button>
                <button
                  onClick={handleSaveYearOverride}
                  disabled={savingYearOverride}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingYearOverride ? 'Saving...' : 'Save Custom Range'}
                </button>
              </div>
            </div>

            {loadingYearStats ? (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-500 animate-spin" />
                <span className="text-[10px] text-slate-400 mt-2 font-mono">Querying question years...</span>
              </div>
            ) : yearStats.length === 0 ? (
              <p className="py-4 text-slate-400 text-center text-xs font-medium italic">No questions found in the database yet for this filter.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {yearStats.map((y) => (
                  <div key={y.year} className="flex justify-between items-center py-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{y.year}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">{y.count} question{y.count === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* B. PYQ SINGLE AND CSV BULK UPLOAD */}
      {activeSubTab === 'questions' && (
        <div id="sub-panel-questions" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up text-left">
          
          {/* PREMIUM CSV & AI PDF IMPORT PORTAL (Widescreen 12-col layout) */}
          <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-poppins">
                  ⚡ INSTANT ACADEMIC LOAD ENGINE
                </span>
                <h3 className="text-xl font-black font-poppins">PYQ Bulk Import & Extraction Portal</h3>
              </div>

              {/* Toggle Modes Control tab header */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/40 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setImportMode('csv')}
                  className={`px-4 py-2 text-xs font-bold font-poppins rounded-xl transition-all cursor-pointer ${
                    importMode === 'csv'
                      ? 'bg-white dark:bg-slate-900 text-purple-650 dark:text-purple-400 shadow-sm'
                      : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  CSV Import System
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('pdf')}
                  className={`px-4 py-2 text-xs font-bold font-poppins rounded-xl transition-all cursor-pointer ${
                    importMode === 'pdf'
                      ? 'bg-white dark:bg-slate-900 text-purple-650 dark:text-purple-400 shadow-sm'
                      : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  AI PDF Extraction
                </button>
              </div>
            </div>

            {/* PROGRESS BAR INDICATOR FOR DB COMMITS */}
            {importProgress !== null && (
              <div className="space-y-2 p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/30 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-bold text-purple-600 dark:text-purple-400 font-poppins">
                  <span>Saving questions to Cloud SQL PostgreSQL...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                </div>
              </div>
            )}

            {/* MODE 1: CSV IMPORT SYSTEM */}
            {importMode === 'csv' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-450 leading-relaxed">
                      Upload your Excel or CSV syllabus spreadsheets directly. Ensure columns are structured according to Study Yatra PYQ boundaries:<br/>
                      <span className="font-mono bg-slate-50 dark:bg-slate-950 p-1.5 rounded block text-[10px] text-purple-600 dark:text-purple-400 mt-2 line-clamp-2">
                        exam_type, class_level, subject, chapter, year, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty
                      </span>
                    </p>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={downloadSampleCSV}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                        <span>Download Sample CSV</span>
                      </button>

                      <label className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold cursor-pointer border border-purple-200/50">
                        <Upload className="h-4 w-4" />
                        <span>Browse / Upload CSV</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-2 text-left">
                      <span className="text-xs font-bold text-slate-400 uppercase">Or Paste raw CSV Rows:</span>
                      <textarea
                        rows={5}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder='JEE,Class 12,Physics,Electrostatics,2024,"What is electric charge?",Positive,Negative,Neutral,All,D,"Explanation notes",Easy'
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 dark:border-slate-800 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => analyzeCSVData(csvText)}
                        disabled={isParsing || !csvText.trim()}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                      >
                        {isParsing ? 'Analyzing spreadsheet rows...' : 'Verify & Parse Text'}
                      </button>
                    </div>
                  </div>

                  {/* CSV ANALYSIS SUMMARY VIEW */}
                  {csvPreview && (
                    <div className="bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-200 dark:border-slate-850 space-y-4 animate-fade-in text-left">
                      <h4 className="text-sm font-bold font-poppins text-slate-800 dark:text-slate-200">CSV Validation Preview</h4>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Found</span>
                          <span className="text-lg font-black font-mono text-slate-800 dark:text-white">{csvPreview.total}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-[9px] uppercase font-bold text-emerald-500 block">Valid</span>
                          <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{csvPreview.valid}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 text-center">
                          <span className="text-[9px] uppercase font-bold text-red-500 block">Invalid</span>
                          <span className="text-lg font-black font-mono text-red-650 dark:text-red-400">{csvPreview.invalid}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Previewing First 10 questions:</span>
                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 space-y-2 text-xs">
                          {csvPreview.questions.slice(0, 10).map((q, idx) => (
                            <div key={idx} className="pt-2 text-[11px] font-sans">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Q{idx + 1}: {q.questionText}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${q.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-105 text-red-700'}`}>
                                  {q.isValid ? 'Valid' : 'Invalid'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-450 mt-1 uppercase font-mono">
                                {q.examType} • {q.classLevel} • {q.subject} • {q.chapter}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-2 border-t border-slate-200/50 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCsvPreview(null)}
                          className="px-4 py-2 text-xs bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={commitCSVImport}
                          disabled={csvPreview.valid === 0}
                          className="px-5 py-2 text-xs bg-purple-650 hover:bg-purple-750 text-white font-black rounded-xl shadow-md"
                        >
                          Import All ({csvPreview.valid} Questions)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: AI PDF MCQ EXTRACTION */}
            {importMode === 'pdf' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-3xl text-center bg-purple-50/5 dark:bg-purple-950/5 relative">
                    <Upload className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-poppins">Upload Class Study Materials & Exam PDFs</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-md mx-auto">
                      AI System auto extracts all MCQ questions, recommended subjects, difficulty level multipliers, and guesses correct chapters!
                    </p>

                    <div className="mt-4 flex justify-center">
                      <label className="px-4 py-2.5 bg-purple-650 dark:bg-purple-800 hover:bg-purple-750 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm">
                        <span>{pdfFile ? `Selected: ${pdfFile.name}` : 'Select PDF Document'}</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePDFChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {pdfFile && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handlePDFProcess}
                        disabled={isProcessingPdf}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-750 active:bg-purple-800 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center space-x-2"
                      >
                        {isProcessingPdf ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Gemini Reading PDF Pages & Structuring...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Process with Gemini (Extract MCQs)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* PDF REVIEW SCREEN */}
                  {pdfQuestions.length > 0 && (
                    <div className="space-y-6 text-left border-t border-slate-100 dark:border-slate-800 pt-6">
                      
                      {/* HEADER AND COMMIT */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl gap-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase font-poppins tracking-wider">Review AI Extracted Questions</h4>
                          <span className="text-[10px] text-purple-650 font-bold uppercase font-poppins">Ready to process: {pdfQuestions.length} Pyqs matching categories</span>
                        </div>
                        <button
                          type="button"
                          onClick={commitPDFQuestions}
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-650 to-indigo-600 hover:from-purple-750 hover:to-indigo-705 font-black text-xs text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                          Commit Verified Extracts to Central DB ({pdfQuestions.length} Items)
                        </button>
                      </div>

                      {/* PDF REPORT CARD */}
                      {pdfReport && (
                        <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-150 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-slate-850 dark:text-slate-150 font-poppins uppercase tracking-wider">📊 AI PDF Question Extraction Audit Summary</h4>
                            <button 
                              onClick={() => setPdfReport(null)}
                              className="text-[11px] text-slate-400 hover:text-slate-600 font-bold transition"
                            >
                              ✕ Close Report
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase font-poppins">Total Extracted</span>
                              <span className="text-[15px] font-black text-slate-800 dark:text-slate-100">{pdfReport.totalExtracted}</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-emerald-600 dark:text-emerald-400">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase font-poppins">With Explanation</span>
                              <span className="text-[15px] font-black">{pdfReport.withExplanations}</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-amber-500 dark:text-amber-400">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase font-poppins">No Explanation</span>
                              <span className="text-[15px] font-black">{pdfReport.withoutExplanations}</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-sky-650 dark:text-sky-400">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase font-poppins">Successfully Mapped</span>
                              <span className="text-[15px] font-black">{pdfReport.successfullyMapped}</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-purple-650 dark:text-purple-400">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase font-poppins font-poppins uppercase">Saved To DB</span>
                              <span className="text-[15px] font-black">{pdfReport.savedToDb}</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-rose-500 dark:text-rose-400 animate-pulse">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase font-poppins">Failed Records</span>
                              <span className="text-[15px] font-black">{pdfReport.failedRecords}</span>
                            </div>
                          </div>

                          {pdfReport.errors && pdfReport.errors.length > 0 && (
                            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-200 dark:border-rose-900/30 rounded-xl space-y-1">
                              <h5 className="text-[10px] font-black uppercase font-poppins">Required Validations Pending Before Database Write:</h5>
                              <ul className="text-[11px] list-disc list-inside space-y-0.5 max-h-40 overflow-y-auto font-medium">
                                {pdfReport.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* BULK ASSIGNMENT UTILITY MODULE */}
                      <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 p-5 rounded-2xl space-y-3.5">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-purple-650" />
                          <h5 className="text-xs font-black text-purple-950 dark:text-purple-300 font-poppins uppercase tracking-wider">Bulk Assignment Tool</h5>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          Force align all extracted questions to target subjects, exams, chapters, and attempt sessions instantly before central save.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                          {/* Bulk Exam */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Type:</span>
                            <select 
                              value={bulkExam} 
                              onChange={(e) => {
                                const val = e.target.value as Exam;
                                setBulkExam(val);
                                if (val === 'JEE') setBulkSession('January');
                                else if (val === 'NEET') setBulkSession('NEET');
                                else setBulkSession('CBSE');
                              }} 
                              className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-200 font-semibold"
                            >
                              <option value="JEE">JEE</option>
                              <option value="NEET">NEET</option>
                              <option value="CBSE">CBSE</option>
                            </select>
                          </div>

                          {/* Bulk Class */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Class Level:</span>
                            <select 
                              value={bulkClass} 
                              onChange={(e) => setBulkClass(e.target.value as AcademicLevel)} 
                              className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-200 font-semibold"
                            >
                              <option value="Class 11">Class 11</option>
                              <option value="Class 12">Class 12</option>
                              <option value="Dropper">Dropper</option>
                            </select>
                          </div>

                          {/* Bulk Subject */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Subject:</span>
                            <select 
                              value={bulkSubject} 
                              onChange={(e) => setBulkSubject(e.target.value as Subject)} 
                              className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-200 font-semibold"
                            >
                              <option value="Physics">Physics</option>
                              <option value="Chemistry">Chemistry</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Botany">Botany</option>
                              <option value="Zoology">Zoology</option>
                              <option value="Biology">Biology</option>
                            </select>
                          </div>

                          {/* Bulk Chapter */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Chapter Topic:</span>
                            <select 
                              value={bulkChapter} 
                              onChange={(e) => setBulkChapter(e.target.value)} 
                              className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-200 font-semibold"
                            >
                              <option value="">-- Choose Chapter --</option>
                              {chapters.map(ch => (
                                <option key={ch.id} value={ch.name}>{ch.name} ({ch.exam} • {ch.subject})</option>
                              ))}
                            </select>
                          </div>

                          {/* Bulk Year */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Year:</span>
                            <input 
                              type="text" 
                              value={bulkYear} 
                              onChange={(e) => setBulkYear(e.target.value)} 
                              className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-200 font-semibold" 
                              placeholder="2024"
                            />
                          </div>

                          {/* Bulk Session */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Session:</span>
                            <select 
                              value={bulkSession} 
                              onChange={(e) => setBulkSession(e.target.value)} 
                              className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-200 font-semibold"
                            >
                              {bulkExam === 'JEE' ? (
                                <>
                                  <option value="January">January</option>
                                  <option value="April">April</option>
                                  <option value="All">All Attempts</option>
                                </>
                              ) : bulkExam === 'NEET' ? (
                                <option value="NEET">NEET</option>
                              ) : (
                                <option value="CBSE">CBSE</option>
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={applyBulkAssignmentToPDFQuestions}
                            className="px-4 py-2 bg-purple-650 hover:bg-purple-750 font-bold text-[11px] text-white rounded-xl shadow transition-all cursor-pointer"
                          >
                            Assign Parameters to all {pdfQuestions.length} Questions
                          </button>
                        </div>
                      </div>

                      {/* INDIVIDUAL QUESTIONS ADJUSTMENT ROWS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pdfQuestions.map((pq, idx) => (
                          <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5 shadow-sm relative transition-all hover:shadow-md">
                            
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="text-[11px] font-black text-purple-650 uppercase font-poppins">MCQ Question {idx + 1}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${pq.explanation ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' : 'bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400'}`}>
                                {pq.explanation ? '✅ Has Explanation' : '⚠️ No Solution Explanation'}
                              </span>
                            </div>

                            {/* Question Body */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-450 uppercase">Question Body:</span>
                              <textarea
                                value={pq.questionText}
                                onChange={(e) => {
                                  const updated = [...pdfQuestions];
                                  updated[idx].questionText = e.target.value;
                                  setPdfQuestions(updated);
                                }}
                                className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                rows={2}
                              />
                            </div>

                            {/* Options A, B, C, D */}
                            <div className="grid grid-cols-2 gap-2">
                              {['A', 'B', 'C', 'D'].map((opt) => (
                                <div key={opt} className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Option {opt}:</span>
                                  <input
                                    type="text"
                                    value={pq[`option${opt}`] || pq[`option_${opt.toLowerCase()}`] || ''}
                                    onChange={(e) => {
                                      const updated = [...pdfQuestions];
                                      updated[idx][`option${opt}`] = e.target.value;
                                      setPdfQuestions(updated);
                                    }}
                                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Parameters row */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-150/40 dark:border-slate-800/40">
                              
                              {/* Exam Code */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Type:</span>
                                <select
                                  value={pq.examType}
                                  onChange={(e) => {
                                    const val = e.target.value as Exam;
                                    const updated = [...pdfQuestions];
                                    updated[idx].examType = val;
                                    if (val === 'JEE') updated[idx].session = 'January';
                                    else if (val === 'NEET') updated[idx].session = 'NEET';
                                    else updated[idx].session = 'CBSE';
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                >
                                  <option value="JEE">JEE</option>
                                  <option value="NEET">NEET</option>
                                  <option value="CBSE">CBSE</option>
                                </select>
                              </div>

                              {/* Class Standard */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Class Level:</span>
                                <select
                                  value={pq.classLevel}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].classLevel = e.target.value;
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                >
                                  <option value="Class 11">Class 11</option>
                                  <option value="Class 12">Class 12</option>
                                  <option value="Dropper">Dropper</option>
                                </select>
                              </div>

                              {/* Specific subject */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Subject:</span>
                                <select
                                  value={pq.subject}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].subject = e.target.value;
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                >
                                  <option value="Physics">Physics</option>
                                  <option value="Chemistry">Chemistry</option>
                                  <option value="Mathematics">Mathematics</option>
                                  <option value="Botany">Botany</option>
                                  <option value="Zoology">Zoology</option>
                                  <option value="Biology">Biology</option>
                                </select>
                              </div>

                              {/* Target session */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Session:</span>
                                <select
                                  value={pq.session || ''}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].session = e.target.value;
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                                >
                                  {pq.examType === 'JEE' ? (
                                    <>
                                      <option value="January">January</option>
                                      <option value="April">April</option>
                                      <option value="All">All Attempts</option>
                                    </>
                                  ) : pq.examType === 'NEET' ? (
                                    <option value="NEET">NEET</option>
                                  ) : (
                                    <option value="CBSE">CBSE</option>
                                  )}
                                </select>
                              </div>

                              {/* Year index */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Year:</span>
                                <input
                                  type="text"
                                  value={pq.year || ''}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].year = e.target.value;
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                                  placeholder="2024"
                                />
                              </div>

                              {/* Answer index */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Correct answer:</span>
                                <select
                                  value={pq.correctAnswer}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].correctAnswer = e.target.value;
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-purple-650"
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                              </div>
                            </div>

                            {/* Chapter dropdown aligning */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div className="space-y-1 text-left">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Chapter Slot Mapping:</span>
                                  {!chapters.some(ch => ch.name.toLowerCase() === (pq.chapter || '').toLowerCase()) && (
                                    <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">⚠️ Mismatch</span>
                                  )}
                                </div>
                                <select
                                  value={pq.chapter || ''}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].chapter = e.target.value;
                                    const matchingCh = chapters.find(ch => ch.name.toLowerCase() === e.target.value.toLowerCase());
                                    if (matchingCh) {
                                      updated[idx].examType = matchingCh.exam;
                                      updated[idx].subject = matchingCh.subject;
                                      updated[idx].classLevel = matchingCh.level;
                                    }
                                    setPdfQuestions(updated);
                                  }}
                                  className={`w-full p-2 text-xs bg-slate-50 dark:bg-slate-950 border rounded-xl font-medium ${
                                    chapters.some(ch => ch.name.toLowerCase() === (pq.chapter || '').toLowerCase())
                                      ? "border-slate-200 dark:border-slate-800"
                                      : "border-red-300 focus:border-red-500 text-red-700 bg-red-50/20"
                                  }`}
                                >
                                  <option value="">-- Choose Chapter --</option>
                                  {chapters.map(ch => (
                                    <option key={ch.id} value={ch.name}>{ch.name} ({ch.exam} • {ch.subject})</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Difficulty:</span>
                                <select
                                  value={pq.difficulty || 'Medium'}
                                  onChange={(e) => {
                                    const updated = [...pdfQuestions];
                                    updated[idx].difficulty = e.target.value;
                                    setPdfQuestions(updated);
                                  }}
                                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                >
                                  <option value="Easy">Easy</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Hard">Hard</option>
                                </select>
                              </div>
                            </div>

                            {/* Explanation body */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-450 uppercase">Explanation Text (Store NULL if empty):</span>
                              <textarea
                                value={pq.explanation || ''}
                                onChange={(e) => {
                                  const updated = [...pdfQuestions];
                                  updated[idx].explanation = e.target.value;
                                  setPdfQuestions(updated);
                                }}
                                className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                                rows={2}
                                placeholder="Extracted explanation, or leave completely blank to save as NULL."
                              />
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...pdfQuestions];
                                  updated.splice(idx, 1);
                                  setPdfQuestions(updated);
                                }}
                                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase transition"
                              >
                                ✕ Delete Extract Question
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual question insertion card (Grid 8) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-bold font-poppins">Insert Question manually</h3>
            </div>
            
            <form onSubmit={handleManualQuestionSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Exam */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Exam Type:</span>
                <select 
                  value={qExam} 
                  onChange={(e) => setQExam(e.target.value as Exam)} 
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-220 rounded-xl font-semibold focus:outline-none"
                >
                  <option value="JEE">JEE Main</option>
                  <option value="NEET">NEET Entrance</option>
                  <option value="CBSE">CBSE Boards</option>
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Subject:</span>
                <select 
                  value={qSubject} 
                  onChange={(e) => setQSubject(e.target.value as Subject)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-220 rounded-xl font-semibold focus:outline-none"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                  <option value="Botany">Botany (NEET)</option>
                  <option value="Zoology">Zoology (NEET)</option>
                </select>
              </div>

              {/* Assigned Chapter ID */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Assign to Chapter Topic:</span>
                <select
                  value={qChapterId}
                  onChange={(e) => setQChapterId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-220 rounded-xl font-semibold focus:outline-none"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      [{ch.exam}] ({ch.level}) - {ch.subject} : {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year & Difficulty */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">PYQ Exam Year:</span>
                <input
                  type="number"
                  value={qYear}
                  onChange={(e) => setQYear(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Exact Exam Date (optional):</span>
                <input
                  type="date"
                  value={qExamDate}
                  onChange={(e) => setQExamDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-220 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Difficulty:</span>
                <select
                  value={qDiff}
                  onChange={(e) => setQDiff(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-220 rounded-xl font-semibold"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Question Text */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Question Text formula:</span>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Find the acceleration value of a pulley block constant..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-220 rounded-xl"
                />
              </div>

              {/* Options */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-405 uppercase">Option A:</span>
                <input 
                  type="text" 
                  value={qOptA} 
                  onChange={(e) => setQOptA(e.target.value)} 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-405 uppercase">Option B:</span>
                <input 
                  type="text" 
                  value={qOptB} 
                  onChange={(e) => setQOptB(e.target.value)} 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-405 uppercase">Option C:</span>
                <input 
                  type="text" 
                  value={qOptC} 
                  onChange={(e) => setQOptC(e.target.value)} 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-405 uppercase">Option D:</span>
                <input 
                  type="text" 
                  value={qOptD} 
                  onChange={(e) => setQOptD(e.target.value)} 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              {/* Correct key */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Correct key:</span>
                <select 
                  value={qCorrect} 
                  onChange={(e) => setQCorrect(e.target.value as 'A' | 'B' | 'C' | 'D')}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl font-bold"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              {/* Concept tags */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Concept Heading:</span>
                <input 
                  type="text" 
                  value={qConcept} 
                  onChange={(e) => setQConcept(e.target.value)} 
                  placeholder="e.g. Laws of motion / Friction equations"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              {/* Exp */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Detailed Solution Explanation:</span>
                <textarea
                  rows={2}
                  value={qExp}
                  onChange={(e) => setQExp(e.target.value)}
                  placeholder="Step-by-step formula derivation..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              {/* Image url */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Conceptual diagram URL (Optional):</span>
                <input 
                  type="text" 
                  value={qImgUrl} 
                  onChange={(e) => setQImgUrl(e.target.value)} 
                  placeholder="Http diagram url"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs text-slate-800 dark:text-slate-200 border-slate-220 rounded-xl"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl"
                >
                  Submit Question manual
                </button>
              </div>

            </form>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-extrabold pb-3 text-slate-800 dark:text-white">Active Question entries in database ({questions.length})</h4>
              
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {questions.map((q) => (
                  <div key={q.id} className="py-2.5 flex justify-between items-center flex-wrap gap-2">
                    <div className="max-w-md truncate pr-4">
                      <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[9px] font-mono mr-2">[{q.id}]</span>
                      <strong className="text-slate-400">[{q.examType} {q.year}]</strong> {q.questionText}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-1 hover:text-blue-500 hover:bg-slate-100 rounded" 
                        title="Duplicate query"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 hover:text-red-500 hover:bg-slate-100 rounded" 
                        title="Delete query"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* C. USER MANAGEMENT WORKBENCH */}
      {activeSubTab === 'users' && (
        <div id="sub-panel-users" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 animate-slide-up">
          <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold font-poppins">Student Ledger Profiles</h3>
              <p className="text-xs text-slate-400">Toggle Premium privileges instantly. Live from PostgreSQL.</p>
            </div>

            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                placeholder="Search user..."
                className="pl-8 pr-3 py-1.5 w-full text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-220 rounded-xl"
              />
            </div>
          </div>

          {loadingAdminUsers ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <RefreshCw className="h-5 w-5 text-purple-500 animate-spin" />
              <span className="text-[10px] text-slate-400 mt-2 font-mono">Querying users table...</span>
            </div>
          ) : searchedRealUsers.length === 0 ? (
            <p className="py-6 text-slate-400 text-center text-xs font-medium italic">No matching users found in the database.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-805 text-xs">
              {searchedRealUsers.map((su) => (
                <div key={su.uid} className="py-3 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      {(su.name || '?')[0]}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{su.name}</span>
                      <span className="text-[10px] text-slate-500 block">{su.email}</span>
                      <span className="text-[10px] text-slate-500">
                        Exam: {su.targetExam} • Class: {su.classLevel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {su.plan === 'Premium' ? (
                      <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full inline-flex items-center">
                        ⭐ PREMIUM
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 text-[9px] px-2.5 py-0.5 rounded-full">
                        Free User
                      </span>
                    )}

                    <div className="flex items-center space-x-1.5">
                      {su.plan === 'Premium' ? (
                        <button
                          onClick={() => handleDowngradeRealUser(su.uid, su.name)}
                          className="px-2.5 py-1 bg-slate-150 hover:bg-slate-205 text-slate-800 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px]"
                        >
                          Downgrade
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgradeRealUser(su.uid, su.name)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px]"
                        >
                          Upgrade Premium
                        </button>
                      )}

                      <button
                        disabled
                        title="Suspend is scoped out until a status column is added to the users table"
                        className="px-2.5 py-1 bg-red-650/40 text-white/70 rounded text-[10px] cursor-not-allowed"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* D. VIDEO ASSIGNMENTS WORKROOM */}
      {activeSubTab === 'videos' && (
        <div id="sub-panel-videos" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up text-left">
          
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-red-500" />
              <h3 className="text-base font-bold font-poppins">Assign Conceptual Video</h3>
            </div>
            
            <form onSubmit={handleVideoSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-450 uppercase">Select Destination Chapter:</span>
                <select
                  value={vidChapterId}
                  onChange={(e) => setVidChapterId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      [{ch.exam}] {ch.subject} : {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-450 uppercase">Video Title (Hindi-English):</span>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="e.g. Electrostatics One-Shot Pyq series"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs border-slate-220 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-450 uppercase">YouTube Link Embed URL:</span>
                <input
                  type="text"
                  required
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border text-xs border-slate-220 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Upload & Assign Video
              </button>

            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-poppins">Assigned videos catalog ({videos.length})</h3>
            
            <div className="divide-y divide-slate-105 dark:divide-slate-805 text-xs">
              {videos.map((v) => {
                const relativeCh = chapters.find(c => c.id === v.chapterId);
                return (
                  <div key={v.id} className="py-3 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>{v.title}</span>
                      <span className="text-[10px] text-red-600">Active</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Destination Chapter: <strong className="text-blue-500">{relativeCh ? relativeCh.name : v.chapterId}</strong>
                    </p>
                    <span className="text-[9px] text-slate-450 font-mono italic block">{v.url}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* E. DOUBT INBOX MANAGER */}
      {activeSubTab === 'doubts' && (
        <div id="sub-panel-doubts" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl p-6 text-left space-y-4 animate-slide-up">
          <h3 className="text-base font-bold font-poppins">Doubt Inbox (Teacher Desk)</h3>
          <p className="text-xs text-slate-400">Review student questions, examine equations photographs, and submit solutions replies.</p>

          <div className="space-y-6">
            {doubts.filter(d => d.status === 'Pending').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs text-slate-500 font-medium">
                Sare doubts answers ho gaye! No pending questions in inbox right now.
              </div>
            ) : (
              doubts.filter(d => d.status === 'Pending').map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 text-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600 uppercase">{d.subject} Doubt</span>
                    <span className="text-slate-400 font-mono">{new Date(d.timestamp).toLocaleString()}</span>
                  </div>

                  <p className="text-slate-800 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                    Student <strong>{d.studentName}</strong> asked:<br />
                    "{d.doubtText}"
                  </p>

                  {d.imageUrl && (
                    <div className="max-w-2xl border bg-black border-slate-200 rounded-xl overflow-hidden">
                      <img src={d.imageUrl} alt="Equation document" referrerPolicy="no-referrer" className="h-40 object-contain mx-auto" />
                    </div>
                  )}

                  {/* Submission text reply */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Step-by-step Explanation:</label>
                      <textarea
                        rows={3}
                        value={adminReplyText[d.id] || ''}
                        onChange={(e) => setAdminReplyText(prev => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="Write your beautiful step-by-step master solution explanation..."
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border text-slate-800 border-slate-220 rounded-xl placeholder:text-slate-400 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Doubt Solver Video URL (Optional):</label>
                      <input
                        type="url"
                        value={adminReplyVideoUrl[d.id] || ''}
                        onChange={(e) => setAdminReplyVideoUrl(prev => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ (acts as a video solver for student)"
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border text-slate-800 border-slate-220 rounded-xl placeholder:text-slate-400 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleDoubtReplySubmit(d.id)}
                      disabled={!adminReplyText[d.id]?.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold font-poppins transition-colors duration-150 cursor-pointer"
                    >
                      Submit Response & Video Solver
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* F. MENTORSHIP GUIDANCE BOOKINGS */}
      {activeSubTab === 'mentorship' && (
        <div id="sub-panel-mentorship" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl p-6 text-left space-y-4 animate-slide-up">
          <h3 className="text-base font-bold font-poppins">Mentorship Slottings and Payments</h3>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-805 text-xs">
            {bookings.map((b) => (
              <div key={b.id} className="py-4 flex flex-wrap justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white capitalize block">
                    {b.studentName} • Subject: <strong className="text-blue-500">{b.subject}</strong>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    Target: {b.exam} {b.level} • Contact: {b.contactNumber}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Slot Time: {b.preferredTime} • Price: {b.type} ({b.amount === 0 ? 'FREE' : `₹${b.amount}`})
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    b.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {b.paid ? 'PAID CONFIRMED' : 'UNPAID'}
                  </span>

                  {b.status === 'Pending' && (
                    <button
                      onClick={() => handleApproveBooking(b.id)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-750 text-white rounded text-[10px]"
                    >
                      Approve & send Slot Link
                    </button>
                  )}

                  {b.status === 'Approved' && (
                    <button
                      onClick={() => handleCompleteBooking(b.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px]"
                    >
                      Mark Complete
                    </button>
                  )}

                  {b.status === 'Completed' && (
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded text-[10px] font-bold block">
                      ARCHIVED DONE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* G. HOME BRANDING CONFIGS */}
      {activeSubTab === 'branding' && (
        <div id="sub-panel-branding" className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 text-left max-w-2xl mx-auto space-y-6 animate-slide-up">
          <h3 className="text-base font-bold font-poppins">Branding customizer panel</h3>
          <p className="text-xs text-slate-400">Modify dynamic text headlines or accent colors live across Navbar, Footer, and Landing Hero cards.</p>

          <form onSubmit={handleBrandingSave} className="space-y-4 text-xs font-semibold">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-1">
                <span className="text-slate-400 uppercase">Logo Brand Text:</span>
                <input
                  type="text"
                  value={bLogoText}
                  onChange={(e) => setBLogoText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <span className="text-slate-400 uppercase">Logo Accent Hex:</span>
                <input
                  type="text"
                  value={bLogoColor}
                  onChange={(e) => setBLogoColor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <span className="text-slate-400 uppercase">Logo Image Preview:</span>
                <div className="flex gap-2 items-center p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0 flex items-center justify-center border border-slate-100">
                    <img 
                      src={bLogoUrl || 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg'} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight font-poppins">Live customized active logo icon</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 uppercase block">Official Branding Logo URL:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bLogoUrl}
                  onChange={(e) => setBLogoUrl(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl font-mono"
                />
                <button
                  type="button"
                  onClick={() => setBLogoUrl('https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 transition-all border border-slate-200 dark:border-slate-750"
                >
                  Apply Official Logo
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 uppercase block">Global YouTube Playlist URL (Direct link):</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bPlaylistUrl}
                  onChange={(e) => setBPlaylistUrl(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl font-mono"
                  placeholder="e.g. https://youtube.com/playlist?list=..."
                />
                <button
                  type="button"
                  onClick={() => setBPlaylistUrl('https://youtube.com/playlist?list=PLgr_pCxL9SgBtG3epg2NMy-9X-2aB0xH0')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 transition-all border border-slate-200 dark:border-slate-750"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 uppercase">Hero Headline Text (Lliteral language):</span>
              <textarea
                rows={2}
                value={bHeadline}
                onChange={(e) => setBHeadline(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 uppercase">Hero Subheadline Text:</span>
              <textarea
                rows={2}
                value={bSubhead}
                onChange={(e) => setBSubhead(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 uppercase block">Hero Banner Photograph URL:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bBannerUrl}
                  onChange={(e) => setBBannerUrl(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-220 rounded-xl font-mono"
                />
                <button
                  type="button"
                  onClick={() => setBBannerUrl('https://raw.githubusercontent.com/mradvitiyalive-maker/logo/df96650902274b41a0359109af8e96c4bcd5ca55/barrier%202.png')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 transition-all border border-slate-200 dark:border-slate-750"
                >
                  Apply Official Banner
                </button>
              </div>
              {bBannerUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-28 w-full relative bg-slate-50">
                  <img src={bBannerUrl} alt="Banner Preview" className="w-full h-full object-cover animate-fade-in" />
                  <span className="absolute bottom-1 right-2 bg-slate-900/70 text-[9px] text-white px-1.5 py-0.5 rounded font-mono">Current Banner Preview</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white rounded-xl font-bold text-xs uppercase"
            >
              Commit assets branding changes
            </button>

          </form>
        </div>
      )}

      {/* Chapter Images Custom Tab */}
      {activeSubTab === 'chapter-images' && (
        <div id="sub-panel-chapter-images" className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 text-left space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span>Chapter Card Header Curator</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize photographic card headers for lessons. These apply globally across JEE, NEET, & CBSE curriculum portals.
              </p>
            </div>
            
            <button
              onClick={handleSaveAllChapterImages}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Save All Changes</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Filter class */}
            <div className="space-y-1.5 text-xs font-semibold font-sans">
              <span className="text-slate-500 uppercase tracking-wider block text-[10px]">Class Level</span>
              <select
                value={ciClassFilter}
                onChange={(e) => {
                  setCiClassFilter(e.target.value as any);
                  setCiEditingUrls({}); // Reset temporary editing state when moving between filters
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-300"
              >
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>

            {/* Filter Subject */}
            <div className="space-y-1.5 text-xs font-semibold font-sans">
              <span className="text-slate-500 uppercase tracking-wider block text-[10px]">Course Subject</span>
              <select
                value={ciSubjectFilter}
                onChange={(e) => {
                  setCiSubjectFilter(e.target.value as any);
                  setCiEditingUrls({}); // Reset temporary editing state when moving between filters
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-300"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Botany">Botany</option>
                <option value="Zoology">Zoology</option>
              </select>
            </div>

            {/* Total chapters counter */}
            <div className="flex items-center sm:col-span-2 lg:col-span-1 justify-normal sm:justify-end lg:justify-start pt-1.5 sm:pt-0">
              <div className="px-4 py-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-2xl text-center w-full">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-poppins">Active Chapters Filtered</span>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-poppins">
                  {getChaptersForCuration(ciClassFilter, ciSubjectFilter).length} Lessons
                </p>
              </div>
            </div>
          </div>

          {/* Chapters Table */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">S.No.</th>
                  <th className="px-5 py-4">Chapter Name</th>
                  <th className="px-5 py-4">Header Background Image URL</th>
                  <th className="px-5 py-4 text-center">Thumbnail Preview</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {getChaptersForCuration(ciClassFilter, ciSubjectFilter).map((chName, index) => {
                  const editingUrlValue = getEditingUrl(chName);
                  const isSaving = !!ciSavingRows[chName];
                  
                  return (
                    <tr key={chName} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all">
                      <td className="px-5 py-4.5 text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-5 py-4.5 font-bold text-slate-800 dark:text-slate-200 max-w-[200px] leading-relaxed">
                        {chName}
                      </td>
                      <td className="px-5 py-4.5">
                        <div className="flex items-center space-x-1.5 w-full">
                          <input
                            type="text"
                            value={editingUrlValue}
                            onChange={(e) => {
                              setCiEditingUrls(prev => ({ ...prev, [chName]: e.target.value }));
                            }}
                            placeholder="Paste background photo image link (https://...)"
                            className="w-full max-w-sm p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
                          />
                          {editingUrlValue && (
                            <button
                              onClick={() => {
                                setCiEditingUrls(prev => ({ ...prev, [chName]: '' }));
                              }}
                              title="Clear Input"
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4.5 text-center">
                        <div className="flex justify-center items-center group relative w-14 h-10 bg-slate-50 dark:bg-slate-900 rounded-md overflow-hidden border border-slate-150 dark:border-slate-800 mx-auto">
                          {editingUrlValue ? (
                            <img
                              src={editingUrlValue}
                              alt="Thumbnail Preview"
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400 uppercase font-black font-poppins">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4.5 text-right">
                        <button
                          onClick={() => handleSaveChapterImage(chName)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950/70 dark:hover:bg-purple-900/70 dark:text-purple-300 text-[11px] font-extrabold uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                            isSaving ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
                          }`}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'daily-dose' && (
        <div id="sub-panel-daily-dose" className="space-y-6 animate-slide-up text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-extrabold font-poppins text-slate-900 dark:text-white">
                🎯 Daily Dose Curriculum Manager
              </h3>
              <p className="text-xs text-slate-450 leading-normal">
                Setup high-engagement Daily Dose questions targeted dynamically per syllabus/exam stream. Maintain streaks and rewards offline & on Cloud SQL.
              </p>
            </div>
            
            {ddId && (
              <button 
                onClick={() => {
                  setDdId(null);
                  setDdQuestion('');
                  setDdOptionA('');
                  setDdOptionB('');
                  setDdOptionC('');
                  setDdOptionD('');
                  setDdExplanation('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Edit Mode
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle: Setup Question form */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2 font-poppins">
                {ddId ? '✏️ Edit Active Daily Dose Question' : '🚀 Publish New Daily Dose Question'}
              </h4>

              <form onSubmit={handleSaveDailyDose} className="space-y-4 text-xs font-semibold">
                
                {/* Metadatas split */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Specific Dose Date</label>
                    <input 
                      type="date"
                      value={ddDate}
                      onChange={(e) => {
                        setDdDate(e.target.value);
                        setDdPublishDate(e.target.value);
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Target Exam Stream</label>
                    <select
                      value={ddExamType}
                      onChange={(e) => setDdExamType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    >
                      <option value="JEE">JEE (Main + Advanced)</option>
                      <option value="NEET">NEET (Medical UG)</option>
                      <option value="CBSE">CBSE (Class 11/12 Boards)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Subject Stream</label>
                    <select
                      value={ddSubject}
                      onChange={(e) => setDdSubject(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Botany">Botany</option>
                      <option value="Zoology">Zoology</option>
                    </select>
                  </div>
                </div>

                {/* Core question string */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">MCQ Question Text</label>
                  <textarea
                    rows={3}
                    placeholder="E.g., What is the standard units of magnetic susceptibility in SI system?"
                    value={ddQuestion}
                    onChange={(e) => setDdQuestion(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-medium leading-relaxed text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Question Options splits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-blue-600">Option A</label>
                    <input 
                      type="text"
                      placeholder="Option A text string"
                      value={ddOptionA}
                      onChange={(e) => setDdOptionA(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-blue-600">Option B</label>
                    <input 
                      type="text"
                      placeholder="Option B text string"
                      value={ddOptionB}
                      onChange={(e) => setDdOptionB(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-blue-600">Option C</label>
                    <input 
                      type="text"
                      placeholder="Option C text string"
                      value={ddOptionC}
                      onChange={(e) => setDdOptionC(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-blue-600">Option D</label>
                    <input 
                      type="text"
                      placeholder="Option D text string"
                      value={ddOptionD}
                      onChange={(e) => setDdOptionD(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Correct choice selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-emerald-600 font-extrabold">Correct Option Key</label>
                  <select
                    value={ddCorrectAnswer}
                    onChange={(e) => setDdCorrectAnswer(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-905 rounded-xl outline-none text-emerald-800 dark:text-emerald-400 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                {/* Explanation text */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Correct Explanation & Concept Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Explain the detailed solution step-by-step for learning moments."
                    value={ddExplanation}
                    onChange={(e) => setDdExplanation(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-medium leading-relaxed text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Motivational messages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-emerald-600">Correct Answer Motivation Message</label>
                    <input 
                      type="text"
                      placeholder="E.g., Ek question roz, rank ki taraf ek aur kadam."
                      value={ddCorrectMotivation}
                      onChange={(e) => setDdCorrectMotivation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-amber-600">Wrong Answer Motivation Message</label>
                    <input 
                      type="text"
                      placeholder="E.g., Galtiyaan hi topper banati hain."
                      value={ddWrongMotivation}
                      onChange={(e) => setDdWrongMotivation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Motivational quote image swap slide */}
                <div className="space-y-1.5 pb-2">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px] text-purple-600">Motivation Quote Image URL (optional)</label>
                  <input 
                    type="text"
                    placeholder="https://raw.githubusercontent.com/.../quote.jpg"
                    value={ddMotivationImageUrl}
                    onChange={(e) => setDdMotivationImageUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Paste a hosted image link (jpg/png). On the homepage, students can swap between today's question and this quote image using the arrow on the card.
                  </p>
                  {ddMotivationImageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-xs">
                      <img 
                        src={ddMotivationImageUrl} 
                        alt="Motivation quote preview" 
                        className="w-full h-40 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Additional metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Publish Date</label>
                    <input 
                      type="date"
                      value={ddPublishDate}
                      onChange={(e) => setDdPublishDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Publish Status</label>
                    <select
                      value={ddStatus}
                      onChange={(e) => setDdStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    >
                      <option value="Active">Active (Live in Streams)</option>
                      <option value="Archived">Archived (Internal Reference)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/85">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-650 hover:bg-purple-750 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    {ddId ? 'Update & Push Live' : 'Save & Publish Question'}
                  </button>
                </div>

              </form>
            </div>

            {/* Right: Informational Board details */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250/30 dark:border-slate-850 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 font-poppins">
                🎓 Calibration Protocol
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans font-medium">
                Each calendar date can carry a Daily Dose specific assignment. The system matches the current date based on standard Indian Standard Time (or fallback on UTC).
              </p>
              
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Today's Date Key:</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-805 text-purple-600 px-2 py-0.5 rounded font-black text-[10px]">
                  {new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <div className="p-4 bg-purple-50/50 dark:bg-purple-955/10 border border-purple-105 dark:border-purple-900 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-purple-800 dark:text-purple-300 block font-poppins">Streak mechanics:</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Completing a Daily Dose correctly increments study progress metrics, tracks stats records on persistent storage, and maintains high student engagement.
                </p>
              </div>
            </div>

          </div>

          {/* Table List of existing Daily Dose questions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-xs font-semibold">
            <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide font-poppins">
              📋 All Published Daily Dose Collections ({dailyDoseList.length})
            </h4>

            {loadingDailyDoses ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <RefreshCw className="h-6 w-6 text-purple-500 animate-spin" />
                <span className="text-xs text-slate-400 mt-2 font-mono">Querying tables...</span>
              </div>
            ) : dailyDoseList.length === 0 ? (
              <p className="py-6 text-slate-400 text-center font-medium italic">No custom daily doses recorded. Seeding default physics questions on initial start.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] text-slate-450 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Scheduled Date</th>
                      <th className="px-4 py-3">Exam / Subject</th>
                      <th className="px-4 py-3">Question Statement</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-705 dark:text-slate-350">
                    {dailyDoseList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                        <td className="px-4 py-3.5 font-mono text-purple-650 font-extrabold">{item.date}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-blue-55 dark:bg-blue-950 text-blue-700 dark:text-blue-350 px-1.5 py-0.5 rounded font-black uppercase text-[9px] mr-1 font-mono">
                            {item.examType}
                          </span>
                          <span className="bg-emerald-55 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-350 px-1.5 py-0.5 rounded font-black uppercase text-[9px] font-mono">
                            {item.subject}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[320px] truncate font-bold text-slate-850 dark:text-slate-100">
                          {item.question}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            item.status === 'Active' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-450' 
                              : 'bg-slate-150 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5 shrink-0">
                          <button
                            onClick={() => handleEditDailyDoseChoice(item)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/45 dark:text-purple-350 rounded text-[10px] uppercase font-black font-poppins cursor-pointer"
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          {dailyDoseDeleteConfirmId === item.id ? (
                            <button
                              onClick={() => {
                                handleDeleteDailyDoseChoice(item.id);
                                setDailyDoseDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] uppercase font-black font-poppins cursor-pointer animate-pulse"
                              title="Click again to confirm delete"
                            >
                              ⚠️ Confirm?
                            </button>
                          ) : (
                            <button
                              onClick={() => setDailyDoseDeleteConfirmId(item.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-955/45 dark:text-red-350 rounded text-[10px] uppercase font-black font-poppins cursor-pointer"
                              title="Delete"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {activeSubTab === 'lectures' && (
        <div id="sub-panel-lectures" className="space-y-6 animate-slide-up text-left">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black font-poppins bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent flex flex-wrap items-center gap-3">
                <span className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/15 dark:to-purple-400/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-lg border border-indigo-500/20 dark:border-indigo-500/30 shadow-indigo-500/5 shadow-sm flex items-center gap-1.5 uppercase font-mono">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                  </span>
                  LECTURE HUB
                </span>
                <span>Chapter Lecture Library Manager</span>
              </h3>
              <p className="text-xs text-slate-450 leading-normal">
                Define, sequence, or edit dedicated syllabus learning video lectures. Bind timeline events to existing platform chapter records.
              </p>
            </div>
            
            {lectureForm.id && (
              <button 
                onClick={() => {
                  setLectureForm({
                    id: '',
                    examType: 'JEE',
                    classLevel: 'Class 12',
                    subject: 'Physics',
                    chapter: '',
                    lectureTitle: '',
                    lectureDescription: '',
                    youtubeUrl: '',
                    lectureOrder: '1',
                    thumbnailUrl: ''
                  });
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Edit Mode
              </button>
            )}
          </div>

          <div id="lecture-management-form-main" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle: Setup Lecture form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2 font-poppins">
                {lectureForm.id ? '✏️ Edit Lecture' : '🚀 Publish New Lecture'}
              </h4>

              <form onSubmit={handleSaveLecture} className="space-y-4 text-xs font-semibold">
                
                {/* Chapter selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Bind To Chapter</label>
                  <select
                    value={lectureForm.chapter}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const nextOrder = (adminLectures.filter(l => l.chapter === sel).length + 1) || 1;
                      setLectureForm(prev => ({
                        ...prev,
                        chapter: sel,
                        lectureOrder: String(nextOrder)
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  >
                    <option value="">-- Choose Chapter --</option>
                    {getStoredChapters().map(ch => (
                      <option key={ch.id} value={ch.id}>
                        [{ch.exam} | {ch.subject}] - {ch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lecture Title */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Lecture Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Introduction to Electrostatics"
                    value={lectureForm.lectureTitle}
                    onChange={(e) => setLectureForm(prev => ({ ...prev, lectureTitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  />
                </div>

                {/* Lecture Description */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Lecture Description (Optional)</label>
                  <textarea
                    placeholder="Provide overview of what will be taught..."
                    value={lectureForm.lectureDescription}
                    rows={2}
                    onChange={(e) => setLectureForm(prev => ({ ...prev, lectureDescription: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  />
                </div>

                {/* YouTube Link */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">YouTube URL Link</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                    value={lectureForm.youtubeUrl}
                    onChange={(e) => setLectureForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  />
                </div>

                {/* Lecture Order Sequence and Thumbnail URL */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Lecture Sequence Order</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={lectureForm.lectureOrder}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, lectureOrder: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Thumbnail (Optional)</label>
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={lectureForm.thumbnailUrl}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={lectureFormLoading}
                  className="w-full py-2.5 bg-purple-650 hover:bg-purple-755 text-white font-bold rounded-xl text-center select-none cursor-pointer transition-all disabled:opacity-50"
                >
                  {lectureFormLoading ? 'Updating DB...' : lectureForm.id ? '💾 Save Changes' : '➕ Create Lecture'}
                </button>

              </form>
            </div>

            {/* Right: Catalogue list & previews */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2 font-poppins flex justify-between items-center">
                <span>📚 Current Lecture Catalogue ({adminLectures.length})</span>
                <button
                  onClick={loadAdminLectures}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 rounded transition-all"
                  title="Reload"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </h4>

              {loadingLectures ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 mt-3 text-purple-600 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-mono mt-2">Connecting to Lectures API...</span>
                </div>
              ) : adminLectures.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  Your lecture schedule is empty. Select a chapter from the dropdown to add a new class timeline!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 font-black uppercase tracking-wider text-slate-450 border-b border-slate-200 dark:border-slate-805">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Lecture Title</th>
                        <th className="px-4 py-3">Chapter Match</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                      {adminLectures.map(item => {
                        const localChapter = getStoredChapters().find(c => c.id === item.chapter);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                              {item.lectureOrder}
                            </td>
                            <td className="px-4 py-3.5 max-w-[200px]">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate">{item.lectureTitle}</p>
                              <p className="text-[10px] text-slate-400 truncate">{item.lectureDescription}</p>
                            </td>
                            <td className="px-4 py-3.5 uppercase font-mono text-[10px]">
                              {localChapter ? (
                                <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                  {localChapter.name}
                                </span>
                              ) : (
                                <span className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
                                  {item.chapter}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1.5 shrink-0 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  // Preview
                                  let finalUrl = item.youtubeUrl;
                                  if (finalUrl) {
                                    if (!finalUrl.includes('embed/')) {
                                      let videoId = '';
                                      if (finalUrl.includes('youtu.be/')) {
                                        videoId = finalUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
                                      } else if (finalUrl.includes('v=')) {
                                        videoId = finalUrl.split('v=')[1]?.split('&')[0]?.split(/[?#]/)[0];
                                      } else if (finalUrl.includes('shorts/')) {
                                        videoId = finalUrl.split('shorts/')[1]?.split(/[?#]/)[0];
                                      }
                                      if (videoId) {
                                        finalUrl = `https://www.youtube.com/embed/${videoId}`;
                                      }
                                    }
                                  }
                                  setLecturePreviewUrl(finalUrl);
                                  setLecturePreviewTitle(item.lectureTitle);
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-355 rounded text-[10px] uppercase font-black font-poppins cursor-pointer inline-flex items-center space-x-1"
                                title="Preview Lecture Video"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                              <button
                                onClick={() => handleEditLectureClick(item)}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/45 dark:text-purple-350 rounded text-[10px] uppercase font-black font-poppins cursor-pointer inline-flex items-center space-x-1"
                                title="Edit"
                              >
                                ✏️ Edit
                              </button>
                              {lectureDeleteConfirmId === item.id ? (
                                <button
                                  onClick={() => {
                                    handleDeleteLecture(item.id);
                                    setLectureDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] uppercase font-black font-poppins cursor-pointer inline-flex items-center space-x-1 animate-pulse"
                                  title="Click again to confirm delete"
                                >
                                  ⚠️ Confirm?
                                </button>
                              ) : (
                                <button
                                  onClick={() => setLectureDeleteConfirmId(item.id)}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-955/45 dark:text-red-355 rounded text-[10px] uppercase font-black font-poppins cursor-pointer inline-flex items-center space-x-1"
                                  title="Delete"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'sample-papers' && (
        <div id="sub-panel-sample-papers" className="space-y-6 animate-slide-up text-left">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black font-poppins bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 dark:from-amber-400 dark:via-orange-400 dark:to-amber-300 bg-clip-text text-transparent flex flex-wrap items-center gap-3">
                <span className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-400/15 dark:to-orange-400/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/20 dark:border-amber-500/30 shadow-amber-500/5 shadow-sm flex items-center gap-1.5 uppercase font-mono">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
                  </span>
                  SAMPLE PAPER HUB
                </span>
                <span>Sample Paper Test Manager</span>
              </h3>
              <p className="text-xs text-slate-450 leading-normal">
                Add chapter-wise test syllabus PDFs, test PDFs (Google Drive links), and subject-wise solution video links.
              </p>
            </div>

            {samplePaperForm.id && (
              <button
                onClick={resetSamplePaperForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Edit Mode
              </button>
            )}
          </div>

          <div id="sample-paper-management-form-main" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Add/Edit test form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2 font-poppins">
                {samplePaperForm.id ? '✏️ Edit Test' : '🚀 Add New Test'}
              </h4>

              <form onSubmit={handleSaveSamplePaper} className="space-y-4 text-xs font-semibold">

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Exam</label>
                    <select
                      value={samplePaperForm.examType}
                      onChange={(e) => setSamplePaperForm(prev => ({ ...prev, examType: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                    >
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="CBSE">CBSE</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Test Type</label>
                    <select
                      value={samplePaperForm.testType}
                      onChange={(e) => setSamplePaperForm(prev => ({ ...prev, testType: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                    >
                      <option value="chapterwise">Chapter-wise</option>
                      <option value="full_length">Full-length</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Test Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Test 1"
                    value={samplePaperForm.testName}
                    onChange={(e) => setSamplePaperForm(prev => ({ ...prev, testName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Test Syllabus PDF (Google Drive link)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={samplePaperForm.syllabusPdfUrl}
                    onChange={(e) => setSamplePaperForm(prev => ({ ...prev, syllabusPdfUrl: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Test PDF (Google Drive link)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={samplePaperForm.testPdfUrl}
                    onChange={(e) => setSamplePaperForm(prev => ({ ...prev, testPdfUrl: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Column Order</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={samplePaperForm.testOrder}
                      onChange={(e) => setSamplePaperForm(prev => ({ ...prev, testOrder: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block text-[10px]">Status</label>
                    <select
                      value={samplePaperForm.status}
                      onChange={(e) => setSamplePaperForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={samplePaperFormLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-center select-none cursor-pointer transition-all disabled:opacity-50"
                >
                  {samplePaperFormLoading ? 'Updating DB...' : samplePaperForm.id ? '💾 Save Changes' : '➕ Create Test'}
                </button>

              </form>
            </div>

            {/* Right: Test catalogue with expandable subject-wise solutions */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2 font-poppins flex justify-between items-center">
                <span>📄 Sample Paper Catalogue ({adminSamplePapers.length})</span>
                <button
                  onClick={loadAdminSamplePapers}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 rounded transition-all"
                  title="Reload"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </h4>

              {loadingSamplePapers ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 mt-3 text-amber-600 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-mono mt-2">Connecting to Sample Papers API...</span>
                </div>
              ) : adminSamplePapers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  No sample paper tests added yet. Create one using the form on the left.
                </div>
              ) : (
                <div className="space-y-3">
                  {adminSamplePapers.map((test: any) => (
                    <div key={test.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <div className="p-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400">{test.examType} · {test.testType === 'full_length' ? 'Full-length' : 'Chapter-wise'} · #{test.testOrder}</span>
                          <h5 className="font-bold text-slate-800 dark:text-white text-sm">{test.testName}</h5>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${test.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {test.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedSamplePaperId(expandedSamplePaperId === test.id ? null : test.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] uppercase font-black font-poppins cursor-pointer"
                          >
                            {expandedSamplePaperId === test.id ? 'Hide Solutions' : `Solutions (${test.solutions?.length || 0})`}
                          </button>
                          <button
                            onClick={() => handleEditSamplePaperClick(test)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/45 dark:text-purple-350 rounded text-[10px] uppercase font-black font-poppins cursor-pointer"
                          >
                            ✏️ Edit
                          </button>
                          {samplePaperDeleteConfirmId === test.id ? (
                            <button
                              onClick={() => handleDeleteSamplePaper(test.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] uppercase font-black font-poppins cursor-pointer animate-pulse"
                              title="Click again to confirm delete"
                            >
                              ⚠️ Confirm?
                            </button>
                          ) : (
                            <button
                              onClick={() => setSamplePaperDeleteConfirmId(test.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-955/45 dark:text-red-355 rounded text-[10px] uppercase font-black font-poppins cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {expandedSamplePaperId === test.id && (
                        <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                          {(test.solutions || []).map((sol: any) => (
                            <div key={sol.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {sol.subject} — <a href={sol.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">link</a>
                              </span>
                              <button
                                onClick={() => handleDeleteSolution(sol.id)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-955/45 dark:text-red-355 rounded text-[10px] uppercase font-black cursor-pointer"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}

                          <form
                            onSubmit={(e) => handleSaveSolution(e, test.id)}
                            className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
                          >
                            <div className="flex-1 min-w-[120px] space-y-1">
                              <label className="text-slate-500 uppercase tracking-wider block text-[9px]">Subject</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g., Physics"
                                value={solutionForm.samplePaperId === test.id ? solutionForm.subject : ''}
                                onChange={(e) => setSolutionForm({ id: '', samplePaperId: test.id, subject: e.target.value, youtubeUrl: solutionForm.samplePaperId === test.id ? solutionForm.youtubeUrl : '', solutionOrder: String((test.solutions?.length || 0) + 1) })}
                                className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white text-xs"
                              />
                            </div>
                            <div className="flex-[2] min-w-[160px] space-y-1">
                              <label className="text-slate-500 uppercase tracking-wider block text-[9px]">YouTube Solution Link</label>
                              <input
                                type="url"
                                required
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={solutionForm.samplePaperId === test.id ? solutionForm.youtubeUrl : ''}
                                onChange={(e) => setSolutionForm(prev => ({ ...prev, samplePaperId: test.id, youtubeUrl: e.target.value }))}
                                className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-805 dark:text-white text-xs"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={solutionFormLoading}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] cursor-pointer disabled:opacity-50"
                            >
                              ➕ Add
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Admin Video Lecture live preview modal */}
      {lecturePreviewUrl && (
        <div id="lecture-admin-preview-video-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full text-white space-y-4 p-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-purple-500 font-extrabold">📺 Live Class Lecture Preview (Admin Mod)</span>
                <h4 className="text-sm font-bold text-slate-100 truncate max-w-[400px] font-poppins">{lecturePreviewTitle}</h4>
              </div>
              <button 
                onClick={() => {
                  setLecturePreviewUrl(null);
                  setLecturePreviewTitle(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all font-black text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close Preview ✕
              </button>
            </div>
            
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800">
              <iframe
                src={lecturePreviewUrl}
                title={lecturePreviewTitle || 'Class Lecture Preview'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

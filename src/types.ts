export type Exam = 'JEE' | 'NEET' | 'CBSE';
export type AcademicLevel = 'Class 11' | 'Class 12' | 'Dropper';
export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'Botany' | 'Zoology';

export interface UserProfile {
  name: string;
  targetExam: Exam;
  academicLevel: AcademicLevel;
  role: 'Student' | 'Admin';
  isPremium: boolean;
  avatarUrl?: string;
  firebaseUid?: string;
  email?: string;
  dreamCollege?: string;
  journeyProgress?: number;
  passportStage?: string;
}

export interface Chapter {
  id: string;
  name: string;
  subject: Subject;
  exam: Exam;
  level: AcademicLevel;
  totalQuestions: number;
  progressPercent: number;
  imageUrl: string;
}

export interface Question {
  id: string;
  chapterId: string;
  examType: Exam;
  subject: Subject;
  year: number;
  session?: string;
  examDate?: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  concept: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl?: string;
}

export interface Doubt {
  id: string;
  studentName: string;
  doubtText: string;
  subject: Subject;
  imageUrl?: string;
  timestamp: string;
  replyText?: string;
  replyTimestamp?: string;
  replyVideoUrl?: string;
  status: 'Pending' | 'Replied';
}

export interface LectureBooking {
  id: string;
  studentName: string;
  exam: Exam;
  level: AcademicLevel;
  subject: Subject;
  preferredTime: string;
  contactNumber: string;
  type: 'Demo 1 (Free)' | 'Demo 2 (Free)' | 'Paid Session (₹500)';
  amount: number;
  status: 'Pending' | 'Approved' | 'Completed';
  paid: boolean;
  timestamp: string;
}

export interface ChapterVideo {
  id: string;
  chapterId: string;
  title: string;
  url: string;
}

export interface StudyDay {
  date: string; // YYYY-MM-DD
  questionsSolved: number;
  chaptersPracticed: string[];
  timeSpent: number; // in minutes
}

export interface BrandingConfig {
  logoText: string;
  logoColor: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBannerUrl: string;
  logoUrl?: string;
  youtubePlaylistUrl?: string;
}

export interface PracticeSessionState {
  chapterId: string;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>; // questionId -> selectedOption
  submittedAnswers: Record<string, boolean>; // questionId -> submitted
  markedForReview: Record<string, boolean>; // questionId -> marked
  timerMode: 'countdown' | 'stopwatch';
  timeSpent: number; // seconds
}

export interface ChapterImage {
  id?: string;
  classLevel: string;
  subject: string;
  chapterName: string;
  imageUrl: string;
}

export interface PitStop {
  id: number;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  questionCount: number;
  questions: any[];
}


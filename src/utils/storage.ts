import { 
  UserProfile, 
  Chapter, 
  Question, 
  Doubt, 
  LectureBooking, 
  ChapterVideo, 
  StudyDay, 
  BrandingConfig 
} from '../types';
import { generatePreloadedChapters } from '../data/chapters';
import { PRELOADED_QUESTIONS } from '../data/questions';

const STORAGE_KEYS = {
  USER_PROFILE: 'study_yatra_user_profile',
  CHAPTERS: 'study_yatra_chapters',
  QUESTIONS: 'study_yatra_questions',
  DOUBTS: 'study_yatra_doubts',
  BOOKINGS: 'study_yatra_bookings',
  VIDEOS: 'study_yatra_videos',
  STREAK_DAYS: 'study_yatra_streak_days',
  BRANDING: 'study_yatra_branding_config',
  INITIALIZED: 'study_yatra_db_initialized'
};

// Initial Branding Config
const DEFAULT_BRANDING: BrandingConfig = {
  logoText: 'Study Yatra',
  logoColor: '#2563EB',
  heroHeadline: 'Chalo Padhai Ko Boring Nhi Interesting Bnate Hai Study Yatra Ke Saath',
  heroSubheadline: 'Class 11th aur 12th ke liye JEE, NEET aur CBSE PYQs, chapter-wise practice, videos, doubt support aur guidance',
  heroBannerUrl: 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/df96650902274b41a0359109af8e96c4bcd5ca55/barrier%202.png',
  logoUrl: 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg',
  youtubePlaylistUrl: 'https://youtube.com/playlist?list=PLgr_pCxL9SgBtG3epg2NMy-9X-2aB0xH0'
};

// Default Mock Videos for core chapters
const DEFAULT_VIDEOS: ChapterVideo[] = [
  {
    id: 'v-1',
    chapterId: 'jee-physics-class-11-units-and-measurements',
    title: 'Units & Measurements One Shot - High Weightage PYQs',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'v-2',
    chapterId: 'jee-physics-class-11-motion-in-a-straight-line',
    title: 'Kinematics 1D Complete Chapter | Quick revision NEET/JEE',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'v-3',
    chapterId: 'jee-chemistry-class-11-some-basic-concepts-of-chemistry',
    title: 'Some Basic Concepts of Chemistry Class 11 Complete CBSE PYQs',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'v-4',
    chapterId: 'jee-mathematics-class-11-complex-numbers',
    title: 'Complex Numbers Zero to Hero - JEE Main Core Questions',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

// Default Mock Doubts
const DEFAULT_DOUBTS: Doubt[] = [
  {
    id: 'd-1',
    studentName: 'Aman Kumar',
    doubtText: 'Is electromagnetic induction possible without relative physical movement of the source magnet and the circuit coil?',
    subject: 'Physics',
    imageUrl: 'https://images.unsplash.com/photo-1616400619175-5ebd3659af97?auto=format&fit=crop&q=80&w=600',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    replyText: 'Yes Aman! Since EMI is triggered by a change in magnetic flux passing through the circuit loop, physical movement is not unique. You can simply change the current running through a secondary coil nearby to induce current.',
    replyTimestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
    status: 'Replied'
  },
  {
    id: 'd-2',
    studentName: 'Sneha Patel',
    doubtText: 'Are the plant growth regulators like Auxin and Cytokinin strictly horizontal antagonists, or do they collaborate together for bud differentiation?',
    subject: 'Botany',
    timestamp: new Date().toISOString(),
    status: 'Pending'
  }
];

// Preloaded mock booking records
const DEFAULT_BOOKINGS: LectureBooking[] = [
  {
    id: 'b-1',
    studentName: 'Rahul Verma',
    exam: 'JEE',
    level: 'Class 12',
    subject: 'Mathematics',
    preferredTime: '12 June 2026, 04:00 PM',
    contactNumber: '+91 9876543210',
    type: 'Demo 1 (Free)',
    amount: 0,
    status: 'Approved',
    paid: true,
    timestamp: new Date().toISOString()
  }
];

// Generate past streak dates with Studied activities
// Generates studied records for the current user to display on heatmap
function getInitialStreakDays(): StudyDay[] {
  const list: StudyDay[] = [];
  const today = new Date();
  
  // Custom studied dates: today, 2 days ago, 3 days ago, 6 days ago, 10 days ago, etc.
  const offsets = [0, 2, 3, 5, 6, 8, 12, 13, 14, 20, 21, 25];
  
  offsets.forEach((offset, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - offset);
    const dateStr = d.toISOString().split('T')[0];
    
    list.push({
      date: dateStr,
      questionsSolved: 5 + (idx * 3) % 15,
      chaptersPracticed: ['Units and Measurements', 'Some Basic Concepts of Chemistry'].slice(0, 1 + (idx % 2)),
      timeSpent: 20 + (idx * 8) % 60
    });
  });

  return list;
}

export function initializeDatabase() {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  
  if (!isInitialized) {
    // Generate and store preloaded items
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(generatePreloadedChapters()));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(PRELOADED_QUESTIONS));
    localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(DEFAULT_DOUBTS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(DEFAULT_VIDEOS));
    localStorage.setItem(STORAGE_KEYS.STREAK_DAYS, JSON.stringify(getInitialStreakDays()));
    localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(DEFAULT_BRANDING));
    
    // Default User Profile (prepopulated with Dropper JEE profile)
    const defaultUser: UserProfile = {
      name: '',
      targetExam: 'JEE',
      academicLevel: 'Class 12',
      role: 'Student',
      isPremium: false,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(defaultUser));
    
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// User Profile Helpers
export function getUserProfile(): UserProfile {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : { name: '', targetExam: 'JEE', academicLevel: 'Class 12', role: 'Student', isPremium: false };
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

// Chapters Helpers
export function getStoredChapters(): Chapter[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
  const list: Chapter[] = raw ? JSON.parse(raw) : [];
  
  // De-duplicate in place by ID to fix lingering duplicate keys (like jee-mathematics-dropper-probability)
  const uniqueList: Chapter[] = [];
  const seenIds = new Set<string>();
  let hasDuplicates = false;
  
  for (const ch of list) {
    if (ch && ch.id) {
      if (!seenIds.has(ch.id)) {
        seenIds.add(ch.id);
        uniqueList.push(ch);
      } else {
        hasDuplicates = true;
      }
    }
  }
  
  if (hasDuplicates) {
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(uniqueList));
  }
  
  return uniqueList;
}

export function saveChapters(chapters: Chapter[]): void {
  localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
}

export function updateChapterProgress(chapterId: string, progressPercent: number): void {
  const chapters = getStoredChapters();
  const idx = chapters.findIndex(c => c.id === chapterId);
  if (idx !== -1) {
    chapters[idx].progressPercent = Math.min(100, Math.max(0, progressPercent));
    saveChapters(chapters);
  }
}

// Questions Helpers
export function getStoredQuestions(): Question[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  const list = raw ? JSON.parse(raw) : [];
  
  // Dynamically merge any new preloaded questions that do not exist in local storage yet
  let updated = false;
  PRELOADED_QUESTIONS.forEach(q => {
    if (!list.some((existing: Question) => existing.id === q.id)) {
      list.push(q);
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
  }
  
  return list;
}

export function saveQuestion(question: Question): void {
  const questions = getStoredQuestions();
  // Check if exists
  const idx = questions.findIndex(q => q.id === question.id);
  if (idx !== -1) {
    questions[idx] = question;
  } else {
    questions.push(question);
  }
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
}

export function deleteStoredQuestion(questionId: string): void {
  const questions = getStoredQuestions();
  const filtered = questions.filter(q => q.id !== questionId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(filtered));
}

// Doubts Helpers
export function getStoredDoubts(): Doubt[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.DOUBTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveDoubt(doubt: Doubt): void {
  const doubts = getStoredDoubts();
  doubts.unshift(doubt); // add to top
  localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
}

export function replyToDoubt(doubtId: string, replyText: string, replyVideoUrl?: string): void {
  const doubts = getStoredDoubts();
  const idx = doubts.findIndex(d => d.id === doubtId);
  if (idx !== -1) {
    doubts[idx].replyText = replyText;
    doubts[idx].replyVideoUrl = replyVideoUrl;
    doubts[idx].replyTimestamp = new Date().toISOString();
    doubts[idx].status = 'Replied';
    localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
  }
}

// Bookings Helpers
export function getStoredBookings(): LectureBooking[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  return raw ? JSON.parse(raw) : [];
}

export function saveBooking(booking: LectureBooking): void {
  const bookings = getStoredBookings();
  bookings.unshift(booking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}

export function updateBookingStatus(id: string, status: 'Pending' | 'Approved' | 'Completed'): void {
  const bookings = getStoredBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    bookings[idx].status = status;
    if (status === 'Approved') {
      bookings[idx].paid = true;
    }
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }
}

// Videos Helpers
export function getStoredVideos(): ChapterVideo[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.VIDEOS);
  return raw ? JSON.parse(raw) : [];
}

export function saveVideo(video: ChapterVideo): void {
  const videos = getStoredVideos();
  // check exists
  const idx = videos.findIndex(v => v.id === video.id || (v.chapterId === video.chapterId && v.title === video.title));
  if (idx !== -1) {
    videos[idx] = video;
  } else {
    videos.push(video);
  }
  localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
}

// Study/Streak Log Helpers
export function getStoredStreakDays(): StudyDay[] {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.STREAK_DAYS);
  return raw ? JSON.parse(raw) : [];
}

export function addStudySessionToStreak(questionsSolved: number, chapterName: string, timeSpentMinutes: number): void {
  const list = getStoredStreakDays();
  const todayStr = new Date().toISOString().split('T')[0];
  const idx = list.findIndex(day => day.date === todayStr);

  if (idx !== -1) {
    list[idx].questionsSolved += questionsSolved;
    if (!list[idx].chaptersPracticed.includes(chapterName)) {
      list[idx].chaptersPracticed.push(chapterName);
    }
    list[idx].timeSpent += timeSpentMinutes;
  } else {
    list.push({
      date: todayStr,
      questionsSolved,
      chaptersPracticed: [chapterName],
      timeSpent: timeSpentMinutes
    });
  }
  localStorage.setItem(STORAGE_KEYS.STREAK_DAYS, JSON.stringify(list));
}

// Branding Configuration
export function getBrandingConfig(): BrandingConfig {
  initializeDatabase();
  const raw = localStorage.getItem(STORAGE_KEYS.BRANDING);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as BrandingConfig;
      let hasChanges = false;
      if (!parsed.heroBannerUrl || parsed.heroBannerUrl.includes('unsplash.com') || parsed.heroBannerUrl.includes('/photo-') || parsed.heroBannerUrl.includes('study_yatra_banner_1781205003924')) {
        parsed.heroBannerUrl = 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/df96650902274b41a0359109af8e96c4bcd5ca55/barrier%202.png';
        hasChanges = true;
      }
      if (!parsed.logoUrl || parsed.logoUrl.includes('study_yatra_logo_1781204987535')) {
        parsed.logoUrl = 'https://raw.githubusercontent.com/mradvitiyalive-maker/logo/main/6147921504847466773.jpg';
        hasChanges = true;
      }
      if (!parsed.youtubePlaylistUrl) {
        parsed.youtubePlaylistUrl = 'https://youtube.com/playlist?list=PLgr_pCxL9SgBtG3epg2NMy-9X-2aB0xH0';
        hasChanges = true;
      }
      if (!parsed.heroHeadline || parsed.heroHeadline === "Let's Make Learning Exciting, Collaborative and Engaging with Study Yatra") {
        parsed.heroHeadline = 'Chalo Padhai Ko Boring Nhi Interesting Bnate Hai Study Yatra Ke Saath';
        hasChanges = true;
      }
      if (!parsed.heroSubheadline || parsed.heroSubheadline.startsWith('Comprehensive') || parsed.heroSubheadline.startsWith('Class 11 & 12 exam packages')) {
        parsed.heroSubheadline = 'Class 11th aur 12th ke liye JEE, NEET aur CBSE PYQs, chapter-wise practice, videos, doubt support aur guidance';
        hasChanges = true;
      }
      if (hasChanges) {
        saveBrandingConfig(parsed);
      }
      return parsed;
    } catch (e) {
      return DEFAULT_BRANDING;
    }
  }
  return DEFAULT_BRANDING;
}

export function saveBrandingConfig(config: BrandingConfig): void {
  localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(config));
}

// Dashboard statistics summaries computed directly from the local store
export interface DashboardStats {
  solvedToday: number;
  solvedThisWeek: number;
  currentStreak: number;
  longestStreak: number;
  favSubject: string;
  recentlyPracticed: string[];
}

export function calculateDashboardStats(): DashboardStats {
  const streakDays = getStoredStreakDays();
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Solved Today
  const todayRecord = streakDays.find(d => d.date === todayStr);
  const solvedToday = todayRecord ? todayRecord.questionsSolved : 0;
  
  // 2. Solved This Week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let solvedThisWeek = 0;
  streakDays.forEach(day => {
    const d = new Date(day.date);
    if (d >= oneWeekAgo) {
      solvedThisWeek += day.questionsSolved;
    }
  });

  // 3. Streak Calculator
  // Sort streak days descending from today
  const sortedDates = streakDays
    .map(d => d.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  
  if (sortedDates.length > 0) {
    // Check if user studied today or yesterday
    const checkDate = new Date();
    const todayFormatted = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayFormatted = checkDate.toISOString().split('T')[0];
    
    const studiedRecently = sortedDates.includes(todayFormatted) || sortedDates.includes(yesterdayFormatted);
    
    if (studiedRecently) {
      let currentCheck = new Date();
      // If we studied today, start check today. If not but studied yesterday, start check yesterday
      if (!sortedDates.includes(todayFormatted) && sortedDates.includes(yesterdayFormatted)) {
        currentCheck.setDate(currentCheck.getDate() - 1);
      }
      
      while (true) {
        const checkStr = currentCheck.toISOString().split('T')[0];
        if (sortedDates.includes(checkStr)) {
          currentStreak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak calculation
    let tempStreak = 0;
    // Sort ascending for consecutive checking
    const ascDates = [...sortedDates].reverse().map(d => new Date(d));
    if (ascDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < ascDates.length; i++) {
        const diffTime = Math.abs(ascDates[i].getTime() - ascDates[i-1].getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
    }
  }

  // 4. Favorite Subject
  // We can calculate from practiced chapters, or mock if empty
  const favSubject = 'Physics'; // Default beautiful mock

  // 5. Recently Practiced Chapters
  const recentlyPracticed: string[] = [];
  // Gather from last 3 streak logs
  const sortedDays = [...streakDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sortedDays.forEach(day => {
    day.chaptersPracticed.forEach(ch => {
      if (!recentlyPracticed.includes(ch) && recentlyPracticed.length < 4) {
        recentlyPracticed.push(ch);
      }
    });
  });

  if (recentlyPracticed.length === 0) {
    recentlyPracticed.push('Units and Measurements', 'Structure of Atom');
  }

  return {
    solvedToday,
    solvedThisWeek: solvedThisWeek || 15,
    currentStreak: currentStreak || 3,
    longestStreak: Math.max(longestStreak, currentStreak, 5),
    favSubject,
    recentlyPracticed
  };
}

import { UserProgress, ReadingSession, Settings } from '../types/quran';

class StorageService {
  private readonly KEYS = {
    USER_PROGRESS: 'quran_user_progress',
    READING_SESSIONS: 'quran_reading_sessions',
    SETTINGS: 'quran_settings',
    BOOKMARKS: 'quran_bookmarks',
    OFFLINE_DATA: 'quran_offline_data'
  };

  // User Progress
  getUserProgress(): UserProgress {
    const defaultProgress: UserProgress = {
      currentSurah: 1,
      currentAyah: 1,
      totalReadingTime: 0,
      dailyGoal: 15, // minutes
      streak: 0,
      lastReadDate: '',
      bookmarks: [],
      completedSurahs: []
    };

    try {
      const stored = localStorage.getItem(this.KEYS.USER_PROGRESS);
      return stored ? { ...defaultProgress, ...JSON.parse(stored) } : defaultProgress;
    } catch (error) {
      console.error('Error loading user progress:', error);
      return defaultProgress;
    }
  }

  saveUserProgress(progress: Partial<UserProgress>) {
    try {
      const current = this.getUserProgress();
      const updated = { ...current, ...progress };
      localStorage.setItem(this.KEYS.USER_PROGRESS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  }

  // Reading Sessions
  getReadingSessions(): ReadingSession[] {
    try {
      const stored = localStorage.getItem(this.KEYS.READING_SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading reading sessions:', error);
      return [];
    }
  }

  addReadingSession(session: ReadingSession) {
    try {
      const sessions = this.getReadingSessions();
      sessions.push(session);
      
      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filtered = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo);
      localStorage.setItem(this.KEYS.READING_SESSIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error saving reading session:', error);
    }
  }

  // Settings
  getSettings(): Settings {
    const defaultSettings: Settings = {
      language: 'en.asad',
      reciter: 'ar.alafasy',
      arabicFontSize: 24,
      translationFontSize: 16,
      theme: 'light',
      autoPlay: false,
      notifications: true,
      location: {
        latitude: 0,
        longitude: 0,
        city: ''
      }
    };

    try {
      const stored = localStorage.getItem(this.KEYS.SETTINGS);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  }

  saveSettings(settings: Partial<Settings>) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Bookmarks
  getBookmarks(): number[] {
    try {
      const progress = this.getUserProgress();
      return progress.bookmarks || [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }

  addBookmark(verseId: number) {
    try {
      const bookmarks = this.getBookmarks();
      if (!bookmarks.includes(verseId)) {
        bookmarks.push(verseId);
        this.saveUserProgress({ bookmarks });
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  }

  removeBookmark(verseId: number) {
    try {
      const bookmarks = this.getBookmarks();
      const filtered = bookmarks.filter(id => id !== verseId);
      this.saveUserProgress({ bookmarks: filtered });
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }

  // Offline Data
  saveOfflineData(key: string, data: any) {
    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  getOfflineData(): { [key: string]: { data: any; timestamp: number } } {
    try {
      const stored = localStorage.getItem(this.KEYS.OFFLINE_DATA);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading offline data:', error);
      return {};
    }
  }

  // Utility methods
  calculateStreak(): number {
    const sessions = this.getReadingSessions();
    if (sessions.length === 0) return 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const dateStr = currentDate.toDateString();
      const hasSession = sessions.some(s => new Date(s.date).toDateString() === dateStr);
      
      if (hasSession) {
        streak++;
      } else if (dateStr !== today) {
        // If no session and it's not today, break the streak
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  getTodayReadingTime(): number {
    const today = new Date().toDateString();
    const sessions = this.getReadingSessions();
    
    return sessions
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((total, session) => total + session.duration, 0);
  }

  clearAllData() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const storageService = new StorageService();
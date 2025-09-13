import { useState, useEffect, useCallback } from 'react';
import { UserProgress, ReadingSession } from '../types/quran';
import { storageService } from '../services/storageService';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(storageService.getUserProgress());
  const [todayReadingTime, setTodayReadingTime] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = useCallback(() => {
    const userProgress = storageService.getUserProgress();
    const todayTime = storageService.getTodayReadingTime();
    const streak = storageService.calculateStreak();
    const sessions = storageService.getReadingSessions();

    setProgress(userProgress);
    setTodayReadingTime(todayTime);
    setCurrentStreak(streak);
    setReadingSessions(sessions);
  }, []);

  const updateProgress = useCallback((updates: Partial<UserProgress>) => {
    const updated = { ...progress, ...updates };
    setProgress(updated);
    storageService.saveUserProgress(updates);
  }, [progress]);

  const startReadingSession = useCallback(() => {
    const sessionStart = Date.now();
    return sessionStart;
  }, []);

  const endReadingSession = useCallback((sessionStart: number, versesRead: number, surahsRead: number[]) => {
    const sessionEnd = Date.now();
    const duration = Math.round((sessionEnd - sessionStart) / 1000 / 60); // minutes

    if (duration > 0) {
      const session: ReadingSession = {
        date: new Date().toISOString(),
        duration,
        versesRead,
        surahsRead
      };

      storageService.addReadingSession(session);
      
      // Update total reading time
      updateProgress({
        totalReadingTime: progress.totalReadingTime + duration,
        lastReadDate: new Date().toISOString()
      });

      // Refresh data
      loadProgress();
    }
  }, [progress, updateProgress, loadProgress]);

  const addBookmark = useCallback((verseId: number) => {
    storageService.addBookmark(verseId);
    loadProgress();
  }, [loadProgress]);

  const removeBookmark = useCallback((verseId: number) => {
    storageService.removeBookmark(verseId);
    loadProgress();
  }, [loadProgress]);

  const toggleBookmark = useCallback((verseId: number) => {
    if (progress.bookmarks.includes(verseId)) {
      removeBookmark(verseId);
    } else {
      addBookmark(verseId);
    }
  }, [progress.bookmarks, addBookmark, removeBookmark]);

  const setDailyGoal = useCallback((minutes: number) => {
    updateProgress({ dailyGoal: minutes });
  }, [updateProgress]);

  const markSurahCompleted = useCallback((surahNumber: number) => {
    if (!progress.completedSurahs.includes(surahNumber)) {
      const updated = [...progress.completedSurahs, surahNumber];
      updateProgress({ completedSurahs: updated });
    }
  }, [progress.completedSurahs, updateProgress]);

  const getWeeklyStats = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekSessions = readingSessions.filter(
      session => new Date(session.date) >= weekAgo
    );

    const totalTime = weekSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalVerses = weekSessions.reduce((sum, session) => sum + session.versesRead, 0);
    const daysActive = new Set(weekSessions.map(session => 
      new Date(session.date).toDateString()
    )).size;

    return {
      totalTime,
      totalVerses,
      daysActive,
      averageDaily: daysActive > 0 ? Math.round(totalTime / daysActive) : 0
    };
  }, [readingSessions]);

  const getMonthlyStats = useCallback(() => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const monthSessions = readingSessions.filter(
      session => new Date(session.date) >= monthAgo
    );

    const totalTime = monthSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalVerses = monthSessions.reduce((sum, session) => sum + session.versesRead, 0);
    const daysActive = new Set(monthSessions.map(session => 
      new Date(session.date).toDateString()
    )).size;

    return {
      totalTime,
      totalVerses,
      daysActive,
      averageDaily: daysActive > 0 ? Math.round(totalTime / daysActive) : 0
    };
  }, [readingSessions]);

  const getDailyGoalProgress = useCallback(() => {
    const percentage = progress.dailyGoal > 0 ? (todayReadingTime / progress.dailyGoal) * 100 : 0;
    return Math.min(percentage, 100);
  }, [todayReadingTime, progress.dailyGoal]);

  return {
    progress,
    todayReadingTime,
    currentStreak,
    readingSessions,
    updateProgress,
    startReadingSession,
    endReadingSession,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    setDailyGoal,
    markSurahCompleted,
    getWeeklyStats,
    getMonthlyStats,
    getDailyGoalProgress,
    reload: loadProgress
  };
}
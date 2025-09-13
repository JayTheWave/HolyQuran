import { useState, useEffect, useCallback } from 'react';
import { Verse, Surah } from '../types/quran';
import { quranAPI } from '../services/quranApi';
import { storageService } from '../services/storageService';

export function useQuran() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load surahs on mount
  useEffect(() => {
    loadSurahs();
  }, []);

  const loadSurahs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const surahList = await quranAPI.getSurahs();
      setSurahs(surahList);
      
      // Load user's current position
      const progress = storageService.getUserProgress();
      const currentSurahData = surahList.find(s => s.number === progress.currentSurah);
      if (currentSurahData) {
        setCurrentSurah(currentSurahData);
        await loadSurah(progress.currentSurah);
      }
    } catch (err) {
      setError('Failed to load Quran data');
      console.error('Error loading surahs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSurah = useCallback(async (surahNumber: number, edition?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const surahData = surahs.find(s => s.number === surahNumber);
      if (surahData) {
        setCurrentSurah(surahData);
      }
      
      const verseList = await quranAPI.getSurah(surahNumber, edition);
      setVerses(verseList);
      
      // Set current verse based on user progress
      const progress = storageService.getUserProgress();
      if (progress.currentSurah === surahNumber) {
        const currentVerseData = verseList.find(v => v.ayah === progress.currentAyah);
        if (currentVerseData) {
          setCurrentVerse(currentVerseData);
        }
      } else if (verseList.length > 0) {
        setCurrentVerse(verseList[0]);
      }
      
    } catch (err) {
      setError('Failed to load surah');
      console.error('Error loading surah:', err);
    } finally {
      setLoading(false);
    }
  }, [surahs]);

  const goToVerse = useCallback((surahNumber: number, ayahNumber: number) => {
    const verse = verses.find(v => v.surah === surahNumber && v.ayah === ayahNumber);
    if (verse) {
      setCurrentVerse(verse);
      // Update user progress
      storageService.saveUserProgress({
        currentSurah: surahNumber,
        currentAyah: ayahNumber
      });
    }
  }, [verses]);

  const nextVerse = useCallback(() => {
    if (!currentVerse || !verses.length) return;
    
    const currentIndex = verses.findIndex(v => v.id === currentVerse.id);
    if (currentIndex < verses.length - 1) {
      const next = verses[currentIndex + 1];
      setCurrentVerse(next);
      storageService.saveUserProgress({
        currentSurah: next.surah,
        currentAyah: next.ayah
      });
    } else {
      // Move to next surah
      const nextSurah = surahs.find(s => s.number === currentVerse.surah + 1);
      if (nextSurah) {
        loadSurah(nextSurah.number);
      }
    }
  }, [currentVerse, verses, surahs]);

  const previousVerse = useCallback(() => {
    if (!currentVerse || !verses.length) return;
    
    const currentIndex = verses.findIndex(v => v.id === currentVerse.id);
    if (currentIndex > 0) {
      const prev = verses[currentIndex - 1];
      setCurrentVerse(prev);
      storageService.saveUserProgress({
        currentSurah: prev.surah,
        currentAyah: prev.ayah
      });
    } else {
      // Move to previous surah
      const prevSurah = surahs.find(s => s.number === currentVerse.surah - 1);
      if (prevSurah) {
        loadSurah(prevSurah.number);
      }
    }
  }, [currentVerse, verses, surahs]);

  const searchVerses = useCallback(async (query: string, edition?: string) => {
    try {
      setLoading(true);
      setError(null);
      const results = await quranAPI.searchVerses(query, edition);
      return results;
    } catch (err) {
      setError('Search failed');
      console.error('Error searching verses:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    surahs,
    currentSurah,
    verses,
    currentVerse,
    loading,
    error,
    loadSurah,
    goToVerse,
    nextVerse,
    previousVerse,
    searchVerses,
    reload: loadSurahs
  };
}
export interface Verse {
  id: number;
  surah: number;
  ayah: number;
  arabic: string;
  translation: string;
  transliteration: string;
  audio?: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Reciter {
  id: string;
  name: string;
  style: string;
}

export interface UserProgress {
  currentSurah: number;
  currentAyah: number;
  totalReadingTime: number;
  dailyGoal: number;
  streak: number;
  lastReadDate: string;
  bookmarks: number[];
  completedSurahs: number[];
}

export interface ReadingSession {
  date: string;
  duration: number;
  versesRead: number;
  surahsRead: number[];
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sunrise: string;
  sunset: string;
}

export interface Settings {
  language: string;
  reciter: string;
  arabicFontSize: number;
  translationFontSize: number;
  theme: 'light' | 'dark';
  autoPlay: boolean;
  notifications: boolean;
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
}
import axios from 'axios';
import { Verse, Surah, Reciter } from '../types/quran';

const BASE_URL = 'https://api.alquran.cloud/v1';

class QuranAPI {
  private cache = new Map<string, any>();

  async getSurahs(): Promise<Surah[]> {
    const cacheKey = 'surahs';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.get(`${BASE_URL}/surah`);
      const surahs = response.data.data.map((surah: any) => ({
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType
      }));
      
      this.cache.set(cacheKey, surahs);
      return surahs;
    } catch (error) {
      console.error('Error fetching surahs:', error);
      return this.getFallbackSurahs();
    }
  }

  async getSurah(number: number, edition = 'en.asad'): Promise<Verse[]> {
    const cacheKey = `surah-${number}-${edition}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const [arabicResponse, translationResponse] = await Promise.all([
        axios.get(`${BASE_URL}/surah/${number}/ar.alafasy`),
        axios.get(`${BASE_URL}/surah/${number}/${edition}`)
      ]);

      const arabicVerses = arabicResponse.data.data.ayahs;
      const translationVerses = translationResponse.data.data.ayahs;

      const verses = arabicVerses.map((verse: any, index: number) => ({
        id: verse.number,
        surah: number,
        ayah: verse.numberInSurah,
        arabic: verse.text,
        translation: translationVerses[index]?.text || '',
        transliteration: this.getTransliteration(verse.text),
        audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${verse.number}.mp3`
      }));

      this.cache.set(cacheKey, verses);
      return verses;
    } catch (error) {
      console.error('Error fetching surah:', error);
      return this.getFallbackVerses(number);
    }
  }

  async getVerse(surah: number, ayah: number, edition = 'en.asad'): Promise<Verse | null> {
    try {
      const verses = await this.getSurah(surah, edition);
      return verses.find(v => v.ayah === ayah) || null;
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  async searchVerses(query: string, edition = 'en.asad'): Promise<Verse[]> {
    try {
      const response = await axios.get(`${BASE_URL}/search/${encodeURIComponent(query)}/all/${edition}`);
      return response.data.data.matches.map((match: any) => ({
        id: match.number,
        surah: match.surah.number,
        ayah: match.numberInSurah,
        arabic: match.text,
        translation: match.text,
        transliteration: this.getTransliteration(match.text)
      }));
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  getReciters(): Reciter[] {
    return [
      { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', style: 'Warsh' },
      { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit Abdul Samad', style: 'Murattal' },
      { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', style: 'Hafs' },
      { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi', style: 'Murattal' },
      { id: 'ar.sudais', name: 'Abdul Rahman Al-Sudais', style: 'Hafs' }
    ];
  }

  private getTransliteration(arabic: string): string {
    // Simple transliteration mapping - in production, use a proper library
    const transliterationMap: { [key: string]: string } = {
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ': 'Bismillahi Ar-Rahman Ar-Raheem',
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ': 'Allahu la ilaha illa Huwa, Al-Hayyu Al-Qayyum',
      'قُلْ هُوَ اللَّهُ أَحَدٌ': 'Qul Huwa Allahu Ahad'
    };
    
    return transliterationMap[arabic] || 'Transliteration not available';
  }

  private getFallbackSurahs(): Surah[] {
    return [
      { number: 1, name: 'الفاتحة', englishName: 'Al-Fatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' },
      { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
      { number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', englishNameTranslation: 'The Sincerity', numberOfAyahs: 4, revelationType: 'Meccan' }
    ];
  }

  private getFallbackVerses(surahNumber: number): Verse[] {
    const fallbackData: { [key: number]: Verse[] } = {
      1: [
        {
          id: 1,
          surah: 1,
          ayah: 1,
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
          transliteration: "Bismillahi Ar-Rahman Ar-Raheem"
        }
      ]
    };
    
    return fallbackData[surahNumber] || [];
  }
}

export const quranAPI = new QuranAPI();
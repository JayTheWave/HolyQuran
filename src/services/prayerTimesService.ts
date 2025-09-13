import { PrayerTimes } from '../types/quran';

class PrayerTimesService {
  private cache = new Map<string, { times: PrayerTimes; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async getPrayerTimes(latitude: number, longitude: number): Promise<PrayerTimes | null> {
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.times;
    }

    try {
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prayer times');
      }

      const data = await response.json();
      const timings = data.data.timings;

      const prayerTimes: PrayerTimes = {
        fajr: timings.Fajr,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
        sunrise: timings.Sunrise,
        sunset: timings.Sunset
      };

      this.cache.set(cacheKey, {
        times: prayerTimes,
        timestamp: Date.now()
      });

      return prayerTimes;
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      return this.getFallbackPrayerTimes();
    }
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    });
  }

  getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string } | null {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (prayerTime > currentTime) {
        return prayer;
      }
    }

    // If no prayer found today, return Fajr of tomorrow
    return { name: 'Fajr', time: prayerTimes.fajr };
  }

  private getFallbackPrayerTimes(): PrayerTimes {
    return {
      fajr: '05:30',
      dhuhr: '12:30',
      asr: '15:45',
      maghrib: '18:15',
      isha: '19:45',
      sunrise: '06:45',
      sunset: '18:00'
    };
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}

export const prayerTimesService = new PrayerTimesService();
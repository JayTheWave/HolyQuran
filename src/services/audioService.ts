import { Verse } from '../types/quran';

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private currentVerse: Verse | null = null;
  private isPlaying = false;
  private listeners: { [key: string]: Function[] } = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('loadstart', () => this.emit('loading', true));
    this.audio.addEventListener('canplay', () => this.emit('loading', false));
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.emit('play', this.currentVerse);
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit('pause', this.currentVerse);
    });
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.emit('ended', this.currentVerse);
    });
    this.audio.addEventListener('error', (e) => this.emit('error', e));
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.emit('timeupdate', {
          currentTime: this.audio.currentTime,
          duration: this.audio.duration
        });
      }
    });
  }

  async playVerse(verse: Verse) {
    if (!this.audio) return;

    try {
      if (this.currentVerse?.id !== verse.id) {
        this.currentVerse = verse;
        this.audio.src = verse.audio || this.getAudioUrl(verse);
      }

      await this.audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.emit('error', error);
    }
  }

  pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
    }
  }

  resume() {
    if (this.audio && !this.isPlaying) {
      this.audio.play().catch(error => {
        console.error('Error resuming audio:', error);
        this.emit('error', error);
      });
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    }
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentVerse(): Verse | null {
    return this.currentVerse;
  }

  private getAudioUrl(verse: Verse): string {
    return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${verse.id}.mp3`;
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  destroy() {
    if (this.audio) {
      this.stop();
      this.audio = null;
    }
    this.listeners = {};
  }
}

export const audioService = new AudioService();
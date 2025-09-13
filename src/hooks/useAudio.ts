import { useState, useEffect, useCallback } from 'react';
import { Verse } from '../types/quran';
import { audioService } from '../services/audioService';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePlay = (verse: Verse) => {
      setIsPlaying(true);
      setCurrentVerse(verse);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleLoading = (loading: boolean) => {
      setIsLoading(loading);
    };

    const handleTimeUpdate = ({ currentTime, duration }: { currentTime: number; duration: number }) => {
      setCurrentTime(currentTime);
      setDuration(duration);
    };

    const handleError = (err: any) => {
      setError('Audio playback failed');
      setIsPlaying(false);
      setIsLoading(false);
      console.error('Audio error:', err);
    };

    audioService.on('play', handlePlay);
    audioService.on('pause', handlePause);
    audioService.on('ended', handleEnded);
    audioService.on('loading', handleLoading);
    audioService.on('timeupdate', handleTimeUpdate);
    audioService.on('error', handleError);

    return () => {
      audioService.off('play', handlePlay);
      audioService.off('pause', handlePause);
      audioService.off('ended', handleEnded);
      audioService.off('loading', handleLoading);
      audioService.off('timeupdate', handleTimeUpdate);
      audioService.off('error', handleError);
    };
  }, []);

  const playVerse = useCallback(async (verse: Verse) => {
    try {
      setError(null);
      await audioService.playVerse(verse);
    } catch (err) {
      setError('Failed to play verse');
      console.error('Error playing verse:', err);
    }
  }, []);

  const pause = useCallback(() => {
    audioService.pause();
  }, []);

  const resume = useCallback(() => {
    audioService.resume();
  }, []);

  const stop = useCallback(() => {
    audioService.stop();
    setCurrentVerse(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const seek = useCallback((time: number) => {
    audioService.seek(time);
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioService.setVolume(volume);
  }, []);

  const togglePlayPause = useCallback(async (verse?: Verse) => {
    if (isPlaying) {
      pause();
    } else if (verse) {
      await playVerse(verse);
    } else {
      resume();
    }
  }, [isPlaying, playVerse, pause, resume]);

  return {
    isPlaying,
    isLoading,
    currentVerse,
    currentTime,
    duration,
    error,
    playVerse,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    togglePlayPause
  };
}
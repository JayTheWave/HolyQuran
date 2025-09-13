import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  Pause, 
  Bookmark, 
  Search, 
  Settings, 
  Home,
  TrendingUp,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  Volume2,
  SkipForward,
  SkipBack,
  Loader,
  MapPin,
  Calendar,
  Target,
  Award,
  BookmarkCheck
} from 'lucide-react';
import { useQuran } from '../hooks/useQuran';
import { useAudio } from '../hooks/useAudio';
import { useProgress } from '../hooks/useProgress';
import { storageService } from '../services/storageService';
import { prayerTimesService } from '../services/prayerTimesService';
import { PrayerTimes } from '../types/quran';

export default function QuranReader() {
  // Hooks
  const { surahs, currentSurah, verses, currentVerse, loading: quranLoading, loadSurah, nextVerse, previousVerse, searchVerses } = useQuran();
  const { isPlaying, isLoading: audioLoading, togglePlayPause, currentTime, duration, seek } = useAudio();
  const { progress, todayReadingTime, currentStreak, toggleBookmark, setDailyGoal, startReadingSession, endReadingSession, getDailyGoalProgress } = useProgress();
  
  // State
  const [activeTab, setActiveTab] = useState('home');
  const [readingMode, setReadingMode] = useState<'arabic' | 'translation' | 'both'>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [showSurahList, setShowSurahList] = useState(false);

  // Load prayer times and settings on mount
  useEffect(() => {
    loadPrayerTimes();
    loadSettings();
  }, []);

  const loadPrayerTimes = async () => {
    const location = await prayerTimesService.getCurrentLocation();
    if (location) {
      const times = await prayerTimesService.getPrayerTimes(location.latitude, location.longitude);
      setPrayerTimes(times);
    }
  };

  const loadSettings = () => {
    const settings = storageService.getSettings();
    setReadingMode(settings.language === 'ar' ? 'arabic' : 'both');
  };

  const handleStartReading = () => {
    if (!sessionStart) {
      setSessionStart(startReadingSession());
    }
  };

  const handleEndReading = () => {
    if (sessionStart) {
      endReadingSession(sessionStart, 1, currentVerse ? [currentVerse.surah] : []);
      setSessionStart(null);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchVerses(searchQuery);
      setSearchResults(results);
    }
  };

  const handleVerseSelect = (verse: any) => {
    if (currentSurah?.number !== verse.surah) {
      loadSurah(verse.surah);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextPrayer = prayerTimes ? prayerTimesService.getNextPrayer(prayerTimes) : null;
  const dailyGoalProgress = getDailyGoalProgress();

  if (quranLoading && !currentVerse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Quran...</p>
        </div>
      </div>
    );
  }

  const renderAudioControls = () => {
    if (!currentVerse) return null;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={previousVerse}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => togglePlayPause(currentVerse)}
              disabled={audioLoading}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {audioLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {audioLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
              </span>
            </button>
            
            <button
              onClick={nextVerse}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
          
          <Volume2 className="w-5 h-5 text-gray-400" />
        </div>
        
        {duration > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-emerald-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSurahSelector = () => {
    if (!showSurahList) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Surah</h3>
              <button
                onClick={() => setShowSurahList(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            {surahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => {
                  loadSurah(surah.number);
                  setShowSurahList(false);
                }}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 ${
                  currentSurah?.number === surah.number ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{surah.englishName}</p>
                    <p className="text-sm text-gray-600">{surah.englishNameTranslation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-arabic">{surah.name}</p>
                    <p className="text-xs text-gray-500">{surah.numberOfAyahs} verses</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHomeContent = () => (
    <div className="space-y-6">
      {/* Prayer Times Card */}
      {prayerTimes && nextPrayer && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Next Prayer</h2>
              <p className="text-blue-100">Stay connected with your prayers</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-blue-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold">{nextPrayer.name}</div>
            <div className="text-blue-100">{prayerTimesService.formatTime(nextPrayer.time)}</div>
          </div>
        </div>
      )}

      {/* Daily Progress Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Today's Progress</h2>
            <p className="text-emerald-100">Keep up the great work!</p>
          </div>
          <div className="bg-emerald-500 rounded-full p-3">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/30 rounded-xl p-3">
            <div className="text-2xl font-bold">{todayReadingTime}min</div>
            <div className="text-sm text-emerald-100">of {progress.dailyGoal}min goal</div>
          </div>
          <div className="bg-emerald-500/30 rounded-xl p-3">
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-sm text-emerald-100">day streak</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Daily Goal</span>
            <span>{Math.round(dailyGoalProgress)}%</span>
          </div>
          <div className="w-full bg-emerald-500/30 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${dailyGoalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      {renderAudioControls()}

      {/* Today's Verse */}
      {currentVerse && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Current Reading</h3>
              </div>
              <button
                onClick={() => setShowSurahList(true)}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Change Surah
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {currentSurah?.englishName} • Ayah {currentVerse.ayah}
            </p>
          </div>
          
          <div className="p-6">
            {(readingMode === 'arabic' || readingMode === 'both') && (
              <div className="text-right mb-6">
                <p className="text-2xl leading-relaxed text-gray-900 font-arabic">
                  {currentVerse.arabic}
                </p>
              </div>
            )}
            
            {(readingMode === 'translation' || readingMode === 'both') && (
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  {currentVerse.translation}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {currentVerse.transliteration}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={previousVerse}
                  className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <button
                  onClick={nextVerse}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => toggleBookmark(currentVerse.id)}
                className={`p-2 rounded-full transition-colors ${
                  progress.bookmarks.includes(currentVerse.id)
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <Bookmark 
                  className="w-5 h-5" 
                  fill={progress.bookmarks.includes(currentVerse.id) ? 'currentColor' : 'none'} 
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="bg-blue-50 rounded-full p-3 w-fit mb-3">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">5-Min Session</h4>
          <p className="text-sm text-gray-600 mb-3">Quick reading for busy schedules</p>
          <button 
            onClick={handleStartReading}
            className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start Reading
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="bg-amber-50 rounded-full p-3 w-fit mb-3">
            <BookmarkCheck className="w-6 h-6 text-amber-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Bookmarks</h4>
          <p className="text-sm text-gray-600 mb-3">{progress.bookmarks.length} saved verses</p>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className="w-full bg-amber-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      {/* Surah Selector Modal */}
      {renderSurahSelector()}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'search':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Quran</h2>
              <div className="relative mb-4">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search verses, surahs..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors mb-4"
              >
                Search
              </button>
              
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleVerseSelect(result)}>
                      <p className="font-medium text-gray-900">Surah {result.surah} • Ayah {result.ayah}</p>
                      <p className="text-gray-700 mt-2">{result.translation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'bookmarks':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bookmarked Verses</h2>
              {progress.bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {verses.filter(v => progress.bookmarks.includes(v.id)).map(verse => (
                    <div key={verse.id} className="border border-gray-200 rounded-xl p-4">
                      <p className="font-medium text-gray-900">Surah {verse.surah} • Ayah {verse.ayah}</p>
                      <p className="text-gray-700 mt-2">{verse.translation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center">No bookmarks yet</p>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Reading Preferences</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'arabic', label: 'Arabic Only' },
                      { value: 'translation', label: 'Translation Only' },
                      { value: 'both', label: 'Arabic + Translation' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="readingMode"
                          value={option.value}
                          checked={readingMode === option.value}
                          onChange={(e) => setReadingMode(e.target.value as any)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Daily Goal</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={progress.dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-gray-700 font-medium">{progress.dailyGoal} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return renderHomeContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session End Handler */}
      {sessionStart && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={handleEndReading}
            className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
          >
            End Session
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QuranConnect</h1>
            <p className="text-sm text-gray-600">Stay connected with your faith</p>
          </div>
          <div className="bg-emerald-100 rounded-full p-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-24">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'bookmarks', icon: Bookmark, label: 'Saved' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
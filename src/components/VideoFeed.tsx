'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  RefreshCw, 
  Plus, 
  Check, 
  ChevronDown,
  Flame,
  Music,
  Gamepad2,
  Newspaper,
  Trophy,
  Tv,
  GraduationCap,
  Cpu,
  Search,
  X,
  Shuffle,
  Sparkles,
  Clock,
  Calendar,
  Globe,
  Users,
  Filter,
  Heart,
  Snowflake,
  Sun,
  Leaf,
  TreeDeciduous,
  Gift,
  Ghost,
  Star,
  Zap,
  TrendingUp,
  Play,
} from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from './AuthProvider'
import type { Video } from '@/types'

const CATEGORIES = [
  { id: 'foryou', label: 'For You', icon: Heart, special: true },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Tv },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'technology', label: 'Technology', icon: Cpu },
]

const DURATION_OPTIONS = [
  { value: '', label: 'Any Duration' },
  { value: 'short', label: 'Short (<5 min)' },
  { value: 'medium', label: 'Medium (5-20 min)' },
  { value: 'long', label: 'Long (>20 min)' },
]

const UPLOAD_DATE_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

const POPULARITY_OPTIONS = [
  { value: '', label: 'Any Popularity' },
  { value: 'mainstream', label: 'Mainstream Hits' },
  { value: 'rising', label: 'Rising Stars' },
  { value: 'undiscovered', label: 'Hidden Gems' },
]

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Any Language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'it', label: 'Italian' },
]

const REGION_OPTIONS = [
  { value: '', label: 'Any Region' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'IN', label: 'India' },
  { value: 'ES', label: 'Spain' },
]

const THEMED_OPTIONS = [
  { id: 'holidays', label: 'Holidays', icon: Gift, themes: [
    { value: 'christmas', label: 'Christmas', icon: Snowflake },
    { value: 'halloween', label: 'Halloween', icon: Ghost },
    { value: 'thanksgiving', label: 'Thanksgiving', icon: TreeDeciduous },
    { value: 'newyear', label: 'New Year', icon: Star },
    { value: 'valentines', label: "Valentine's", icon: Heart },
    { value: 'easter', label: 'Easter', icon: Gift },
  ]},
  { id: 'seasons', label: 'Seasons', icon: Sun, themes: [
    { value: 'summer', label: 'Summer Vibes', icon: Sun },
    { value: 'winter', label: 'Winter Cozy', icon: Snowflake },
    { value: 'spring', label: 'Spring Energy', icon: Leaf },
    { value: 'fall', label: 'Fall Aesthetic', icon: TreeDeciduous },
  ]},
  { id: 'events', label: 'Events', icon: Trophy, themes: [
    { value: 'olympics', label: 'Olympics', icon: Trophy },
    { value: 'worldcup', label: 'World Cup', icon: Trophy },
    { value: 'superbowl', label: 'Super Bowl', icon: Trophy },
    { value: 'e3', label: 'E3 Gaming', icon: Gamepad2 },
    { value: 'oscars', label: 'Oscars', icon: Star },
    { value: 'grammys', label: 'Grammys', icon: Music },
  ]},
]

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2005; year--) {
    years.push({ value: year.toString(), label: year.toString() })
  }
  return years
}

const YEAR_OPTIONS = [{ value: '', label: 'Any Year' }, ...generateYearOptions()]

interface FilterDropdownProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs text-white/50 mb-1.5">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1a1a1a] border text-sm transition-all ${
          isOpen 
            ? 'border-red-500/50 ring-1 ring-red-500/25' 
            : value 
              ? 'border-red-500/30 text-white' 
              : 'border-white/10 text-white/70 hover:border-white/20'
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl"
            style={{ minWidth: '100%' }}
          >
            <div className="p-1.5">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    value === option.value
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                  {value === option.value && (
                    <Check className="h-4 w-4 ml-auto text-red-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface PlaylistOption {
  id: string
  name: string
  video_count: number
}

interface VideoFeedProps {
  playlists: PlaylistOption[]
  onAddToPlaylist: (playlistId: string, video: Video) => Promise<void>
}

interface Filters {
  duration: string
  uploadDate: string
  yearFrom: string
  yearTo: string
  popularity: string
  language: string
  region: string
  theme: string
}

export function VideoFeed({ playlists, onAddToPlaylist }: VideoFeedProps) {
  const { user } = useAuth()
  
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('foryou')
  const [addingVideo, setAddingVideo] = useState<string | null>(null)
  const [addedVideos, setAddedVideos] = useState<Record<string, string>>({})
  const [showPlaylistPicker, setShowPlaylistPicker] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [moodText, setMoodText] = useState('')
  const [moodLoading, setMoodLoading] = useState(false)
  const [detectedMood, setDetectedMood] = useState<{ mood: string, emoji: string } | null>(null)
  
  const [filters, setFilters] = useState<Filters>({
    duration: '',
    uploadDate: '',
    yearFrom: '',
    yearTo: '',
    popularity: '',
    language: '',
    region: '',
    theme: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showThemedPicker, setShowThemedPicker] = useState<string | null>(null)
  
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isPersonalized, setIsPersonalized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('searchHistory')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  const saveSearchHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  const fetchVideos = useCallback(async (options?: { shuffle?: boolean, moodQueries?: string[] }) => {
    setLoading(true)
    setError(null)

    try {
      if (category === 'foryou' && !options?.moodQueries) {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
        
        const response = await fetch('/api/for-you', {
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`,
          } : {},
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch personalized feed')
        }
        
        setVideos(data.videos || [])
        setIsPersonalized(data.isPersonalized || false)
        setLoading(false)
        return
      }

      const params = new URLSearchParams()
      params.set('category', category)
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }
      
      if (options?.shuffle) {
        params.set('shuffle', 'true')
      }
      
      if (filters.duration) params.set('duration', filters.duration)
      if (filters.uploadDate) params.set('uploadDate', filters.uploadDate)
      if (filters.yearFrom) params.set('yearFrom', filters.yearFrom)
      if (filters.yearTo) params.set('yearTo', filters.yearTo)
      if (filters.popularity) params.set('popularity', filters.popularity)
      if (filters.language) params.set('language', filters.language)
      if (filters.region) params.set('region', filters.region)
      if (filters.theme) params.set('theme', filters.theme)

      const response = await fetch(`/api/feed?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos')
      }

      setVideos(data.videos)
      setIsPersonalized(false)
    } catch (err) {
      console.error('Error fetching feed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [category, searchQuery, filters])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim())
      setShowSearchHistory(false)
      fetchVideos()
    }
  }, [searchQuery, fetchVideos])

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchVideos()
      }, 500)
    }
  }, [fetchVideos])

  const handleMoodDetect = useCallback(async () => {
    if (!moodText.trim() || moodLoading) return
    
    setMoodLoading(true)
    
    try {
      const response = await fetch('/api/mood-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodText: moodText.trim() }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.searchQueries) {
        setDetectedMood({ mood: data.detectedMood, emoji: data.moodEmoji })
        setSearchQuery(data.searchQueries[0])
        
        if (data.suggestedFilters?.duration) {
          setFilters(prev => ({ ...prev, duration: data.suggestedFilters.duration }))
        }
        if (data.suggestedFilters?.theme) {
          setFilters(prev => ({ ...prev, theme: data.suggestedFilters.theme }))
        }
        
        fetchVideos()
      }
    } catch (err) {
      console.error('Mood detection failed:', err)
    } finally {
      setMoodLoading(false)
    }
  }, [moodText, moodLoading, fetchVideos])

  const handleShuffle = useCallback(() => {
    setCategory('trending')
    setFilters(prev => ({ ...prev, popularity: 'undiscovered' }))
    fetchVideos({ shuffle: true })
  }, [fetchVideos])

  const handleAddToPlaylist = async (playlistId: string, video: Video) => {
    setAddingVideo(video.id)
    setShowPlaylistPicker(null)
    
    try {
      await onAddToPlaylist(playlistId, video)
      setAddedVideos(prev => ({ ...prev, [video.id]: playlistId }))
    } catch (err) {
      console.error('Error adding to playlist:', err)
    } finally {
      setAddingVideo(null)
    }
  }

  const handlePreviewEnter = useCallback((videoId: string) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewVideo(videoId)
    }, 500)
  }, [])

  const handlePreviewLeave = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    setPreviewVideo(null)
  }, [])

  const clearFilters = () => {
    setFilters({
      duration: '',
      uploadDate: '',
      yearFrom: '',
      yearTo: '',
      popularity: '',
      language: '',
      region: '',
      theme: '',
    })
    setDetectedMood(null)
    setMoodText('')
    setSearchQuery('')
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="space-y-6">
      {/* Search, Mood, and Surprise Me Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
              placeholder="Search videos..."
              className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); fetchVideos() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
          
          {/* Search History Dropdown */}
          <AnimatePresence>
            {showSearchHistory && searchHistory.length > 0 && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-2 w-full rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl overflow-hidden"
              >
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-white/50">Recent Searches</p>
                  {searchHistory.map((query, i) => (
                    <button
                      key={i}
                      onMouseDown={() => { setSearchQuery(query); fetchVideos() }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <Clock className="h-4 w-4 text-white/40" />
                      {query}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mood Detection Input */}
        <div className="relative lg:w-80">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400/60" />
              <input
                type="text"
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMoodDetect()}
                placeholder="How are you feeling?"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
              />
            </div>
            <Button
              onClick={handleMoodDetect}
              disabled={!moodText.trim() || moodLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {moodLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            </Button>
          </div>
          
          {detectedMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white font-medium"
            >
              {detectedMood.emoji} {detectedMood.mood}
            </motion.div>
          )}
        </div>

        {/* Surprise Me Button */}
        <Button
          onClick={handleShuffle}
          variant="outline"
          className="lg:w-auto border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <Shuffle className="h-5 w-5 mr-2" />
          Surprise Me
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  category === cat.id
                    ? cat.special 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-red-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
                {cat.special && category === cat.id && isPersonalized && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">AI</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`whitespace-nowrap ${hasActiveFilters ? 'border-red-500/50 text-red-400' : ''}`}
          >
            <Filter className={`h-4 w-4 mr-2 ${showFilters ? 'rotate-180' : ''} transition-transform`} />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVideos()}
            disabled={loading}
            className="whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-visible"
          >
            <div className="glass rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Duration */}
                <FilterDropdown
                  label="Duration"
                  value={filters.duration}
                  options={DURATION_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, duration: val }))}
                />

                {/* Upload Date */}
                <FilterDropdown
                  label="Upload Date"
                  value={filters.uploadDate}
                  options={UPLOAD_DATE_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, uploadDate: val }))}
                />

                {/* Year From */}
                <FilterDropdown
                  label="Year From"
                  value={filters.yearFrom}
                  options={YEAR_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, yearFrom: val }))}
                />

                {/* Year To */}
                <FilterDropdown
                  label="Year To"
                  value={filters.yearTo}
                  options={YEAR_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, yearTo: val }))}
                />

                {/* Popularity */}
                <FilterDropdown
                  label="Popularity"
                  value={filters.popularity}
                  options={POPULARITY_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, popularity: val }))}
                />

                {/* Language */}
                <FilterDropdown
                  label="Language"
                  value={filters.language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, language: val }))}
                />
              </div>

              {/* Second row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Region */}
                <FilterDropdown
                  label="Region"
                  value={filters.region}
                  options={REGION_OPTIONS}
                  onChange={(val) => setFilters(prev => ({ ...prev, region: val }))}
                />
              </div>

              {/* Themed Discovery */}
              <div className="pt-2 border-t border-white/5">
                <label className="block text-xs text-white/50 mb-3">Themed Discovery</label>
                <div className="flex flex-wrap gap-3">
                  {THEMED_OPTIONS.map((group) => (
                    <div key={group.id} className="relative">
                      <button
                        onClick={() => setShowThemedPicker(showThemedPicker === group.id ? null : group.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          filters.theme && group.themes.some(t => t.value === filters.theme)
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400'
                            : 'bg-[#1a1a1a] border border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <group.icon className="h-4 w-4" />
                        {group.label}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showThemedPicker === group.id ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showThemedPicker === group.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-[100] mt-2 w-52 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl"
                          >
                            <div className="p-1.5">
                              {group.themes.map((theme) => (
                                <button
                                  key={theme.value}
                                  onClick={() => {
                                    setFilters(prev => ({ 
                                      ...prev, 
                                      theme: prev.theme === theme.value ? '' : theme.value 
                                    }))
                                    setShowThemedPicker(null)
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                                    filters.theme === theme.value
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <theme.icon className="h-4 w-4" />
                                  <span className="flex-1">{theme.label}</span>
                                  {filters.theme === theme.value && (
                                    <Check className="h-4 w-4 text-amber-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* For You Message */}
      {category === 'foryou' && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-3 rounded-xl ${
            isPersonalized 
              ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20'
              : 'bg-white/5 border border-white/10'
          }`}
        >
          <Heart className={`h-5 w-5 ${isPersonalized ? 'text-pink-400' : 'text-white/40'}`} />
          <p className="text-sm text-white/70">
            {isPersonalized 
              ? 'Personalized recommendations based on your playlists'
              : 'Create and save playlists to get personalized recommendations'}
          </p>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => fetchVideos()}>Try Again</Button>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20">
          <Search className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
          <p className="text-white/60 mb-6">Try adjusting your search or filters</p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group glass rounded-xl"
              onMouseEnter={() => handlePreviewEnter(video.id)}
              onMouseLeave={handlePreviewLeave}
            >
              {/* Thumbnail / Preview */}
              <div className="aspect-video relative rounded-t-xl overflow-hidden">
                {previewVideo === video.id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&start=30&controls=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                ) : (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Play indicator on hover */}
                {previewVideo !== video.id && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                )}
                
                {/* Add button overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3 flex justify-center">
                    {addedVideos[video.id] ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm">
                        <Check className="h-4 w-4" />
                        Added
                      </div>
                    ) : playlists.length === 0 ? (
                      <div className="px-4 py-2 rounded-full bg-white/20 text-white text-sm">
                        Create a playlist first
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowPlaylistPicker(showPlaylistPicker === video.id ? null : video.id)
                          }}
                          disabled={addingVideo === video.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
                        >
                          {addingVideo === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Add to Playlist
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {/* Playlist picker dropdown */}
                        <AnimatePresence>
                          {showPlaylistPicker === video.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl z-[100]"
                            >
                              <div className="p-1.5 max-h-56 overflow-y-auto">
                                <p className="px-3 py-2 text-xs text-white/40 font-medium">Select Playlist</p>
                                {playlists.map((playlist) => (
                                  <button
                                    key={playlist.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddToPlaylist(playlist.id, video)
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                                  >
                                    <span className="truncate text-sm">{playlist.name}</span>
                                    <span className="text-xs text-white/40 ml-2 flex-shrink-0">
                                      {playlist.video_count} videos
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
                  {video.title}
                </h3>
                <p className="text-xs text-white/50 truncate">
                  {video.channelTitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Coming Soon: Trending in Community */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Trending in Community</h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-white/60 mt-1">
                See what other PlaylistHero users are adding to their playlists
              </p>
            </div>
          </div>
          <Users className="h-8 w-8 text-white/20" />
        </div>
      </motion.div>
    </div>
  )
}

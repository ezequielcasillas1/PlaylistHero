'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Music2, ListMusic, AlertCircle, Smile, ChevronDown, Wand2, Loader2, Gift, Video as VideoIcon, BookOpen, Clock, Users, User, Search, X, Save, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { VideoGrid } from './VideoGrid'
import { YouTubeEmbed } from './YouTubeEmbed'
import { UpgradeModal } from './UpgradeModal'
import { SavePlaylistModal } from './SavePlaylistModal'
import { Video, FREE_PROMPT_LIMIT } from '@/types'
import { getFingerprint } from '@/lib/fingerprint'
import { useAuth } from './AuthProvider'

const VIDEO_COUNT_OPTIONS = [10, 20, 30, 50, 100]

interface Creator {
  id: string
  title: string
  thumbnail: string
  subscriberCount?: string
  description?: string
}

const MOOD_OPTIONS = [
  { value: '', label: 'Any mood', emoji: '🎯', contentType: 'general' },
  { value: 'happy', label: 'Happy', emoji: '😊', contentType: 'music' },
  { value: 'sad', label: 'Sad', emoji: '😢', contentType: 'music' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡', contentType: 'music' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌', contentType: 'music' },
  { value: 'focused', label: 'Focused', emoji: '🎯', contentType: 'music' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', contentType: 'music' },
  { value: 'romantic', label: 'Romantic', emoji: '💕', contentType: 'music' },
  { value: 'angry', label: 'Angry', emoji: '😤', contentType: 'music' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🥹', contentType: 'music' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟', contentType: 'general' },
  { value: 'melancholic', label: 'Melancholic', emoji: '🌧️', contentType: 'music' },
  { value: 'excited', label: 'Excited', emoji: '🎉', contentType: 'music' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🕊️', contentType: 'music' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🏔️', contentType: 'general' },
  { value: 'mysterious', label: 'Mysterious', emoji: '🔮', contentType: 'music' },
  { value: 'playful', label: 'Playful', emoji: '🎮', contentType: 'general' },
  { value: 'confident', label: 'Confident', emoji: '💪', contentType: 'music' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏', contentType: 'music' },
  { value: 'lonely', label: 'Lonely', emoji: '🌙', contentType: 'music' },
  { value: 'inspired', label: 'Inspired', emoji: '💡', contentType: 'general' },
  { value: 'christlike', label: 'Christ Like', emoji: '✝️', contentType: 'spiritual' },
]

const getTimeRangeOptions = () => {
  const currentYear = new Date().getFullYear()
  return [
    { value: 'all', label: 'All Time', tooltip: 'No date filter' },
    { value: 'latest', label: 'Latest', tooltip: `${currentYear}` },
    { value: 'awhile', label: 'A While Ago', tooltip: `${currentYear - 6}-${currentYear - 1}` },
    { value: 'atime', label: 'A Time Ago', tooltip: `${currentYear - 11}-${currentYear - 7}` },
    { value: 'longtime', label: 'Long Time Ago', tooltip: `Before ${currentYear - 11}` },
  ]
}

const ContentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'music':
      return <Music2 className="h-3 w-3 text-pink-400" />
    case 'spiritual':
      return <BookOpen className="h-3 w-3 text-amber-400" />
    case 'general':
    default:
      return <VideoIcon className="h-3 w-3 text-blue-400" />
  }
}

interface PlaylistGeneratorProps {
  onPlaylistSaved?: () => void
}

export function PlaylistGenerator({ onPlaylistSaved }: PlaylistGeneratorProps = {}) {
  const [prompt, setPrompt] = useState('')
  const [videoCount, setVideoCount] = useState(20)
  const [mood, setMood] = useState('')
  const [enhancedPromptText, setEnhancedPromptText] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isSurprising, setIsSurprising] = useState(false)
  const [timeRange, setTimeRange] = useState<'all' | 'latest' | 'awhile' | 'atime' | 'longtime'>('all')
  const [showMoodDropdown, setShowMoodDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [remainingCount, setRemainingCount] = useState(FREE_PROMPT_LIMIT)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [playlistSaved, setPlaylistSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTier] = useState<'free' | 'paid'>('free')
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  
  const { user } = useAuth()
  
  // Creator mode state
  const [creatorMode, setCreatorMode] = useState<'multiple' | 'one'>('multiple')
  const [creatorSearch, setCreatorSearch] = useState('')
  const [creatorResults, setCreatorResults] = useState<Creator[]>([])
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [isSearchingCreators, setIsSearchingCreators] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [hasMoreCreators, setHasMoreCreators] = useState(false)
  const creatorListRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize fingerprint and fetch server-side usage count
  useEffect(() => {
    async function initUsage() {
      const fp = await getFingerprint()
      setFingerprint(fp)

      try {
        const response = await fetch('/api/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp }),
        })
        const data = await response.json()
        if (data.remainingCount !== undefined) {
          setRemainingCount(data.remainingCount)
        }
      } catch (err) {
        console.error('Failed to fetch usage:', err)
      }
    }
    initUsage()
  }, [])

  // Creator search with debounce
  const searchCreators = useCallback(async (query: string, pageToken?: string) => {
    if (query.trim().length < 2) {
      setCreatorResults([])
      setHasMoreCreators(false)
      return
    }

    setIsSearchingCreators(true)
    try {
      const response = await fetch('/api/search-creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          mood: mood || undefined,
          prompt: prompt || undefined,
          pageToken,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        if (pageToken) {
          setCreatorResults(prev => [...prev, ...data.channels])
        } else {
          setCreatorResults(data.channels || [])
        }
        setNextPageToken(data.nextPageToken)
        setHasMoreCreators(!!data.nextPageToken)
      }
    } catch (err) {
      console.error('Failed to search creators:', err)
    } finally {
      setIsSearchingCreators(false)
    }
  }, [mood, prompt])

  // Debounced search effect
  useEffect(() => {
    if (creatorMode !== 'one' || selectedCreator) return
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (creatorSearch.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCreators(creatorSearch)
      }, 300)
    } else {
      setCreatorResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [creatorSearch, creatorMode, selectedCreator, searchCreators])

  // Infinite scroll handler
  const handleCreatorScroll = useCallback(() => {
    if (!creatorListRef.current || isSearchingCreators || !hasMoreCreators) return
    
    const { scrollTop, scrollHeight, clientHeight } = creatorListRef.current
    if (scrollHeight - scrollTop - clientHeight < 50) {
      searchCreators(creatorSearch, nextPageToken || undefined)
    }
  }, [isSearchingCreators, hasMoreCreators, searchCreators, creatorSearch, nextPageToken])

  const handleSelectCreator = useCallback((creator: Creator) => {
    setSelectedCreator(creator)
    setCreatorResults([])
    setCreatorSearch('')
  }, [])

  const handleClearCreator = useCallback(() => {
    setSelectedCreator(null)
    setCreatorSearch('')
    setCreatorResults([])
  }, [])

  const handleGenerate = useCallback(async () => {
    const hasPrompt = prompt.trim().length > 0
    const hasCreator = creatorMode === 'one' && selectedCreator
    
    if (!hasPrompt && !hasCreator) return
    if (!fingerprint) return

    if (userTier === 'free' && remainingCount <= 0) {
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setVideos([])
    setSelectedVideo(null)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: hasPrompt ? prompt : undefined, 
          videoCount, 
          fingerprint,
          mood: mood || undefined,
          timeRange: timeRange !== 'all' ? timeRange : undefined,
          creatorChannelId: hasCreator ? selectedCreator.id : undefined,
        }),
      })

      const data = await response.json()

      if (response.status === 429 || data.limitReached) {
        setRemainingCount(0)
        setShowUpgradeModal(true)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate playlist')
      }

      setPlaylistTitle(data.playlistTitle)
      setPlaylistDescription(data.playlistDescription)
      setVideos(data.videos)

      if (data.enhancedPrompt) {
        setEnhancedPromptText(data.enhancedPrompt)
      } else {
        setEnhancedPromptText(null)
      }

      if (data.videos.length > 0) {
        setSelectedVideo(data.videos[0])
      }

      if (data.remainingCount !== undefined) {
        setRemainingCount(data.remainingCount)
      }
    } catch (err) {
      console.error('Error generating playlist:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, videoCount, remainingCount, userTier, fingerprint, mood, timeRange, creatorMode, selectedCreator])

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || isEnhancing) return

    setIsEnhancing(true)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mood: mood || undefined }),
      })

      const data = await response.json()
      if (response.ok && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt)
      }
    } catch (err) {
      console.error('Failed to enhance prompt:', err)
    } finally {
      setIsEnhancing(false)
    }
  }, [prompt, mood, isEnhancing])

  const handleSurpriseMe = useCallback(async () => {
    if (isSurprising) return

    setIsSurprising(true)
    try {
      const response = await fetch('/api/surprise-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: mood || undefined }),
      })

      const data = await response.json()
      if (response.ok && data.surprisePrompt) {
        setPrompt(data.surprisePrompt)
      }
    } catch (err) {
      console.error('Failed to generate surprise prompt:', err)
    } finally {
      setIsSurprising(false)
    }
  }, [mood, isSurprising])

  return (
    <section id="generator" className="relative py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Generate Your Playlist
          </h2>
          <p className="text-white/60 text-sm max-w-xl mx-auto">
            Describe what you&apos;re looking for and we&apos;ll create the perfect playlist for you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass rounded-3xl p-4 sm:p-6 glow-red">
            {/* Free tier indicator */}
            {userTier === 'free' && (
              <div className="flex items-center justify-between mb-4 p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-white/70">Free Plan</span>
                </div>
                <span className={`text-sm ${remainingCount <= 0 ? 'text-red-400' : 'text-white/50'}`}>
                  {remainingCount} generations left
                </span>
              </div>
            )}

            {/* Generation options helper text */}
            <div className="mb-4 text-center">
              <p className="text-xs text-white/60">
                Generate by <span className="text-violet-400">selecting one creator</span> or <span className="text-emerald-400">describing what you want</span> with filters
              </p>
            </div>

            {/* Mood selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Smile className="inline h-4 w-4 mr-2" />
                How are you feeling?
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowMoodDropdown(!showMoodDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{MOOD_OPTIONS.find(m => m.value === mood)?.emoji || '🎯'}</span>
                    <span>{MOOD_OPTIONS.find(m => m.value === mood)?.label || 'Select your mood'}</span>
                    <ContentTypeIcon type={MOOD_OPTIONS.find(m => m.value === mood)?.contentType || 'general'} />
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMoodDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showMoodDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl"
                    >
                      {MOOD_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setMood(option.value)
                            setShowMoodDropdown(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                            mood === option.value ? 'bg-red-500/20 text-red-400' : 'text-white/80'
                          }`}
                        >
                          <span className="text-lg">{option.emoji}</span>
                          <span className="flex-1">{option.label}</span>
                          <ContentTypeIcon type={option.contentType} />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Prompt input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Music2 className="inline h-4 w-4 mr-2" />
                Describe what you want to watch
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Chill lofi beats for late night coding, today's tech news and reviews, football highlights from this week, relaxing nature documentaries..."
                className="min-h-[80px]"
              />
              
              {/* Hero toggle buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                {/* Be My Hero and Enhance me toggle */}
                <button
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className={`flex items-center gap-3 cursor-pointer group text-left ${
                    !prompt.trim() && !isEnhancing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="relative">
                    <div className={`w-10 h-6 rounded-full border transition-colors ${
                      isEnhancing 
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-500/50' 
                        : 'bg-white/10 border-white/20 group-hover:bg-white/15'
                    }`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${
                      isEnhancing 
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 translate-x-4' 
                        : 'bg-white/50 group-hover:bg-white/70'
                    }`} />
                  </div>
                  <span className={`flex items-center gap-2 text-sm transition-colors ${
                    isEnhancing 
                      ? 'text-purple-400' 
                      : 'text-white/60 group-hover:text-white/80'
                  }`}>
                    {isEnhancing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Enhance me
                      </>
                    )}
                  </span>
                </button>

                {/* Be My Hero and Surprise me toggle */}
                <button
                  onClick={handleSurpriseMe}
                  disabled={isSurprising}
                  className={`flex items-center gap-3 cursor-pointer group text-left ${
                    isSurprising ? '' : ''
                  }`}
                >
                  <div className="relative">
                    <div className={`w-10 h-6 rounded-full border transition-colors ${
                      isSurprising 
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-500/50' 
                        : 'bg-white/10 border-white/20 group-hover:bg-white/15'
                    }`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${
                      isSurprising 
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 translate-x-4' 
                        : 'bg-white/50 group-hover:bg-white/70'
                    }`} />
                  </div>
                  <span className={`flex items-center gap-2 text-sm transition-colors ${
                    isSurprising 
                      ? 'text-amber-400' 
                      : 'text-white/60 group-hover:text-white/80'
                  }`}>
                    {isSurprising ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Surprising...
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4" />
                        Surprise me
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Time Range Filter */}
              <div className="mt-3">
                <label className="flex items-center gap-2 text-xs text-white/60 mb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Time Range
                </label>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  {getTimeRangeOptions().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeRange(option.value as typeof timeRange)}
                      className={`relative flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-300 group ${
                        timeRange === option.value
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <span className="block truncate">{option.label}</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {option.tooltip}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Creator Mode Filter */}
              <div className="mt-3">
                <label className="flex items-center gap-2 text-xs text-white/60 mb-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Creator Source
                </label>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => {
                      setCreatorMode('multiple')
                      setSelectedCreator(null)
                      setCreatorSearch('')
                      setCreatorResults([])
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      creatorMode === 'multiple'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Multiple Creators
                  </button>
                  <button
                    onClick={() => setCreatorMode('one')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      creatorMode === 'one'
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    One Creator
                  </button>
                </div>

                {/* Creator Search (shown when "One Creator" is selected) */}
                <AnimatePresence>
                  {creatorMode === 'one' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      {/* Selected Creator Display */}
                      {selectedCreator ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30">
                          <img
                            src={selectedCreator.thumbnail}
                            alt={selectedCreator.title}
                            className="w-10 h-10 rounded-full object-cover bg-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{selectedCreator.title}</p>
                            {selectedCreator.subscriberCount && (
                              <p className="text-xs text-white/50">{selectedCreator.subscriberCount} subscribers</p>
                            )}
                          </div>
                          <button
                            onClick={handleClearCreator}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <X className="h-4 w-4 text-white/60" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                            <input
                              type="text"
                              value={creatorSearch}
                              onChange={(e) => setCreatorSearch(e.target.value)}
                              placeholder="Search creator name..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                            />
                            {isSearchingCreators && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400 animate-spin" />
                            )}
                          </div>

                          {/* Creator Results List */}
                          {creatorResults.length > 0 && (
                            <div
                              ref={creatorListRef}
                              onScroll={handleCreatorScroll}
                              className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-[#1a1a1a] border border-white/10"
                            >
                              {creatorResults.map((creator) => (
                                <button
                                  key={creator.id}
                                  onClick={() => handleSelectCreator(creator)}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                >
                                  <img
                                    src={creator.thumbnail}
                                    alt={creator.title}
                                    className="w-10 h-10 rounded-full object-cover bg-white/10"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-white truncate">{creator.title}</p>
                                    <p className="text-xs text-white/50 truncate">
                                      {creator.subscriberCount && `${creator.subscriberCount} subscribers`}
                                      {creator.subscriberCount && creator.description && ' • '}
                                      {creator.description}
                                    </p>
                                  </div>
                                </button>
                              ))}
                              {isSearchingCreators && hasMoreCreators && (
                                <div className="flex items-center justify-center p-3">
                                  <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* No Results Message */}
                          {creatorSearch.length >= 2 && !isSearchingCreators && creatorResults.length === 0 && (
                            <p className="mt-2 text-sm text-white/50 text-center py-4">
                              No creators found. Try a different search.
                            </p>
                          )}

                          {/* Hint */}
                          {creatorSearch.length < 2 && creatorSearch.length > 0 && (
                            <p className="mt-2 text-xs text-white/40 text-center">
                              Type at least 2 characters to search
                            </p>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Video count selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-white/80 mb-2">
                <ListMusic className="inline h-3.5 w-3.5 mr-1.5" />
                Number of videos
              </label>
              <div className="flex flex-wrap gap-2">
                {VIDEO_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setVideoCount(count)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      videoCount === count
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() && !(creatorMode === 'one' && selectedCreator)}
              loading={isLoading}
              className="w-full"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {creatorMode === 'one' && selectedCreator && !prompt.trim()
                ? `Generate from ${selectedCreator.title}`
                : 'Generate Playlist'}
            </Button>
          </div>
        </motion.div>

        {/* Results section */}
        <AnimatePresence>
          {videos.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mt-16"
            >
              {/* Playlist header */}
              <div className="text-center mb-8">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  {playlistTitle}
                </motion.h3>
                <p className="text-white/60 mb-4">{playlistDescription}</p>
                
                {/* Save playlist button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {playlistSaved ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      <Check className="h-4 w-4" />
                      Playlist Saved!
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowSaveModal(true)}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {user ? 'Save to My Playlists' : 'Save Playlist'}
                    </Button>
                  )}
                  {!user && (
                    <p className="text-xs text-white/50 mt-2">
                      Create an account to save permanently
                    </p>
                  )}
                </motion.div>
                
                {/* Enhanced prompt display */}
                {enhancedPromptText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 max-w-2xl mx-auto"
                  >
                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                      <Wand2 className="h-4 w-4" />
                      AI Enhanced Prompt
                    </div>
                    <p className="text-white/70 text-sm italic">&ldquo;{enhancedPromptText}&rdquo;</p>
                  </motion.div>
                )}
              </div>

              {/* YouTube embed */}
              {selectedVideo && (
                <div className="max-w-4xl mx-auto mb-12">
                  <YouTubeEmbed videoId={selectedVideo.id} />
                  <div className="mt-4 text-center">
                    <h4 className="text-lg font-semibold text-white">
                      {selectedVideo.title}
                    </h4>
                    <p className="text-white/50">{selectedVideo.channelTitle}</p>
                  </div>
                </div>
              )}

              {/* Video grid */}
              <VideoGrid
                videos={videos}
                selectedVideoId={selectedVideo?.id}
                onVideoSelect={setSelectedVideo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-16 text-center"
            >
              <div className="inline-flex flex-col items-center gap-4 p-8 glass rounded-2xl">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-red-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">Creating your playlist...</p>
                  <p className="text-sm text-white/50">This might take a few seconds</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <SavePlaylistModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        videos={videos}
        suggestedName={playlistTitle}
        suggestedDescription={playlistDescription}
        prompt={prompt}
        onSaved={() => {
          setPlaylistSaved(true)
          setShowSaveModal(false)
          onPlaylistSaved?.()
        }}
      />
    </section>
  )
}

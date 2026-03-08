'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Music2, ListMusic, AlertCircle, Smile, ChevronDown, Wand2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { VideoGrid } from './VideoGrid'
import { YouTubeEmbed } from './YouTubeEmbed'
import { UpgradeModal } from './UpgradeModal'
import { Video, FREE_PROMPT_LIMIT } from '@/types'
import { getFingerprint } from '@/lib/fingerprint'

const VIDEO_COUNT_OPTIONS = [10, 20, 30, 50, 100]

const MOOD_OPTIONS = [
  { value: '', label: 'Any mood', emoji: '🎯' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'focused', label: 'Focused', emoji: '🎯' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'angry', label: 'Angry', emoji: '😤' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🥹' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'melancholic', label: 'Melancholic', emoji: '🌧️' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🏔️' },
  { value: 'mysterious', label: 'Mysterious', emoji: '🔮' },
  { value: 'playful', label: 'Playful', emoji: '🎮' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'lonely', label: 'Lonely', emoji: '🌙' },
  { value: 'inspired', label: 'Inspired', emoji: '💡' },
]

export function PlaylistGenerator() {
  const [prompt, setPrompt] = useState('')
  const [videoCount, setVideoCount] = useState(20)
  const [mood, setMood] = useState('')
  const [enhancePrompt, setEnhancePrompt] = useState(false)
  const [enhancedPromptText, setEnhancedPromptText] = useState<string | null>(null)
  const [showMoodDropdown, setShowMoodDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [remainingCount, setRemainingCount] = useState(FREE_PROMPT_LIMIT)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTier] = useState<'free' | 'paid'>('free')
  const [fingerprint, setFingerprint] = useState<string | null>(null)

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

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
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
          prompt, 
          videoCount, 
          fingerprint,
          mood: mood || undefined,
          enhancePrompt,
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
  }, [prompt, videoCount, remainingCount, userTier, fingerprint, mood, enhancePrompt])

  return (
    <section id="generator" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Generate Your Playlist
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
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
          <div className="glass rounded-3xl p-6 sm:p-8 glow-red">
            {/* Free tier indicator */}
            {userTier === 'free' && (
              <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-white/70">Free Plan</span>
                </div>
                <span className={`text-sm ${remainingCount <= 0 ? 'text-red-400' : 'text-white/50'}`}>
                  {remainingCount} generations left
                </span>
              </div>
            )}

            {/* Mood selector */}
            <div className="mb-6">
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
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Prompt input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Music2 className="inline h-4 w-4 mr-2" />
                Describe what you want to watch
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Chill lofi beats for late night coding, today's tech news and reviews, football highlights from this week, relaxing nature documentaries..."
                className="min-h-[120px]"
              />
              
              {/* AI Enhance toggle */}
              <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={enhancePrompt}
                    onChange={(e) => setEnhancePrompt(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full bg-white/10 border border-white/20 peer-checked:bg-red-500/30 peer-checked:border-red-500/50 transition-colors" />
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/50 peer-checked:bg-red-400 peer-checked:translate-x-4 transition-all" />
                </div>
                <span className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  <Wand2 className="h-4 w-4" />
                  Enhance my prompt with AI magic
                </span>
              </label>
            </div>

            {/* Video count selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-3">
                <ListMusic className="inline h-4 w-4 mr-2" />
                Number of videos
              </label>
              <div className="flex flex-wrap gap-2">
                {VIDEO_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setVideoCount(count)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
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
              disabled={!prompt.trim()}
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Playlist
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
                <p className="text-white/60">{playlistDescription}</p>
                
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
    </section>
  )
}

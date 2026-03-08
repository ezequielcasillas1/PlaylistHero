'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Music2, ListMusic } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { VideoGrid } from './VideoGrid'
import { YouTubeEmbed } from './YouTubeEmbed'
import { UpgradeModal } from './UpgradeModal'
import { Video, FREE_PROMPT_LIMIT } from '@/types'
import { searchVideos } from '@/lib/youtube'
import { generatePlaylistFromPrompt } from '@/lib/gemini'

const VIDEO_COUNT_OPTIONS = [10, 20, 30, 50, 100]

export function PlaylistGenerator() {
  const [prompt, setPrompt] = useState('')
  const [videoCount, setVideoCount] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [promptCount, setPromptCount] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [userTier] = useState<'free' | 'paid'>('free')

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    if (userTier === 'free' && promptCount >= FREE_PROMPT_LIMIT) {
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setVideos([])
    setSelectedVideo(null)

    try {
      const geminiResponse = await generatePlaylistFromPrompt(prompt, videoCount)
      setPlaylistTitle(geminiResponse.playlistTitle)
      setPlaylistDescription(geminiResponse.playlistDescription)

      const allVideos: Video[] = []
      const videosPerQuery = Math.ceil(videoCount / geminiResponse.searchQueries.length)

      for (const query of geminiResponse.searchQueries) {
        if (allVideos.length >= videoCount) break
        const results = await searchVideos(query, videosPerQuery)
        allVideos.push(...results)
      }

      const uniqueVideos = allVideos
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .slice(0, videoCount)

      setVideos(uniqueVideos)
      if (uniqueVideos.length > 0) {
        setSelectedVideo(uniqueVideos[0])
      }

      setPromptCount(prev => prev + 1)
    } catch (error) {
      console.error('Error generating playlist:', error)
    } finally {
      setIsLoading(false)
    }
  }, [prompt, videoCount, promptCount, userTier])

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
                <span className="text-sm text-white/50">
                  {FREE_PROMPT_LIMIT - promptCount} generations left
                </span>
              </div>
            )}

            {/* Prompt input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Music2 className="inline h-4 w-4 mr-2" />
                Describe your playlist vibe
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Chill lofi beats for late night coding sessions, epic orchestral music for studying, upbeat pop hits for a road trip..."
                className="min-h-[120px]"
              />
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

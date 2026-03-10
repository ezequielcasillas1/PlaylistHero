'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Play, 
  Pause,
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat,
  Repeat1,
  ListMusic,
  Loader2,
  Music2
} from 'lucide-react'
import { YouTubeEmbed } from './YouTubeEmbed'
import type { Video } from '@/types'

interface PlaylistDrawerProps {
  isOpen: boolean
  onClose: () => void
  playlist: {
    id: string
    name: string
    description?: string
    videos: Video[]
    video_count: number
  } | null
  initialVideoIndex?: number
}

type RepeatMode = 'off' | 'all' | 'one'

export function PlaylistDrawer({ 
  isOpen, 
  onClose, 
  playlist,
  initialVideoIndex = 0 
}: PlaylistDrawerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(true)

  const videos = playlist?.videos || []
  
  const safeIndex = Math.min(currentIndex, Math.max(0, videos.length - 1))
  const actualVideoIndex = isShuffled && shuffledOrder.length > 0 
    ? shuffledOrder[safeIndex] 
    : safeIndex
  const currentVideo = videos[actualVideoIndex]

  useEffect(() => {
    if (isOpen && playlist) {
      const validIndex = Math.min(initialVideoIndex, Math.max(0, playlist.videos.length - 1))
      setCurrentIndex(validIndex)
      setIsPlaying(true)
      setIsShuffled(false)
    }
  }, [isOpen, playlist?.id, initialVideoIndex])

  useEffect(() => {
    if (videos.length > 0) {
      const order = videos.map((_, i) => i)
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
      }
      setShuffledOrder(order)
    }
  }, [videos.length])

  const handleNext = useCallback(() => {
    if (videos.length === 0) return
    
    if (repeatMode === 'one') {
      setCurrentIndex(currentIndex)
      return
    }

    const nextIndex = currentIndex + 1
    if (nextIndex >= videos.length) {
      if (repeatMode === 'all') {
        setCurrentIndex(0)
      }
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentIndex, videos.length, repeatMode])

  const handlePrevious = useCallback(() => {
    if (videos.length === 0) return
    
    const prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        setCurrentIndex(videos.length - 1)
      }
    } else {
      setCurrentIndex(prevIndex)
    }
  }, [currentIndex, videos.length, repeatMode])

  const handleVideoSelect = (index: number) => {
    const actualIndex = isShuffled 
      ? shuffledOrder.indexOf(index)
      : index
    setCurrentIndex(actualIndex !== -1 ? actualIndex : index)
    setIsPlaying(true)
  }

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled)
    if (!isShuffled) {
      setCurrentIndex(0)
    }
  }

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one']
    const currentModeIndex = modes.indexOf(repeatMode)
    setRepeatMode(modes[(currentModeIndex + 1) % modes.length])
  }

  const getActualIndex = (displayIndex: number) => {
    return isShuffled ? shuffledOrder[displayIndex] : displayIndex
  }

  if (!playlist) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <ListMusic className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white truncate max-w-[250px] sm:max-w-[350px]">
                    {playlist.name}
                  </h2>
                  <p className="text-sm text-white/50">
                    {playlist.video_count} video{playlist.video_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {videos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Music2 className="h-16 w-16 text-white/20 mb-4" />
                  <p className="text-white/60 text-lg">This playlist is empty</p>
                  <p className="text-sm text-white/40 mt-1">Add some videos to get started</p>
                </div>
              ) : currentVideo ? (
                <div className="p-4 md:p-6 lg:p-8">
                  {/* Wide Video Player */}
                  <div className="max-w-5xl mx-auto">
                    <YouTubeEmbed videoId={currentVideo.id} autoplay={isPlaying} />
                    
                    {/* Video Info & Controls */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg line-clamp-1">
                          {currentVideo.title}
                        </h3>
                        <p className="text-sm text-white/50 mt-1">
                          {currentVideo.channelTitle}
                        </p>
                      </div>

                      {/* Playback Controls */}
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          onClick={toggleShuffle}
                          className={`p-2 rounded-lg transition-colors ${
                            isShuffled 
                              ? 'text-red-400 bg-red-500/20' 
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                          title="Shuffle"
                        >
                          <Shuffle className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={handlePrevious}
                          disabled={currentIndex === 0 && repeatMode !== 'all'}
                          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Previous"
                        >
                          <SkipBack className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                          title={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 text-white ml-0.5" />
                          )}
                        </button>
                        
                        <button
                          onClick={handleNext}
                          disabled={currentIndex === videos.length - 1 && repeatMode === 'off'}
                          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Next"
                        >
                          <SkipForward className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={cycleRepeat}
                          className={`p-2 rounded-lg transition-colors ${
                            repeatMode !== 'off' 
                              ? 'text-red-400 bg-red-500/20' 
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                          title={`Repeat: ${repeatMode}`}
                        >
                          {repeatMode === 'one' ? (
                            <Repeat1 className="h-5 w-5" />
                          ) : (
                            <Repeat className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Video Queue */}
                  <div className="mt-6 max-w-5xl mx-auto">
                    <p className="px-1 mb-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                      Playlist • {videos.length} video{videos.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {videos.map((video, index) => {
                        const isCurrentlyPlaying = index === actualVideoIndex
                        
                        return (
                          <motion.button
                            key={video.id}
                            onClick={() => handleVideoSelect(index)}
                            className={`group text-left rounded-lg overflow-hidden transition-all ${
                              isCurrentlyPlaying 
                                ? 'ring-2 ring-red-500' 
                                : 'hover:ring-2 hover:ring-white/30'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="relative aspect-video">
                              <img
                                src={video.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isCurrentlyPlaying ? (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <div className="flex items-center gap-0.5">
                                    <motion.div
                                      animate={{ height: [4, 16, 4] }}
                                      transition={{ repeat: Infinity, duration: 0.8 }}
                                      className="w-1 bg-red-500 rounded-full"
                                    />
                                    <motion.div
                                      animate={{ height: [12, 4, 12] }}
                                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                                      className="w-1 bg-red-500 rounded-full"
                                    />
                                    <motion.div
                                      animate={{ height: [4, 16, 4] }}
                                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                                      className="w-1 bg-red-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Play className="h-8 w-8 text-white" />
                                </div>
                              )}
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white/80">
                                {index + 1}
                              </div>
                            </div>
                            <div className="p-2 bg-white/5">
                              <p className={`text-xs font-medium line-clamp-2 ${
                                isCurrentlyPlaying ? 'text-red-400' : 'text-white'
                              }`}>
                                {video.title}
                              </p>
                              <p className="text-xs text-white/40 mt-0.5 truncate">
                                {video.channelTitle}
                              </p>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

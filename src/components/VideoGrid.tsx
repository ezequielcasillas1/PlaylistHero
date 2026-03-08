'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Video } from '@/types'

interface VideoGridProps {
  videos: Video[]
  selectedVideoId?: string
  onVideoSelect: (video: Video) => void
}

export function VideoGrid({ videos, selectedVideoId, onVideoSelect }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <button
            onClick={() => onVideoSelect(video)}
            className={`group w-full text-left rounded-xl overflow-hidden transition-all duration-300 ${
              selectedVideoId === video.id
                ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black/50'
                : 'hover:scale-[1.02]'
            }`}
          >
            <div className="relative aspect-video bg-white/5 overflow-hidden">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                  <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                </div>
              </div>
              {selectedVideoId === video.id && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500 text-xs font-medium text-white">
                  Now Playing
                </div>
              )}
            </div>
            <div className="p-3 bg-white/5">
              <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
                {video.title}
              </h4>
              <p className="text-xs text-white/50 line-clamp-1">
                {video.channelTitle}
              </p>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  )
}

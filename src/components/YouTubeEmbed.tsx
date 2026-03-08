'use client'

import { motion } from 'framer-motion'
import { getYouTubeEmbedUrl } from '@/lib/youtube'

interface YouTubeEmbedProps {
  videoId: string
}

export function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative aspect-video w-full rounded-2xl overflow-hidden glass glow-red"
    >
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </motion.div>
  )
}

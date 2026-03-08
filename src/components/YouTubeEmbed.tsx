'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface YouTubeEmbedProps {
  videoId: string
}

export function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`

  return (
    <motion.div
      key={videoId}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative aspect-video w-full rounded-2xl overflow-hidden glass glow-red"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}
      <iframe
        key={videoId}
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        onLoad={() => setIsLoading(false)}
      />
    </motion.div>
  )
}

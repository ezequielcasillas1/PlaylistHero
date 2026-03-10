'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music2, MoreVertical, Trash2, Edit2, Play, Shuffle, ListMusic } from 'lucide-react'
import type { Video } from '@/types'

interface PlaylistCardProps {
  playlist: {
    id: string
    name: string
    description?: string
    videos: Video[]
    video_count: number
    created_at: string
  }
  index: number
  onDelete: () => void
  onEdit?: () => void
  onClick?: () => void
  onPlayAll?: () => void
  onShuffle?: () => void
}

export function PlaylistCard({ playlist, index, onDelete, onEdit, onClick, onPlayAll, onShuffle }: PlaylistCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const thumbnails = playlist.videos.slice(0, 4).map(v => v.thumbnail)
  const firstVideo = playlist.videos[0]
  const formattedDate = new Date(playlist.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  useEffect(() => {
    if (isHovering && firstVideo) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPreview(true)
      }, 800)
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      setShowPreview(false)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [isHovering, firstVideo])

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete()
      setConfirmDelete(false)
      setShowMenu(false)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative glass rounded-2xl hover:ring-2 hover:ring-red-500/50 transition-all"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Thumbnail grid / Preview */}
      <div 
        className="aspect-video relative cursor-pointer rounded-t-2xl overflow-hidden"
        onClick={onClick}
      >
        {showPreview && firstVideo ? (
          <div className="w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${firstVideo.id}?autoplay=1&mute=1&start=30&controls=0&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              title="Preview"
            />
          </div>
        ) : thumbnails.length > 0 ? (
          <div className="grid grid-cols-2 grid-rows-2 h-full">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="relative overflow-hidden">
                {thumbnails[i] ? (
                  <img
                    src={thumbnails[i]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <Music2 className="h-12 w-12 text-white/30" />
          </div>
        )}
        
        {/* Overlay with actions */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity flex flex-col items-center justify-center gap-3 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlayAll?.()
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-colors transform hover:scale-105"
            >
              <Play className="h-4 w-4" />
              Play All
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShuffle?.()
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors transform hover:scale-105"
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            <ListMusic className="h-4 w-4" />
            View Playlist
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
            <p className="text-sm text-white/50">
              {playlist.video_count} video{playlist.video_count !== 1 ? 's' : ''} • {formattedDate}
            </p>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
                setConfirmDelete(false)
              }}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setShowMenu(false)
                    setConfirmDelete(false)
                  }}
                />
                <div className="absolute right-0 mt-1 w-40 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Playlist
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      confirmDelete
                        ? 'bg-red-500 text-white'
                        : 'text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {confirmDelete ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {playlist.description && (
          <p className="mt-2 text-sm text-white/60 line-clamp-2">
            {playlist.description}
          </p>
        )}
      </div>
    </motion.div>
  )
}

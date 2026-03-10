'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Music2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import type { Video } from '@/types'

interface PlaylistData {
  id: string
  name: string
  prompt?: string
  description?: string
  videos: Video[]
  video_count: number
  created_at: string
  updated_at: string
}

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (playlist: PlaylistData) => void
  initialVideos?: Video[]
}

export function CreatePlaylistModal({ isOpen, onClose, onCreated, initialVideos = [] }: CreatePlaylistModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Playlist name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          videos: initialVideos,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.limitReached) {
          setError('Free tier limit reached. Upgrade to create more playlists.')
        } else {
          throw new Error(data.error || 'Failed to create playlist')
        }
        return
      }

      onCreated(data.playlist)
      setName('')
      setDescription('')
    } catch (err) {
      console.error('Error creating playlist:', err)
      setError(err instanceof Error ? err.message : 'Failed to create playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setError(null)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass rounded-2xl p-6 glow-red"
          >
            <button
              onClick={handleClose}
              disabled={loading}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                <Music2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create Playlist</h2>
                <p className="text-sm text-white/60">
                  {initialVideos.length > 0 
                    ? `Save ${initialVideos.length} video${initialVideos.length > 1 ? 's' : ''} to a new playlist`
                    : 'Create a new empty playlist'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Playlist Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  className="min-h-[80px]"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Playlist'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

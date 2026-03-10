'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Save, UserPlus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useAuth } from './AuthProvider'
import { saveLocalPlaylist } from '@/lib/local-storage'
import type { Video } from '@/types'

interface SavePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  videos: Video[]
  suggestedName?: string
  suggestedDescription?: string
  prompt?: string
  onSaved: () => void
}

export function SavePlaylistModal({ 
  isOpen, 
  onClose, 
  videos, 
  suggestedName = '', 
  suggestedDescription = '',
  prompt = '',
  onSaved 
}: SavePlaylistModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState(suggestedName)
  const [description, setDescription] = useState(suggestedDescription)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Playlist name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (user) {
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
            prompt,
            videos,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.limitReached) {
            setError('Free tier limit reached. Upgrade to save more playlists.')
          } else {
            throw new Error(data.error || 'Failed to save playlist')
          }
          return
        }
      } else {
        saveLocalPlaylist({
          name: name.trim(),
          description: description.trim() || undefined,
          prompt,
          videos,
        })
      }

      onSaved()
    } catch (err) {
      console.error('Error saving playlist:', err)
      setError(err instanceof Error ? err.message : 'Failed to save playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName(suggestedName)
      setDescription(suggestedDescription)
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
                <Save className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Save Playlist</h2>
                <p className="text-sm text-white/60">
                  {videos.length} video{videos.length !== 1 ? 's' : ''} will be saved
                </p>
              </div>
            </div>

            {!user && (
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium">Saving locally</p>
                    <p className="text-xs text-blue-300/70 mt-1">
                      Create an account to save your playlists permanently and access them from any device.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/auth/signup')}
                      className="mt-3 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      Create Account
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Playlist Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  disabled={loading}
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
                  onClick={handleSave}
                  disabled={loading || !name.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Playlist
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

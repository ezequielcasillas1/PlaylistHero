'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Loader2, 
  Music2, 
  Sparkles,
  AlertCircle,
  Wand2,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { LandingPage } from '@/components/LandingPage'
import { HomeHeader } from '@/components/HomeHeader'
import { PlaylistCard } from '@/components/PlaylistCard'
import { CreatePlaylistModal } from '@/components/CreatePlaylistModal'
import { VideoFeed } from '@/components/VideoFeed'
import { UpgradeModal } from '@/components/UpgradeModal'
import { SubscriptionBanner } from '@/components/SubscriptionBanner'
import { PlaylistGenerator } from '@/components/PlaylistGenerator'
import { PlaylistDrawer } from '@/components/PlaylistDrawer'
import { EditPlaylistModal } from '@/components/EditPlaylistModal'
import { Button } from '@/components/ui/button'
import type { Video } from '@/types'

const FREE_PLAYLIST_LIMIT = 3

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

export default function Home() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  
  const [playlists, setPlaylists] = useState<PlaylistData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'playlists' | 'feed'>('create')
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [initialVideoIndex, setInitialVideoIndex] = useState(0)
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistData | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      
      if (!session?.access_token) {
        setLoading(false)
        setPlaylists([])
        return
      }
      
      const response = await fetch('/api/playlists', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.status === 401) {
        setPlaylists([])
        setLoading(false)
        return
      }

      if (!response.ok) {
        const text = await response.text()
        let errorMsg = 'Failed to fetch playlists'
        try {
          const data = JSON.parse(text)
          errorMsg = data.error || errorMsg
        } catch {
          errorMsg = text || errorMsg
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setPlaylists(data.playlists || [])
    } catch (err) {
      console.error('Error fetching playlists:', err)
      setError(err instanceof Error ? err.message : 'Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchPlaylists()
    }
  }, [user, fetchPlaylists])

  const handleCreatePlaylist = () => {
    if (profile?.tier === 'free' && playlists.length >= FREE_PLAYLIST_LIMIT) {
      setShowUpgradeModal(true)
      return
    }
    setShowCreateModal(true)
  }

  const handlePlaylistCreated = async (playlist: PlaylistData) => {
    setPlaylists(prev => [playlist, ...prev])
    setShowCreateModal(false)
    await refreshProfile()
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete playlist')
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId))
      await refreshProfile()
    } catch (err) {
      console.error('Error deleting playlist:', err)
    }
  }

  const handleAddToPlaylist = async (playlistId: string, video: Video) => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      
      const response = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video }),
      })

      if (!response.ok) {
        throw new Error('Failed to add video')
      }

      setPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
          return {
            ...p,
            videos: [...p.videos, video],
            video_count: p.video_count + 1,
          }
        }
        return p
      }))
    } catch (err) {
      console.error('Error adding video:', err)
    }
  }

  const handleOpenPlaylist = (playlist: PlaylistData) => {
    setSelectedPlaylist(playlist)
    setInitialVideoIndex(0)
    setIsDrawerOpen(true)
  }

  const handlePlayAll = (playlist: PlaylistData) => {
    setSelectedPlaylist(playlist)
    setInitialVideoIndex(0)
    setIsDrawerOpen(true)
  }

  const handleShuffle = (playlist: PlaylistData) => {
    const randomIndex = Math.floor(Math.random() * playlist.videos.length)
    setSelectedPlaylist(playlist)
    setInitialVideoIndex(randomIndex)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedPlaylist(null)
  }

  const handleEditPlaylist = (playlist: PlaylistData) => {
    setEditingPlaylist(playlist)
    setShowEditModal(true)
  }

  const handleSavePlaylist = async (playlistId: string, name: string, description: string) => {
    const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
    
    const response = await fetch(`/api/playlists/${playlistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    })

    if (!response.ok) {
      throw new Error('Failed to update playlist')
    }

    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, name, description }
      }
      return p
    }))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a0000] to-[#330000] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }
  
  const isFree = profile?.tier === 'free'
  const playlistLimit = isFree ? FREE_PLAYLIST_LIMIT : Infinity
  const canCreateMore = playlists.length < playlistLimit

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a0000] to-[#330000]">
      <HomeHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionBanner 
          tier={profile?.tier || 'free'}
          playlistCount={playlists.length}
          playlistLimit={FREE_PLAYLIST_LIMIT}
          onUpgrade={() => setShowUpgradeModal(true)}
        />

        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'create' 
                ? 'text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Wand2 className="inline h-4 w-4 mr-2" />
            Create Playlist
            {activeTab === 'create' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'playlists' 
                ? 'text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Music2 className="inline h-4 w-4 mr-2" />
            My Playlists
            {activeTab === 'playlists' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'feed' 
                ? 'text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="inline h-4 w-4 mr-2" />
            Discover Videos
            {activeTab === 'feed' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
              />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PlaylistGenerator onPlaylistSaved={fetchPlaylists} />
            </motion.div>
          ) : activeTab === 'playlists' ? (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Your Playlists ({playlists.length})
                </h2>
                <Button
                  onClick={() => setActiveTab('create')}
                  disabled={!canCreateMore && isFree}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-20">
                  <Music2 className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
                  <p className="text-white/60 mb-6">
                    Create your first playlist using the AI generator
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Create Your First Playlist
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist, index) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      index={index}
                      onDelete={() => handleDeletePlaylist(playlist.id)}
                      onEdit={() => handleEditPlaylist(playlist)}
                      onClick={() => handleOpenPlaylist(playlist)}
                      onPlayAll={() => handlePlayAll(playlist)}
                      onShuffle={() => handleShuffle(playlist)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VideoFeed 
                playlists={playlists}
                onAddToPlaylist={handleAddToPlaylist}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePlaylistCreated}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={profile?.tier}
      />

      <PlaylistDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        playlist={selectedPlaylist}
        initialVideoIndex={initialVideoIndex}
      />

      <EditPlaylistModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingPlaylist(null)
        }}
        playlist={editingPlaylist}
        onSave={handleSavePlaylist}
      />
    </div>
  )
}

import type { Video } from '@/types'

const PLAYLISTS_KEY = 'playlisthero_playlists'
const GENERATED_VIDEOS_KEY = 'playlisthero_generated_videos'

export interface LocalPlaylist {
  id: string
  name: string
  prompt?: string
  description?: string
  videos: Video[]
  created_at: string
  updated_at: string
}

export interface LocalGeneratedVideos {
  videos: Video[]
  prompt: string
  generated_at: string
}

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getLocalPlaylists(): LocalPlaylist[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(PLAYLISTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveLocalPlaylist(playlist: Omit<LocalPlaylist, 'id' | 'created_at' | 'updated_at'>): LocalPlaylist {
  const playlists = getLocalPlaylists()
  const now = new Date().toISOString()
  
  const newPlaylist: LocalPlaylist = {
    ...playlist,
    id: generateId(),
    created_at: now,
    updated_at: now,
  }
  
  playlists.push(newPlaylist)
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
  
  return newPlaylist
}

export function updateLocalPlaylist(id: string, updates: Partial<Omit<LocalPlaylist, 'id' | 'created_at'>>): LocalPlaylist | null {
  const playlists = getLocalPlaylists()
  const index = playlists.findIndex(p => p.id === id)
  
  if (index === -1) return null
  
  playlists[index] = {
    ...playlists[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
  return playlists[index]
}

export function deleteLocalPlaylist(id: string): boolean {
  const playlists = getLocalPlaylists()
  const filtered = playlists.filter(p => p.id !== id)
  
  if (filtered.length === playlists.length) return false
  
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered))
  return true
}

export function getLocalPlaylistById(id: string): LocalPlaylist | null {
  const playlists = getLocalPlaylists()
  return playlists.find(p => p.id === id) || null
}

export function addVideoToLocalPlaylist(playlistId: string, video: Video): LocalPlaylist | null {
  const playlist = getLocalPlaylistById(playlistId)
  if (!playlist) return null
  
  if (playlist.videos.some(v => v.id === video.id)) {
    return playlist
  }
  
  return updateLocalPlaylist(playlistId, {
    videos: [...playlist.videos, video],
  })
}

export function removeVideoFromLocalPlaylist(playlistId: string, videoId: string): LocalPlaylist | null {
  const playlist = getLocalPlaylistById(playlistId)
  if (!playlist) return null
  
  return updateLocalPlaylist(playlistId, {
    videos: playlist.videos.filter(v => v.id !== videoId),
  })
}

export function clearLocalPlaylists(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PLAYLISTS_KEY)
}

export function getLocalGeneratedVideos(): LocalGeneratedVideos | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(GENERATED_VIDEOS_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function saveLocalGeneratedVideos(videos: Video[], prompt: string): void {
  if (typeof window === 'undefined') return
  
  const data: LocalGeneratedVideos = {
    videos,
    prompt,
    generated_at: new Date().toISOString(),
  }
  
  localStorage.setItem(GENERATED_VIDEOS_KEY, JSON.stringify(data))
}

export function clearLocalGeneratedVideos(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GENERATED_VIDEOS_KEY)
}

export function getLocalPlaylistCount(): number {
  return getLocalPlaylists().length
}

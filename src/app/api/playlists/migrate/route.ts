import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const FREE_PLAYLIST_LIMIT = 3

interface LocalVideo {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  description: string
}

interface LocalPlaylist {
  id: string
  name: string
  prompt?: string
  description?: string
  videos: LocalVideo[]
  created_at: string
}

function createAuthClient(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

async function getAuthUserAndClient(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, supabase: null }
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, supabase: null }
  }

  const token = authHeader.substring(7)
  if (!token) {
    return { user: null, supabase: null }
  }

  try {
    const supabase = createAuthClient(token)
    if (!supabase) {
      return { user: null, supabase: null }
    }
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return { user: null, supabase: null }
    return { user, supabase }
  } catch {
    return { user: null, supabase: null }
  }
}

export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { playlists } = body as { playlists: LocalPlaylist[] }

  if (!playlists || !Array.isArray(playlists)) {
    return NextResponse.json({ error: 'Playlists array is required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, playlist_count')
    .eq('id', user.id)
    .single()

  const currentCount = profile?.playlist_count || 0
  const isFree = profile?.tier === 'free'
  const remainingSlots = isFree ? FREE_PLAYLIST_LIMIT - currentCount : Infinity
  
  const playlistsToMigrate = playlists.slice(0, remainingSlots)
  const migratedPlaylists = []
  const skippedCount = playlists.length - playlistsToMigrate.length

  for (const localPlaylist of playlistsToMigrate) {
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: localPlaylist.name,
        prompt: localPlaylist.prompt || null,
        description: localPlaylist.description || null,
      })
      .select()
      .single()

    if (playlistError) {
      console.error('Error migrating playlist:', playlistError)
      continue
    }

    if (localPlaylist.videos && localPlaylist.videos.length > 0) {
      const videoInserts = localPlaylist.videos.map((video, index) => ({
        playlist_id: playlist.id,
        video_id: video.id,
        title: video.title,
        thumbnail: video.thumbnail || '',
        channel_title: video.channelTitle || '',
        description: video.description || '',
        position: index,
      }))

      const { error: videosError } = await supabase
        .from('playlist_videos')
        .insert(videoInserts)

      if (videosError) {
        console.error('Error migrating videos:', videosError)
      }
    }

    migratedPlaylists.push({
      ...playlist,
      videos: localPlaylist.videos,
      video_count: localPlaylist.videos?.length || 0,
    })
  }

  return NextResponse.json({
    migrated: migratedPlaylists.length,
    skipped: skippedCount,
    playlists: migratedPlaylists,
    message: skippedCount > 0 
      ? `${migratedPlaylists.length} playlists migrated. ${skippedCount} skipped due to free tier limit.`
      : `${migratedPlaylists.length} playlists migrated successfully.`,
  })
}

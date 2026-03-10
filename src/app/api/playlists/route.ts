import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const FREE_PLAYLIST_LIMIT = 3

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
    console.error('Missing Supabase configuration')
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
  } catch (err) {
    console.error('Auth error:', err)
    return { user: null, supabase: null }
  }
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server configuration error', playlists: [] }, { status: 500 })
  }

  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized', playlists: [] }, { status: 401 })
  }

  // Ensure profile exists for this user (handles users created before migration)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    // Create profile for existing user
    await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
      })
  }
  
  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_videos (
        id,
        video_id,
        title,
        thumbnail,
        channel_title,
        description,
        position
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database error:', error)
    if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
      return NextResponse.json({ playlists: [], message: 'Database tables not set up yet. Please run the migration.' })
    }
    return NextResponse.json({ error: error.message, playlists: [] }, { status: 500 })
  }

  if (!playlists) {
    return NextResponse.json({ playlists: [] })
  }

  const formattedPlaylists = playlists.map(playlist => ({
    ...playlist,
    videos: playlist.playlist_videos
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((v: { video_id: string; title: string; thumbnail: string; channel_title: string; description: string }) => ({
        id: v.video_id,
        title: v.title,
        thumbnail: v.thumbnail,
        channelTitle: v.channel_title,
        description: v.description,
      })),
    video_count: playlist.playlist_videos.length,
  }))

  return NextResponse.json({ playlists: formattedPlaylists })
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ensure profile exists for this user (handles users created before migration)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
      })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, playlist_count')
    .eq('id', user.id)
    .single()

  if (profile?.tier === 'free' && profile.playlist_count >= FREE_PLAYLIST_LIMIT) {
    return NextResponse.json(
      { error: 'Free tier limit reached. Upgrade to create more playlists.', limitReached: true },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { name, prompt, description, videos } = body

  if (!name) {
    return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 })
  }

  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .insert({
      user_id: user.id,
      name,
      prompt: prompt || null,
      description: description || null,
    })
    .select()
    .single()

  if (playlistError) {
    return NextResponse.json({ error: playlistError.message }, { status: 500 })
  }

  if (videos && videos.length > 0) {
    const videoInserts = videos.map((video: { id: string; title: string; thumbnail: string; channelTitle: string; description: string }, index: number) => ({
      playlist_id: playlist.id,
      video_id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channel_title: video.channelTitle,
      description: video.description || '',
      position: index,
    }))

    const { error: videosError } = await supabase
      .from('playlist_videos')
      .insert(videoInserts)

    if (videosError) {
      console.error('Error adding videos:', videosError)
    }
  }

  return NextResponse.json({ 
    playlist: {
      ...playlist,
      videos: videos || [],
      video_count: videos?.length || 0,
    }
  }, { status: 201 })
}

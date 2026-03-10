import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: playlistId } = await params
  const body = await request.json()
  const { video } = body

  if (!video || !video.id || !video.title) {
    return NextResponse.json({ error: 'Video data is required' }, { status: 400 })
  }

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', user.id)
    .single()

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
  }

  const { data: maxPosition } = await supabase
    .from('playlist_videos')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (maxPosition?.position ?? -1) + 1

  const { data: playlistVideo, error } = await supabase
    .from('playlist_videos')
    .upsert({
      playlist_id: playlistId,
      video_id: video.id,
      title: video.title,
      thumbnail: video.thumbnail || '',
      channel_title: video.channelTitle || '',
      description: video.description || '',
      position: nextPosition,
    }, {
      onConflict: 'playlist_id,video_id',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ video: playlistVideo }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: playlistId } = await params
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
  }

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', user.id)
    .single()

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('playlist_videos')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

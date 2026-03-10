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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: playlist, error } = await supabase
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
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
  }

  const formattedPlaylist = {
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
  }

  return NextResponse.json({ playlist: formattedPlaylist })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, description } = body

  const { data: existing } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
  }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (description !== undefined) updates.description = description

  const { data: playlist, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ playlist })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await getAuthUserAndClient(request)
  
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: existing } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

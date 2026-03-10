import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface PlaylistVideo {
  video_id: string
  title: string
  channel_title: string
}

interface Video {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  description: string
  publishedAt?: string
}

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelTitle: string
    description: string
    publishedAt: string
    thumbnails: {
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
  }
}

async function getUserPlaylists(userId: string): Promise<PlaylistVideo[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: playlists, error: playlistError } = await supabase
    .from('playlists')
    .select('id')
    .eq('user_id', userId)
    .limit(10)

  if (playlistError || !playlists?.length) {
    return []
  }

  const playlistIds = playlists.map(p => p.id)
  
  const { data: videos, error: videoError } = await supabase
    .from('playlist_videos')
    .select('video_id, title, channel_title')
    .in('playlist_id', playlistIds)
    .limit(50)

  if (videoError) {
    console.error('Error fetching playlist videos:', videoError)
    return []
  }

  return videos || []
}

async function generatePersonalizedQueries(videos: PlaylistVideo[]): Promise<string[]> {
  if (!GEMINI_API_KEY || videos.length === 0) {
    return getDefaultQueries()
  }

  const videoSummary = videos.slice(0, 20).map(v => `${v.title} by ${v.channel_title}`).join('\n')
  
  const channelCounts: Record<string, number> = {}
  videos.forEach(v => {
    channelCounts[v.channel_title] = (channelCounts[v.channel_title] || 0) + 1
  })
  const topChannels = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([channel]) => channel)

  const prompt = `You are a personalized recommendation engine for a video discovery app.

Based on the user's playlist history, generate YouTube search queries for their "For You" feed.

User's saved videos:
${videoSummary}

Top channels they watch: ${topChannels.join(', ')}

Generate 8 diverse search queries that:
1. Match their interests based on the video titles and channels
2. Include related content they might enjoy
3. Mix familiar content with discovery (new channels in similar genres)
4. Consider genre, mood, and content type patterns

Respond in JSON format only:
{
  "searchQueries": ["query1", "query2", "query3", "query4", "query5", "query6", "query7", "query8"],
  "reasoning": "brief explanation of recommendations"
}`

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      throw new Error('Empty Gemini response')
    }

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse Gemini response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.searchQueries || getDefaultQueries()
  } catch (error) {
    console.error('Gemini personalization failed:', error)
    return getDefaultQueries()
  }
}

function getDefaultQueries(): string[] {
  return [
    'trending videos 2025',
    'top music videos this week',
    'best gaming moments',
    'tech reviews latest',
    'educational documentaries',
    'entertainment highlights',
    'viral videos today',
    'recommended for you',
  ]
}

async function searchYouTubeVideos(queries: string[], maxVideos: number = 20): Promise<Video[]> {
  if (!YOUTUBE_API_KEY) {
    return []
  }

  const allVideos: Video[] = []
  const videosPerQuery = Math.ceil(maxVideos / queries.length)
  const seenIds = new Set<string>()

  for (const query of queries) {
    if (allVideos.length >= maxVideos) break

    try {
      const url = new URL(`${YOUTUBE_API_BASE}/search`)
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('q', query)
      url.searchParams.set('type', 'video')
      url.searchParams.set('maxResults', String(videosPerQuery))
      url.searchParams.set('key', YOUTUBE_API_KEY)
      url.searchParams.set('videoEmbeddable', 'true')
      url.searchParams.set('order', 'relevance')

      const response = await fetch(url.toString())
      const data = await response.json()

      if (response.ok && data.items) {
        for (const item of data.items as YouTubeSearchItem[]) {
          if (!seenIds.has(item.id.videoId)) {
            seenIds.add(item.id.videoId)
            allVideos.push({
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.high?.url || 
                        item.snippet.thumbnails.medium?.url || 
                        item.snippet.thumbnails.default?.url || '',
              channelTitle: item.snippet.channelTitle,
              description: item.snippet.description,
              publishedAt: item.snippet.publishedAt,
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error)
    }
  }

  return allVideos.slice(0, maxVideos)
}

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload.sub || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const userId = getUserIdFromToken(authHeader)

    let videos: Video[]
    let isPersonalized = false

    if (userId) {
      const userVideos = await getUserPlaylists(userId)
      
      if (userVideos.length > 0) {
        const queries = await generatePersonalizedQueries(userVideos)
        videos = await searchYouTubeVideos(queries, 20)
        isPersonalized = true
      } else {
        const defaultQueries = getDefaultQueries()
        videos = await searchYouTubeVideos(defaultQueries, 20)
      }
    } else {
      const defaultQueries = getDefaultQueries()
      videos = await searchYouTubeVideos(defaultQueries, 20)
    }

    return NextResponse.json({
      success: true,
      videos,
      isPersonalized,
      message: isPersonalized 
        ? 'Personalized recommendations based on your playlists'
        : 'Create playlists to get personalized recommendations',
    })
  } catch (error) {
    console.error('For You API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personalized feed' },
      { status: 500 }
    )
  }
}

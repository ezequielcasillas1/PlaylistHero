import { NextRequest, NextResponse } from 'next/server'
import { checkAndIncrementUsage } from '@/lib/usage-tracking'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

interface Video {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  description: string
}

interface GenerateRequest {
  prompt: string
  videoCount: number
  fingerprint: string
}

interface GeminiResponse {
  searchQueries: string[]
  playlistTitle: string
  playlistDescription: string
  contentType: 'music' | 'news' | 'trending' | 'general'
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { prompt, videoCount, fingerprint } = body

    if (!prompt || !videoCount) {
      return NextResponse.json(
        { error: 'Missing prompt or videoCount' },
        { status: 400 }
      )
    }

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Missing fingerprint for usage tracking' },
        { status: 400 }
      )
    }

    // Server-side rate limiting
    const ipAddress = getClientIP(request)
    const usageResult = await checkAndIncrementUsage(fingerprint, ipAddress)

    if (!usageResult.canGenerate) {
      return NextResponse.json(
        { 
          error: 'Free generation limit reached. Please upgrade to continue.',
          limitReached: true,
          remainingCount: 0
        },
        { status: 429 }
      )
    }

    const geminiResponse = await generateSearchQueries(prompt, videoCount)
    const videos = await searchYouTubeVideos(geminiResponse.searchQueries, videoCount, geminiResponse.contentType)

    return NextResponse.json({
      success: true,
      playlistTitle: geminiResponse.playlistTitle,
      playlistDescription: geminiResponse.playlistDescription,
      videos,
      remainingCount: usageResult.remainingCount,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    )
  }
}

async function generateSearchQueries(prompt: string, videoCount: number): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured, using direct search')
    return {
      searchQueries: [prompt],
      playlistTitle: `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} Playlist`,
      playlistDescription: `Videos based on: ${prompt}`,
      contentType: 'general',
    }
  }

  try {
    const currentDate = new Date().toISOString().split('T')[0]
    const systemPrompt = `You are a smart YouTube content curator. Analyze the user's request and generate optimal search queries.

Current date: ${currentDate}
User wants ${videoCount} videos.
User's description: "${prompt}"

IMPORTANT: Determine the content type based on the user's intent:
- "music" = songs, playlists, albums, artists, beats, lofi, EDM, etc.
- "news" = current events, politics, world news, breaking news, updates
- "trending" = viral videos, popular content, what's hot right now
- "general" = tutorials, reviews, entertainment, vlogs, gaming, tech, etc.

For NEWS/TRENDING requests:
- Add "2024" or "2025" or current year to queries
- Include "latest", "new", "today", "this week" where relevant
- Use specific topic keywords

For MUSIC requests:
- Include genre, mood, artist names
- Add "official", "full album", "mix" where appropriate

Respond in JSON format only:
{
  "searchQueries": ["query1", "query2", ...],
  "playlistTitle": "A catchy, relevant title",
  "playlistDescription": "Brief description of what this collection contains",
  "contentType": "music" | "news" | "trending" | "general"
}

Generate ${Math.min(Math.ceil(videoCount / 5), 10)} unique search queries optimized for YouTube's algorithm. Make queries specific and likely to return high-quality, recent, relevant results.`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
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

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Gemini error:', error)
    return {
      searchQueries: [prompt],
      playlistTitle: `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} Playlist`,
      playlistDescription: `Videos based on: ${prompt}`,
      contentType: 'general',
    }
  }
}

async function searchYouTubeVideos(
  queries: string[], 
  maxVideos: number, 
  contentType: 'music' | 'news' | 'trending' | 'general'
): Promise<Video[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured, returning mock data')
    return getMockVideos(maxVideos)
  }

  const allVideos: Video[] = []
  const videosPerQuery = Math.ceil(maxVideos / queries.length)

  // Configure search params based on content type
  const getSearchParams = (query: string) => {
    const baseParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(videosPerQuery),
      key: YOUTUBE_API_KEY!,
    })

    switch (contentType) {
      case 'music':
        baseParams.set('order', 'relevance')
        baseParams.set('videoCategoryId', '10') // Music category
        break
      case 'news':
        baseParams.set('order', 'date') // Latest first
        baseParams.set('videoCategoryId', '25') // News & Politics
        baseParams.set('publishedAfter', getRecentDate(7)) // Last 7 days
        break
      case 'trending':
        baseParams.set('order', 'viewCount') // Most viewed
        baseParams.set('publishedAfter', getRecentDate(30)) // Last 30 days
        break
      case 'general':
      default:
        baseParams.set('order', 'relevance')
        // No category restriction - search all content
        break
    }

    return baseParams
  }

  for (const query of queries) {
    if (allVideos.length >= maxVideos) break

    try {
      const params = getSearchParams(query)
      const response = await fetch(
        `${YOUTUBE_API_BASE}/search?${params.toString()}`
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('YouTube API error:', errorText)
        // Retry without category restriction if category-specific search fails
        if (contentType !== 'general') {
          const fallbackParams = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: String(videosPerQuery),
            order: contentType === 'news' ? 'date' : 'relevance',
            key: YOUTUBE_API_KEY!,
          })
          const fallbackResponse = await fetch(
            `${YOUTUBE_API_BASE}/search?${fallbackParams.toString()}`
          )
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.items) {
              const videos = mapVideos(fallbackData.items)
              allVideos.push(...videos)
            }
          }
        }
        continue
      }

      const data = await response.json()

      if (data.items) {
        const videos = mapVideos(data.items)
        allVideos.push(...videos)
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error)
    }
  }

  const uniqueVideos = allVideos.filter(
    (v, i, arr) => arr.findIndex(x => x.id === v.id) === i
  )

  return uniqueVideos.slice(0, maxVideos)
}

function mapVideos(items: any[]): Video[] {
  return items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    channelTitle: item.snippet.channelTitle,
    description: item.snippet.description,
  }))
}

function getRecentDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function getMockVideos(count: number): Video[] {
  const mockData = [
    { title: 'Lofi Hip Hop Radio - Beats to Relax/Study To', channel: 'Lofi Girl' },
    { title: 'Epic Gaming Music Mix 2024', channel: 'NCS Gaming' },
    { title: 'Chill Vibes Playlist - Relaxing Music', channel: 'Chill Nation' },
    { title: 'Best Workout Music 2024', channel: 'Fitness Beats' },
    { title: 'Coding Music - Deep Focus', channel: 'Programming Music' },
    { title: 'Jazz Coffee Shop Ambience', channel: 'Cafe Music BGM' },
    { title: 'Synthwave Retro Mix', channel: 'NewRetroWave' },
    { title: 'Acoustic Guitar Covers', channel: 'Guitar Vibes' },
    { title: 'Piano Relaxation Music', channel: 'Peaceful Piano' },
    { title: 'Electronic Dance Music Mix', channel: 'EDM Central' },
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-video-${i}-${Date.now()}`,
    title: mockData[i % mockData.length].title,
    thumbnail: `https://picsum.photos/320/180?random=${i}`,
    channelTitle: mockData[i % mockData.length].channel,
    description: 'This is a mock video description.',
  }))
}

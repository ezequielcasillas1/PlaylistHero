import { NextRequest, NextResponse } from 'next/server'

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
}

interface GeminiResponse {
  searchQueries: string[]
  playlistTitle: string
  playlistDescription: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { prompt, videoCount } = body

    if (!prompt || !videoCount) {
      return NextResponse.json(
        { error: 'Missing prompt or videoCount' },
        { status: 400 }
      )
    }

    const geminiResponse = await generateSearchQueries(prompt, videoCount)
    const videos = await searchYouTubeVideos(geminiResponse.searchQueries, videoCount)

    return NextResponse.json({
      success: true,
      playlistTitle: geminiResponse.playlistTitle,
      playlistDescription: geminiResponse.playlistDescription,
      videos,
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
    }
  }

  try {
    const systemPrompt = `You are a YouTube playlist curator. Based on the user's description, generate YouTube search queries to find relevant videos.

User wants a playlist with ${videoCount} videos.
User's description: "${prompt}"

Respond in JSON format only:
{
  "searchQueries": ["query1", "query2", ...],
  "playlistTitle": "A catchy title for this playlist",
  "playlistDescription": "A brief description of the playlist vibe"
}

Generate ${Math.min(Math.ceil(videoCount / 5), 10)} unique search queries that would find diverse but related content matching the user's request. Be specific and include terms that will return high-quality YouTube results.`

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
    }
  }
}

async function searchYouTubeVideos(queries: string[], maxVideos: number): Promise<Video[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured, returning mock data')
    return getMockVideos(maxVideos)
  }

  const allVideos: Video[] = []
  const videosPerQuery = Math.ceil(maxVideos / queries.length)

  for (const query of queries) {
    if (allVideos.length >= maxVideos) break

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${videosPerQuery}&order=relevance&videoCategoryId=10&key=${YOUTUBE_API_KEY}`
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('YouTube API error:', errorText)
        continue
      }

      const data = await response.json()

      if (data.items) {
        const videos = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          description: item.snippet.description,
        }))
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

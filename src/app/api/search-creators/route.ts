import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface Channel {
  id: string
  title: string
  thumbnail: string
  subscriberCount?: string
  description?: string
}

interface SearchCreatorsRequest {
  query: string
  mood?: string
  prompt?: string
  pageToken?: string
}

function enhanceQueryWithContext(query: string, mood?: string, prompt?: string): string {
  const parts = [query]
  
  if (mood) {
    const moodKeywords: Record<string, string[]> = {
      happy: ['upbeat', 'fun', 'positive'],
      sad: ['emotional', 'heartfelt'],
      energetic: ['high energy', 'dynamic'],
      relaxed: ['chill', 'calm', 'ambient'],
      focused: ['study', 'concentration'],
      anxious: ['calming', 'soothing'],
      romantic: ['love', 'romantic'],
      angry: ['intense', 'powerful'],
      nostalgic: ['classic', 'throwback'],
      hopeful: ['inspiring', 'motivational'],
      melancholic: ['emotional', 'deep'],
      excited: ['hype', 'exciting'],
      peaceful: ['peaceful', 'serene'],
      adventurous: ['adventure', 'travel'],
      mysterious: ['mysterious', 'dark'],
      playful: ['fun', 'entertaining'],
      confident: ['empowering', 'bold'],
      grateful: ['thankful', 'appreciation'],
      lonely: ['relatable', 'emotional'],
      inspired: ['creative', 'inspiring'],
      christlike: ['christian', 'faith', 'worship'],
    }
    
    const keywords = moodKeywords[mood]
    if (keywords && keywords.length > 0) {
      parts.push(keywords[0])
    }
  }
  
  if (prompt) {
    const promptWords = prompt.split(' ').slice(0, 3).join(' ')
    if (promptWords && !query.toLowerCase().includes(promptWords.toLowerCase())) {
      parts.push(promptWords)
    }
  }
  
  return parts.join(' ')
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchCreatorsRequest = await request.json()
    const { query, mood, prompt, pageToken } = body

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { channels: getMockChannels(), nextPageToken: null },
        { status: 200 }
      )
    }

    const enhancedQuery = enhanceQueryWithContext(query.trim(), mood, prompt)
    
    const params = new URLSearchParams({
      part: 'snippet',
      q: enhancedQuery,
      type: 'channel',
      maxResults: '10',
      key: YOUTUBE_API_KEY,
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?${params.toString()}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('YouTube API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to search channels' },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    const channelIds = data.items?.map((item: any) => item.id.channelId).filter(Boolean) || []
    
    let channels: Channel[] = []
    
    if (channelIds.length > 0) {
      const detailsParams = new URLSearchParams({
        part: 'snippet,statistics',
        id: channelIds.join(','),
        key: YOUTUBE_API_KEY,
      })
      
      const detailsResponse = await fetch(
        `${YOUTUBE_API_BASE}/channels?${detailsParams.toString()}`
      )
      
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        channels = detailsData.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          subscriberCount: formatSubscriberCount(item.statistics?.subscriberCount),
          description: item.snippet.description?.substring(0, 100) || '',
        })) || []
      } else {
        channels = data.items?.map((item: any) => ({
          id: item.id.channelId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          description: item.snippet.description?.substring(0, 100) || '',
        })) || []
      }
    }

    return NextResponse.json({
      channels,
      nextPageToken: data.nextPageToken || null,
    })
  } catch (error) {
    console.error('Search creators error:', error)
    return NextResponse.json(
      { error: 'Failed to search creators' },
      { status: 500 }
    )
  }
}

function formatSubscriberCount(count?: string): string {
  if (!count) return ''
  const num = parseInt(count, 10)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return count
}

function getMockChannels(): Channel[] {
  return [
    { id: 'mock-1', title: 'Lofi Girl', thumbnail: 'https://picsum.photos/88/88?random=1', subscriberCount: '12.5M' },
    { id: 'mock-2', title: 'ChilledCow', thumbnail: 'https://picsum.photos/88/88?random=2', subscriberCount: '8.2M' },
    { id: 'mock-3', title: 'The Jazz Hop Café', thumbnail: 'https://picsum.photos/88/88?random=3', subscriberCount: '3.1M' },
    { id: 'mock-4', title: 'Chill Nation', thumbnail: 'https://picsum.photos/88/88?random=4', subscriberCount: '5.7M' },
    { id: 'mock-5', title: 'MrSuicideSheep', thumbnail: 'https://picsum.photos/88/88?random=5', subscriberCount: '14.2M' },
  ]
}

import { Video } from '@/types'

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function searchVideos(query: string, maxResults: number = 10): Promise<Video[]> {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    console.warn('YouTube API key not configured, returning mock data')
    return getMockVideos(maxResults)
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('YouTube API request failed')
    }

    const data = await response.json()

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
    }))
  } catch (error) {
    console.error('YouTube API error:', error)
    return getMockVideos(maxResults)
  }
}

function getMockVideos(count: number): Video[] {
  const mockVideos: Video[] = []
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

  for (let i = 0; i < count; i++) {
    const data = mockData[i % mockData.length]
    mockVideos.push({
      id: `mock-video-${i}-${Date.now()}`,
      title: data.title,
      thumbnail: `https://picsum.photos/320/180?random=${i}`,
      channelTitle: data.channel,
      description: 'This is a mock video description for testing purposes.',
    })
  }

  return mockVideos
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

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

interface FeedParams {
  category: string
  search: string
  duration: string
  uploadDate: string
  yearFrom: string
  yearTo: string
  popularity: string
  language: string
  region: string
  theme: string
  pageToken: string
  shuffle: string
}

const categoryQueries: Record<string, string> = {
  trending: 'trending videos 2025',
  music: 'top music videos',
  gaming: 'gaming highlights',
  news: 'news today',
  sports: 'sports highlights',
  entertainment: 'entertainment videos',
  education: 'educational videos',
  technology: 'tech reviews',
}

const themedQueries: Record<string, string> = {
  christmas: 'christmas holiday videos',
  halloween: 'halloween spooky videos',
  thanksgiving: 'thanksgiving family videos',
  newyear: 'new year celebration',
  valentines: 'valentines day romantic',
  easter: 'easter spring videos',
  summer: 'summer vibes vacation beach',
  winter: 'winter cozy fireplace snow',
  spring: 'spring energy fresh start',
  fall: 'fall autumn aesthetic cozy',
  olympics: 'olympics sports highlights',
  worldcup: 'world cup football soccer',
  superbowl: 'super bowl highlights',
  e3: 'E3 gaming announcements',
  oscars: 'oscars academy awards',
  grammys: 'grammy awards music',
}

const languageOptions: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  hi: 'Hindi',
  ar: 'Arabic',
  ru: 'Russian',
  it: 'Italian',
}

const regionOptions: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  MX: 'Mexico',
  IN: 'India',
  ES: 'Spain',
}

function getDateFilter(uploadDate: string): { publishedAfter?: string } {
  const now = new Date()
  
  switch (uploadDate) {
    case 'today':
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      return { publishedAfter: today.toISOString() }
    case 'week':
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { publishedAfter: weekAgo.toISOString() }
    case 'month':
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return { publishedAfter: monthAgo.toISOString() }
    case 'year':
      const yearAgo = new Date(now)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      return { publishedAfter: yearAgo.toISOString() }
    default:
      return {}
  }
}

function getYearRangeFilter(yearFrom: string, yearTo: string): { publishedAfter?: string, publishedBefore?: string } {
  const result: { publishedAfter?: string, publishedBefore?: string } = {}
  
  if (yearFrom) {
    const fromYear = parseInt(yearFrom)
    if (!isNaN(fromYear) && fromYear >= 2005) {
      result.publishedAfter = `${fromYear}-01-01T00:00:00Z`
    }
  }
  
  if (yearTo) {
    const toYear = parseInt(yearTo)
    if (!isNaN(toYear)) {
      result.publishedBefore = `${toYear + 1}-01-01T00:00:00Z`
    }
  }
  
  return result
}

function getOrderByPopularity(popularity: string): string {
  switch (popularity) {
    case 'mainstream':
      return 'viewCount'
    case 'rising':
      return 'relevance'
    case 'undiscovered':
      return 'date'
    default:
      return 'relevance'
  }
}

function getCurrentTheme(): string | null {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  
  if (month === 11 && day >= 15) return 'christmas'
  if (month === 9 && day >= 20) return 'halloween'
  if (month === 10 && day >= 20 && day <= 28) return 'thanksgiving'
  if (month === 11 && day >= 28 || (month === 0 && day <= 2)) return 'newyear'
  if (month === 1 && day >= 7 && day <= 14) return 'valentines'
  
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 8 && month <= 10) return 'fall'
  if (month === 11 || month <= 1) return 'winter'
  
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const params: FeedParams = {
    category: searchParams.get('category') || 'trending',
    search: searchParams.get('search') || '',
    duration: searchParams.get('duration') || '',
    uploadDate: searchParams.get('uploadDate') || '',
    yearFrom: searchParams.get('yearFrom') || '',
    yearTo: searchParams.get('yearTo') || '',
    popularity: searchParams.get('popularity') || '',
    language: searchParams.get('language') || '',
    region: searchParams.get('region') || '',
    theme: searchParams.get('theme') || '',
    pageToken: searchParams.get('pageToken') || '',
    shuffle: searchParams.get('shuffle') || '',
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: 'YouTube API key not configured' },
      { status: 500 }
    )
  }

  try {
    let query = ''
    
    if (params.search) {
      query = params.search
      if (params.category && params.category !== 'trending') {
        query = `${params.search} ${params.category}`
      }
    } else if (params.theme && themedQueries[params.theme]) {
      query = themedQueries[params.theme]
    } else if (params.shuffle === 'true') {
      const categories = Object.keys(categoryQueries)
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      query = `${categoryQueries[randomCategory]} hidden gems underrated`
    } else {
      query = categoryQueries[params.category] || categoryQueries.trending
    }

    const url = new URL(`${YOUTUBE_API_BASE}/search`)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'video')
    url.searchParams.set('maxResults', '20')
    url.searchParams.set('key', YOUTUBE_API_KEY)
    url.searchParams.set('videoEmbeddable', 'true')
    
    if (params.duration && ['short', 'medium', 'long'].includes(params.duration)) {
      url.searchParams.set('videoDuration', params.duration)
    }
    
    const dateFilter = getDateFilter(params.uploadDate)
    const yearFilter = getYearRangeFilter(params.yearFrom, params.yearTo)
    
    if (yearFilter.publishedAfter) {
      url.searchParams.set('publishedAfter', yearFilter.publishedAfter)
    } else if (dateFilter.publishedAfter) {
      url.searchParams.set('publishedAfter', dateFilter.publishedAfter)
    }
    
    if (yearFilter.publishedBefore) {
      url.searchParams.set('publishedBefore', yearFilter.publishedBefore)
    }
    
    const order = getOrderByPopularity(params.popularity)
    url.searchParams.set('order', order)
    
    if (params.language && languageOptions[params.language]) {
      url.searchParams.set('relevanceLanguage', params.language)
    }
    
    if (params.region && regionOptions[params.region]) {
      url.searchParams.set('regionCode', params.region)
    }
    
    if (params.pageToken) {
      url.searchParams.set('pageToken', params.pageToken)
    }

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      console.error('YouTube API error:', data)
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      )
    }

    const videos = (data.items || []).map((item: YouTubeSearchItem) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || 
                 item.snippet.thumbnails.medium?.url || 
                 item.snippet.thumbnails.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    }))

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || null,
      category: params.category,
      currentTheme: getCurrentTheme(),
      filters: {
        languageOptions,
        regionOptions,
        themedOptions: Object.keys(themedQueries),
      },
    })
  } catch (error) {
    console.error('Feed API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

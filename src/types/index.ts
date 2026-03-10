export interface Video {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  description: string
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  prompt?: string
  description?: string
  video_count: number
  videos: Video[]
  created_at: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  tier: 'free' | 'weekly' | 'monthly' | 'yearly'
  prompt_count: number
  playlist_count: number
  created_at: string
}

export type SubscriptionTier = 'free' | 'weekly' | 'monthly' | 'yearly'

export const SUBSCRIPTION_PRICES = {
  weekly: 1.99,
  monthly: 4.99,
  yearly: 49.99,
} as const

export const FREE_PROMPT_LIMIT = 3
export const FREE_PLAYLIST_LIMIT = 3

'use client'

import { motion } from 'framer-motion'
import { Crown, Sparkles, Settings, Check } from 'lucide-react'
import { Button } from './ui/button'
import type { SubscriptionTier } from '@/types'

interface SubscriptionBannerProps {
  tier: SubscriptionTier
  playlistCount: number
  playlistLimit: number
  onUpgrade: () => void
}

const tierLabels: Record<SubscriptionTier, string> = {
  free: 'Free Plan',
  weekly: 'Pro Weekly',
  monthly: 'Pro Monthly',
  yearly: 'Pro Yearly',
}

const tierColors: Record<SubscriptionTier, { bg: string; border: string; icon: string; text: string }> = {
  free: {
    bg: 'from-yellow-500/10 to-orange-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-500',
    text: 'text-yellow-400',
  },
  weekly: {
    bg: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    text: 'text-blue-400',
  },
  monthly: {
    bg: 'from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    text: 'text-purple-400',
  },
  yearly: {
    bg: 'from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    text: 'text-emerald-400',
  },
}

export function SubscriptionBanner({ 
  tier, 
  playlistCount, 
  playlistLimit, 
  onUpgrade 
}: SubscriptionBannerProps) {
  const isFree = tier === 'free'
  const colors = tierColors[tier]
  const label = tierLabels[tier]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {isFree ? (
            <Crown className={`h-5 w-5 ${colors.icon}`} />
          ) : (
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${
              tier === 'weekly' ? 'from-blue-500 to-cyan-500' :
              tier === 'monthly' ? 'from-purple-500 to-pink-500' :
              'from-emerald-500 to-teal-500'
            }`}>
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <p className="text-white font-medium">{label}</p>
            {isFree ? (
              <p className="text-white/60 text-sm">
                {playlistCount} / {playlistLimit} playlists used
              </p>
            ) : (
              <p className="text-white/60 text-sm">
                Unlimited playlists • {playlistCount} created
              </p>
            )}
          </div>
        </div>
        
        {isFree ? (
          <Button
            onClick={onUpgrade}
            variant="outline"
            size="sm"
            className={`border-yellow-500/50 ${colors.text} hover:bg-yellow-500/10`}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade for Unlimited
          </Button>
        ) : (
          <Button
            onClick={onUpgrade}
            variant="outline"
            size="sm"
            className={`border-white/20 text-white/80 hover:bg-white/5`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Plan
          </Button>
        )}
      </div>
    </motion.div>
  )
}

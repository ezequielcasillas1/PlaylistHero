'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check, Zap, ArrowUp, ArrowDown, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { SUBSCRIPTION_PRICES, FREE_PROMPT_LIMIT, type SubscriptionTier } from '@/types'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier?: SubscriptionTier
}

const plans = [
  {
    id: 'weekly' as const,
    name: 'Weekly',
    price: SUBSCRIPTION_PRICES.weekly,
    period: 'week',
    features: ['Unlimited playlists', 'Priority generation', 'Save to account'],
    rank: 1,
  },
  {
    id: 'monthly' as const,
    name: 'Monthly',
    price: SUBSCRIPTION_PRICES.monthly,
    period: 'month',
    popular: true,
    features: ['Unlimited playlists', 'Priority generation', 'Save to account', 'Export playlists'],
    rank: 2,
  },
  {
    id: 'yearly' as const,
    name: 'Yearly',
    price: SUBSCRIPTION_PRICES.yearly,
    period: 'year',
    savings: '17%',
    features: ['Unlimited playlists', 'Priority generation', 'Save to account', 'Export playlists', 'Early access'],
    rank: 3,
  },
]

const tierRank: Record<SubscriptionTier, number> = {
  free: 0,
  weekly: 1,
  monthly: 2,
  yearly: 3,
}

export function UpgradeModal({ isOpen, onClose, currentTier = 'free' }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const isFree = currentTier === 'free'
  const currentRank = tierRank[currentTier]

  const getActionType = (planId: SubscriptionTier): 'current' | 'upgrade' | 'downgrade' => {
    if (planId === currentTier) return 'current'
    const planRank = tierRank[planId]
    return planRank > currentRank ? 'upgrade' : 'downgrade'
  }

  const getActionLabel = (planId: SubscriptionTier): string => {
    const action = getActionType(planId)
    if (action === 'current') return 'Current Plan'
    if (action === 'upgrade') return 'Upgrade'
    return 'Downgrade'
  }

  const getActionIcon = (planId: SubscriptionTier) => {
    const action = getActionType(planId)
    if (action === 'current') return <Check className="h-4 w-4" />
    if (action === 'upgrade') return <ArrowUp className="h-4 w-4" />
    return <ArrowDown className="h-4 w-4" />
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg glass rounded-3xl p-6 sm:p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-white/60" />
            </button>

            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                isFree 
                  ? 'bg-gradient-to-br from-red-500 to-orange-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {isFree ? (
                  <Zap className="h-8 w-8 text-white" />
                ) : (
                  <Settings className="h-8 w-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isFree ? 'Upgrade to Pro' : 'Manage Your Plan'}
              </h2>
              <p className="text-white/60">
                {isFree ? (
                  <>
                    You&apos;ve reached your limit of {FREE_PROMPT_LIMIT} free playlists.
                    <br />
                    Upgrade to create unlimited playlists!
                  </>
                ) : (
                  <>
                    You&apos;re currently on the <span className="text-white font-medium">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span> plan.
                    <br />
                    Change your plan anytime.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              {plans.map((plan) => {
                const actionType = getActionType(plan.id)
                const isCurrent = actionType === 'current'
                const isSelected = selectedPlan === plan.id
                
                return (
                  <button
                    key={plan.name}
                    onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                    disabled={isCurrent}
                    className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 cursor-default'
                        : isSelected
                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500 hover:border-red-400'
                        : plan.popular && isFree
                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500 hover:border-red-400'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{plan.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-xs font-medium text-green-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Current
                          </span>
                        )}
                        {!isCurrent && plan.popular && isFree && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500 text-xs font-medium text-white">
                            Popular
                          </span>
                        )}
                        {plan.savings && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-xs font-medium text-green-400">
                            Save {plan.savings}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-white">${plan.price}</span>
                        <span className="text-sm text-white/50">/{plan.period}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plan.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 text-xs text-white/60"
                        >
                          <Check className="h-3 w-3 text-green-400" />
                          {feature}
                        </span>
                      ))}
                    </div>
                    {!isCurrent && !isFree && (
                      <div className={`mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-sm ${
                        actionType === 'upgrade' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {getActionIcon(plan.id)}
                        <span>{getActionLabel(plan.id)} to this plan</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {isFree ? (
                <Button size="lg" className="w-full" disabled={!selectedPlan}>
                  <Sparkles className="h-5 w-5 mr-2" />
                  {selectedPlan ? `Upgrade to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}` : 'Select a Plan'}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full" 
                  disabled={!selectedPlan}
                  variant={selectedPlan && getActionType(selectedPlan as SubscriptionTier) === 'downgrade' ? 'secondary' : 'default'}
                >
                  {selectedPlan ? (
                    <>
                      {getActionIcon(selectedPlan as SubscriptionTier)}
                      <span className="ml-2">
                        {getActionLabel(selectedPlan as SubscriptionTier)} to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                      </span>
                    </>
                  ) : (
                    'Select a Plan to Change'
                  )}
                </Button>
              )}
              
              {!isFree && (
                <button
                  className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Cancel subscription
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                {isFree ? 'Maybe later' : 'Keep current plan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

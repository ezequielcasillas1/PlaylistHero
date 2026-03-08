'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { SUBSCRIPTION_PRICES, FREE_PROMPT_LIMIT } from '@/types'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

const plans = [
  {
    name: 'Weekly',
    price: SUBSCRIPTION_PRICES.weekly,
    period: 'week',
    features: ['Unlimited playlists', 'Priority generation', 'Save to account'],
  },
  {
    name: 'Monthly',
    price: SUBSCRIPTION_PRICES.monthly,
    period: 'month',
    popular: true,
    features: ['Unlimited playlists', 'Priority generation', 'Save to account', 'Export playlists'],
  },
  {
    name: 'Yearly',
    price: SUBSCRIPTION_PRICES.yearly,
    period: 'year',
    savings: '17%',
    features: ['Unlimited playlists', 'Priority generation', 'Save to account', 'Export playlists', 'Early access'],
  },
]

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Upgrade to Pro
              </h2>
              <p className="text-white/60">
                You&apos;ve reached your limit of {FREE_PROMPT_LIMIT} free playlists.
                <br />
                Upgrade to create unlimited playlists!
              </p>
            </div>

            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.name}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500 hover:border-red-400'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{plan.name}</span>
                      {plan.popular && (
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
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" className="w-full">
                <Sparkles className="h-5 w-5 mr-2" />
                Upgrade Now
              </Button>
              <button
                onClick={onClose}
                className="text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

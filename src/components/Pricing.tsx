'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { SUBSCRIPTION_PRICES } from '@/types'

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out PlaylistHero',
    features: [
      '3 playlist generations',
      'Up to 50 videos per playlist',
      'Basic AI curation',
      'YouTube embed player',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Weekly',
    price: SUBSCRIPTION_PRICES.weekly,
    period: 'week',
    description: 'Try Pro features risk-free',
    features: [
      'Unlimited playlist generations',
      'Up to 100 videos per playlist',
      'Advanced AI curation',
      'Mood-based filtering',
      'AI prompt enhancement',
    ],
    cta: 'Start Weekly',
    popular: false,
  },
  {
    name: 'Pro Monthly',
    price: SUBSCRIPTION_PRICES.monthly,
    period: 'month',
    description: 'For serious content lovers',
    features: [
      'Everything in Weekly',
      'Save playlists to account',
      'Export to YouTube',
      'Priority support',
    ],
    cta: 'Start Pro',
    popular: true,
  },
  {
    name: 'Pro Yearly',
    price: SUBSCRIPTION_PRICES.yearly,
    period: 'year',
    description: 'Best value for power users',
    features: [
      'Everything in Pro Monthly',
      'Save 17% annually',
      'Early access to features',
      'Exclusive Discord access',
    ],
    cta: 'Start Pro Yearly',
    popular: false,
    savings: '17%',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative p-6 rounded-3xl ${
                plan.popular
                  ? 'glass glow-red border-2 border-red-500/50'
                  : 'glass'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {plan.savings && (
                <div className="absolute -top-3 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 text-xs font-semibold text-green-400">
                    Save {plan.savings}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-white/50">/{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'default' : 'secondary'}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap, Shield, Music, Clock, Heart } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Curation',
    description: 'Our AI understands your mood and creates perfectly matched playlists from millions of YouTube videos.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get your personalized playlist in under 5 seconds. No waiting, no hassle.',
  },
  {
    icon: Music,
    title: 'Any Vibe, Any Time',
    description: 'From lofi study beats to epic gaming soundtracks - describe it and we\'ll find it.',
  },
  {
    icon: Clock,
    title: 'Save & Access Anytime',
    description: 'Your playlists are saved to your account. Access them whenever you need them.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'We don\'t store your YouTube data. Your privacy is our priority.',
  },
  {
    icon: Heart,
    title: 'Made for Music Lovers',
    description: 'Built by music enthusiasts who understand what makes a great playlist.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Choose PlaylistHero?
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            We&apos;ve built the ultimate tool for music discovery and playlist creation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-6 rounded-2xl glass hover:bg-white/10 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

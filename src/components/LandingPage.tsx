'use client'

import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { PlaylistGenerator } from '@/components/PlaylistGenerator'
import { Features } from '@/components/Features'
import { Pricing } from '@/components/Pricing'
import { Footer } from '@/components/Footer'

export function LandingPage() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <PlaylistGenerator />
      <Features />
      <Pricing />
      <Footer />
    </main>
  )
}

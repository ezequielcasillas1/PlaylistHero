'use client'

import { motion } from 'framer-motion'
import { Sparkles, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between glass rounded-b-2xl px-6 mt-0 sm:mt-4 sm:rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-lg opacity-50" />
              <Sparkles className="relative h-8 w-8 text-red-500" />
            </div>
            <span className="text-xl font-bold text-white">
              Playlist<span className="text-red-500">Hero</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">
              Get Started
            </Button>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden glass rounded-2xl mt-2 p-4"
          >
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-white/70 hover:text-white transition-colors py-2">
                Features
              </a>
              <a href="#pricing" className="text-white/70 hover:text-white transition-colors py-2">
                Pricing
              </a>
              <a href="#faq" className="text-white/70 hover:text-white transition-colors py-2">
                FAQ
              </a>
              <hr className="border-white/10" />
              <Button variant="ghost" className="justify-start">
                Sign In
              </Button>
              <Button>
                Get Started
              </Button>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

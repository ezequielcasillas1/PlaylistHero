'use client'

import { motion } from 'framer-motion'
import { Sparkles, Menu, X, User, Music2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { useAuth } from './AuthProvider'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between glass rounded-b-2xl px-6 mt-0 sm:mt-4 sm:rounded-2xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-lg opacity-50" />
              <Sparkles className="relative h-8 w-8 text-red-500" />
            </div>
            <span className="text-xl font-bold text-white">
              Playlist<span className="text-red-500">Hero</span>
            </span>
          </Link>

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
            {loading ? (
              <div className="w-20 h-8 bg-white/10 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <Music2 className="h-4 w-4 mr-2" />
                    My Playlists
                  </Button>
                </Link>
                <Link href="/">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-white/80 max-w-[100px] truncate">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
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
              {user ? (
                <>
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Music2 className="h-4 w-4 mr-2" />
                      My Playlists
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-white/80 truncate">
                      {user.email}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

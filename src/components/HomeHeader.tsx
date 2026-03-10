'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ListMusic, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from './AuthProvider'

export function HomeHeader() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const tierLabel = {
    free: 'Free',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <ListMusic className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PlaylistHero</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-4">
            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white truncate max-w-[120px]">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-white/50">
                    {tierLabel[profile?.tier || 'free']} Plan
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-white/50">
                          {profile?.playlist_count || 0} playlists
                        </p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

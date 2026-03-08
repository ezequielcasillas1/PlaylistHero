'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Shield, Check } from 'lucide-react'
import { Button } from './ui/button'
import { getFingerprint } from '@/lib/fingerprint'

interface ConsentContextType {
  hasConsent: boolean
  isLoading: boolean
}

const ConsentContext = createContext<ConsentContextType>({
  hasConsent: false,
  isLoading: true,
})

export function useConsent() {
  return useContext(ConsentContext)
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsent, setHasConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  useEffect(() => {
    async function checkConsent() {
      try {
        const fp = await getFingerprint()
        setFingerprint(fp)

        const response = await fetch('/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp, action: 'check' }),
        })

        const data = await response.json()
        setHasConsent(data.hasConsent === true)
      } catch (error) {
        console.error('Failed to check consent:', error)
        setHasConsent(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkConsent()
  }, [])

  const handleAccept = async () => {
    if (!fingerprint) return

    setIsAccepting(true)
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, action: 'accept' }),
      })

      const data = await response.json()
      if (data.success) {
        setHasConsent(true)
      }
    } catch (error) {
      console.error('Failed to accept consent:', error)
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <ConsentContext.Provider value={{ hasConsent, isLoading }}>
      {children}
      
      <AnimatePresence>
        {!isLoading && !hasConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="max-w-md w-full glass rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Cookie className="h-8 w-8 text-red-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">
                We Value Your Privacy
              </h2>

              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                PlaylistHero uses cookies and similar technologies to provide you with a 
                personalized experience, track usage for our free tier limits, and improve our services.
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <Shield className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Essential Cookies</p>
                    <p className="text-xs text-white/50">Required for core functionality and security</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <Check className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Usage Tracking</p>
                    <p className="text-xs text-white/50">Helps us manage free tier limits fairly</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAccept}
                loading={isAccepting}
                className="w-full"
                size="lg"
              >
                Accept & Continue
              </Button>

              <p className="mt-4 text-xs text-white/40">
                By clicking "Accept & Continue", you agree to our use of cookies.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConsentContext.Provider>
  )
}

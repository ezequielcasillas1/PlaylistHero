'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'
import { signUp } from '@/lib/auth'
import { getLocalPlaylists, clearLocalPlaylists } from '@/lib/local-storage'

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [localPlaylistCount, setLocalPlaylistCount] = useState(0)

  useEffect(() => {
    const playlists = getLocalPlaylists()
    setLocalPlaylistCount(playlists.length)
  }, [])

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const result = await signUp(email, password)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    if (result.session) {
      const localPlaylists = getLocalPlaylists()
      
      if (localPlaylists.length > 0) {
        try {
          await fetch('/api/playlists/migrate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.session.access_token}`,
            },
            body: JSON.stringify({ playlists: localPlaylists }),
          })
          clearLocalPlaylists()
        } catch (err) {
          console.error('Failed to migrate playlists:', err)
        }
      }
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a0000] to-[#330000] flex flex-col">
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {localPlaylistCount > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-green-400 text-sm">
                You have {localPlaylistCount} playlist{localPlaylistCount > 1 ? 's' : ''} saved locally.
                Create an account to save them permanently!
              </p>
            </div>
          )}
          
          <AuthForm
            mode="signup"
            onSubmit={handleSignUp}
            error={error}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

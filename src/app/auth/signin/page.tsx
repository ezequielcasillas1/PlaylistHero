'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'
import { signIn } from '@/lib/auth'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
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
        <AuthForm
          mode="signin"
          onSubmit={handleSignIn}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a0000] to-[#330000] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
    </div>
  )
}

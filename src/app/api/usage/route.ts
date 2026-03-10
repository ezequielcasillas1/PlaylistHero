import { NextRequest, NextResponse } from 'next/server'
import { getRemainingUsage } from '@/lib/usage-tracking'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

// DEV ONLY - localhost bypass
function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get('host') || ''
  return host.startsWith('localhost') || host.startsWith('127.0.0.1')
}

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json()

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Missing fingerprint' },
        { status: 400 }
      )
    }

    // DEV ONLY - unlimited for localhost
    if (isLocalhost(request)) {
      return NextResponse.json({
        remainingCount: 999,
        canGenerate: true,
      })
    }

    const ipAddress = getClientIP(request)
    const remainingCount = await getRemainingUsage(fingerprint, ipAddress)

    return NextResponse.json({
      remainingCount,
      canGenerate: remainingCount > 0,
    })
  } catch (error) {
    console.error('Usage API Error:', error)
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    )
  }
}

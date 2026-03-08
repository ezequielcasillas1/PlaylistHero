import { NextRequest, NextResponse } from 'next/server'
import { checkCookieConsent, acceptCookieConsent } from '@/lib/usage-tracking'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { fingerprint, action } = await request.json()

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Missing fingerprint' },
        { status: 400 }
      )
    }

    const ipAddress = getClientIP(request)

    if (action === 'check') {
      const result = await checkCookieConsent(fingerprint, ipAddress)
      return NextResponse.json({
        hasConsent: result.hasConsent,
      })
    }

    if (action === 'accept') {
      const result = await acceptCookieConsent(fingerprint, ipAddress)
      return NextResponse.json({
        success: result.hasConsent,
        error: result.error,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Consent API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process consent' },
      { status: 500 }
    )
  }
}

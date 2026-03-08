import { supabase } from './supabase'
import { FREE_PROMPT_LIMIT } from '@/types'

interface UsageResult {
  canGenerate: boolean
  remainingCount: number
  error?: string
}

interface ConsentResult {
  hasConsent: boolean
  error?: string
}

export async function checkCookieConsent(
  fingerprint: string,
  ipAddress: string
): Promise<ConsentResult> {
  try {
    const { data, error } = await supabase
      .from('anonymous_usage')
      .select('cookies_accepted')
      .eq('fingerprint', fingerprint)
      .eq('ip_address', ipAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Consent check error:', error)
      return { hasConsent: false, error: 'Database error' }
    }

    return { hasConsent: data?.cookies_accepted === true }
  } catch (error) {
    console.error('Consent check error:', error)
    return { hasConsent: false, error: 'Unknown error' }
  }
}

export async function acceptCookieConsent(
  fingerprint: string,
  ipAddress: string
): Promise<ConsentResult> {
  try {
    const { data: existing } = await supabase
      .from('anonymous_usage')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('ip_address', ipAddress)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('anonymous_usage')
        .update({
          cookies_accepted: true,
          consent_accepted_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Consent update error:', error)
        return { hasConsent: false, error: 'Database error' }
      }
    } else {
      const { error } = await supabase
        .from('anonymous_usage')
        .insert({
          fingerprint,
          ip_address: ipAddress,
          generation_count: 0,
          cookies_accepted: true,
          consent_accepted_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Consent insert error:', error)
        return { hasConsent: false, error: 'Database error' }
      }
    }

    return { hasConsent: true }
  } catch (error) {
    console.error('Consent accept error:', error)
    return { hasConsent: false, error: 'Unknown error' }
  }
}

export async function checkAndIncrementUsage(
  fingerprint: string,
  ipAddress: string
): Promise<UsageResult> {
  try {
    // Try to find existing record
    const { data: existing, error: fetchError } = await supabase
      .from('anonymous_usage')
      .select('id, generation_count')
      .eq('fingerprint', fingerprint)
      .eq('ip_address', ipAddress)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase fetch error:', fetchError)
      return { canGenerate: false, remainingCount: 0, error: 'Database error' }
    }

    if (existing) {
      // Check if limit reached
      if (existing.generation_count >= FREE_PROMPT_LIMIT) {
        return {
          canGenerate: false,
          remainingCount: 0,
        }
      }

      // Increment count
      const { error: updateError } = await supabase
        .from('anonymous_usage')
        .update({
          generation_count: existing.generation_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Supabase update error:', updateError)
        return { canGenerate: false, remainingCount: 0, error: 'Database error' }
      }

      return {
        canGenerate: true,
        remainingCount: FREE_PROMPT_LIMIT - existing.generation_count - 1,
      }
    }

    // Create new record
    const { error: insertError } = await supabase
      .from('anonymous_usage')
      .insert({
        fingerprint,
        ip_address: ipAddress,
        generation_count: 1,
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { canGenerate: false, remainingCount: 0, error: 'Database error' }
    }

    return {
      canGenerate: true,
      remainingCount: FREE_PROMPT_LIMIT - 1,
    }
  } catch (error) {
    console.error('Usage tracking error:', error)
    return { canGenerate: false, remainingCount: 0, error: 'Unknown error' }
  }
}

export async function getRemainingUsage(
  fingerprint: string,
  ipAddress: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('anonymous_usage')
      .select('generation_count')
      .eq('fingerprint', fingerprint)
      .eq('ip_address', ipAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching usage:', error)
      return FREE_PROMPT_LIMIT
    }

    if (!data) {
      return FREE_PROMPT_LIMIT
    }

    return Math.max(0, FREE_PROMPT_LIMIT - data.generation_count)
  } catch {
    return FREE_PROMPT_LIMIT
  }
}

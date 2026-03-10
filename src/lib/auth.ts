import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface Profile {
  id: string
  email: string
  tier: 'free' | 'weekly' | 'monthly' | 'yearly'
  playlist_count: number
  created_at: string
  updated_at: string
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return {
      user: null,
      session: null,
      error: { message: error.message, status: error.status },
    }
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      user: null,
      session: null,
      error: { message: error.message, status: error.status },
    }
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: { message: error.message, status: error.status } }
  }

  return { error: null }
}

export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return { session: null, error: { message: error.message, status: error.status } }
  }

  return { session: data.session, error: null }
}

export async function getUser(): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return { user: null, error: { message: error.message, status: error.status } }
  }

  return { user: data.user, error: null }
}

export async function getProfile(userId: string): Promise<{ profile: Profile | null; error: AuthError | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return { profile: null, error: { message: error.message } }
  }

  return { profile: data as Profile, error: null }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'tier'>>
): Promise<{ profile: Profile | null; error: AuthError | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { profile: null, error: { message: error.message } }
  }

  return { profile: data as Profile, error: null }
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (data: any) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Update user profile in database when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        await updateUserProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateUserProfile = async (user: User) => {
    try {
      // Check if we're in demo mode
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
        console.log('Demo mode: Skipping user profile update')
          return
        }

      const { error } = await supabase
          .from('profiles')
        .upsert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error('Error updating user profile:', error)
      }
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    // Check if we're in demo mode
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
      return { error: { message: 'デモモードではアカウント作成はできません。実際のSupabaseプロジェクトに接続してください。' } }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData?.name || email.split('@')[0],
          ...userData,
        },
      },
    })

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    // Check if we're in demo mode
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
      return { error: { message: 'デモモードではログインできません。実際のSupabaseプロジェクトに接続してください。' } }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    // Check if we're in demo mode
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
      return { error: { message: 'デモモードではパスワードリセットはできません。' } }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updateProfile = async (data: any) => {
    // Check if we're in demo mode
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co') {
      return { error: { message: 'デモモードではプロフィール更新はできません。' } }
    }

    const { error } = await supabase.auth.updateUser({
      data,
    })

    if (!error && user) {
      // Also update the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      return { error: dbError }
    }

    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string | null
  phone_number: string | null
  role: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  signUp: async (email: string, password: string, fullName: string, phoneNumber: string) => {
    console.log('Auth store: Starting signup...')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    })
    if (error) {
      console.error('Auth store: Signup error:', error)
      throw error
    }
    console.log('Auth store: Signup completed successfully')
  },

  signIn: async (email: string, password: string) => {
    console.log('Auth store: Starting signin...')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error('Auth store: Signin error:', error)
      throw error
    }
    console.log('Auth store: Signin completed successfully')
  },

  signOut: async () => {
    console.log('Auth store: Starting signout...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Auth store: Signout error:', error)
      throw error
    }
    set({ user: null, profile: null })
    console.log('Auth store: Signout completed successfully')
  },

  initialize: async () => {
    try {
      console.log('Auth store: Initializing...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Auth store: Current session:', session)
      
      if (session?.user) {
        console.log('Auth store: User found, fetching profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('Auth store: Profile fetch error:', profileError)
        } else {
          console.log('Auth store: Profile fetched successfully:', profile)
        }
        
        set({ user: session.user, profile })
      } else {
        console.log('Auth store: No active session')
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ isLoading: false })
      console.log('Auth store: Initialization completed')
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth store: Auth state changed:', event, session)
      if (session?.user) {
        console.log('Auth store: New session detected, fetching profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('Auth store: Profile fetch error on state change:', profileError)
        }
        
        set({ user: session.user, profile })
      } else {
        console.log('Auth store: Session ended, clearing user data')
        set({ user: null, profile: null })
      }
    })
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    set(state => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    }))
  },
}))

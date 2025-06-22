
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name?: string
  phone_number?: string
  created_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profileData: { full_name: string; phone_number: string }) => Promise<void>
  checkSessionOnFocus: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      console.log('Initializing auth store...')
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        console.log('Found existing session:', session.user.id)
        set({ user: session.user })
        await get().refreshProfile()
      } else {
        console.log('No existing session found')
        set({ user: null, profile: null })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user })
          await get().refreshProfile()
          
          // FIXED: Silent cart preservation - no popup, no disruption
          console.log('User signed in - guest cart automatically preserved in local storage')
          
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null })
          console.log('User signed out')
        }
      })

    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ user: null, profile: null })
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      set({ user: data.user })
      await get().refreshProfile()
      
      console.log('User signed in successfully:', data.user?.id)
      // FIXED: Guest cart is automatically preserved in localStorage via Zustand persistence
      // No popup, no data loss, seamless transition
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  },

  signUp: async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        set({ user: data.user })
        
        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            phone_number: phoneNumber,
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }

        await get().refreshProfile()
      }
      
      console.log('User signed up successfully:', data.user?.id)
      // FIXED: Guest cart is automatically preserved in localStorage via Zustand persistence
      // No popup, no data loss, seamless transition
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  },

  updateProfile: async (profileData: { full_name: string; phone_number: string }) => {
    const { user } = get()
    if (!user) throw new Error('No user logged in')

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)

      if (error) throw error

      await get().refreshProfile()
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  },

  checkSessionOnFocus: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user })
        await get().refreshProfile()
      } else {
        set({ user: null, profile: null })
      }
    } catch (error) {
      console.error('Error checking session on focus:', error)
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      set({ profile: data })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  },
}))

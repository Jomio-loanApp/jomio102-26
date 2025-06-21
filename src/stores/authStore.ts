
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
  signOut: () => Promise<void>
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
          
          // FIXED: No popup for cart merging - guest cart is automatically preserved
          console.log('User signed in - guest cart will be preserved automatically')
          
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


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
  isInitialized: boolean
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
  checkSessionOnFocus: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  signUp: async (email: string, password: string, fullName: string, phoneNumber: string) => {
    console.log('Auth store: Starting signup...')
    set({ isLoading: true })
    
    try {
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
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    console.log('Auth store: Starting signin...')
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Auth store: Signin error:', error)
        throw error
      }
      
      console.log('Auth store: Signin completed successfully')
      
      // The onAuthStateChange listener will handle state updates
      
    } catch (error) {
      console.error('Auth store: Signin failed:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    console.log('Auth store: Starting signout...')
    set({ isLoading: true })
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Auth store: Signout error:', error)
        throw error
      }
      console.log('Auth store: Signout completed successfully')
    } catch (error) {
      console.error('Auth store: Signout failed:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      console.log('Auth store: Refreshing profile for user:', user.id)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Auth store: Profile refresh error:', error)
      } else {
        console.log('Auth store: Profile refreshed:', profile)
        set({ profile })
      }
    } catch (error) {
      console.error('Auth store: Profile refresh failed:', error)
    }
  },

  checkSessionOnFocus: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth store: Session check error:', error)
        set({ user: null, profile: null })
        return
      }
      
      if (!session) {
        console.log('Auth store: No session found on focus check')
        set({ user: null, profile: null })
        return
      }
      
      // Session is valid, refresh data if needed
      const currentUser = get().user
      if (!currentUser || currentUser.id !== session.user.id) {
        set({ user: session.user })
        await get().refreshProfile()
      }
      
    } catch (error) {
      console.error('Auth store: Focus check failed:', error)
      set({ user: null, profile: null })
    }
  },

  initialize: async () => {
    try {
      console.log('Auth store: Initializing...')
      set({ isLoading: true })
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Auth store: Current session:', session)
      
      if (sessionError) {
        console.error('Auth store: Session error:', sessionError)
        throw sessionError
      }
      
      if (session?.user) {
        console.log('Auth store: User found, setting state and fetching profile...')
        set({ user: session.user })
        await get().refreshProfile()
      } else {
        console.log('Auth store: No active session')
        set({ user: null, profile: null })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, profile: null })
    } finally {
      set({ isLoading: false, isInitialized: true })
      console.log('Auth store: Initialization completed')
    }

    // Set up auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth store: Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Auth store: User signed in, updating state')
        set({ user: session.user, isLoading: false })
        await get().refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        console.log('Auth store: User signed out, clearing state')
        set({ user: null, profile: null, isLoading: false })
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Auth store: Token refreshed, updating user')
        set({ user: session.user })
      }
    })

    // Set up focus event listener for session checks
    const handleFocus = () => {
      console.log('App gained focus, checking session...')
      get().checkSessionOnFocus()
    }

    window.addEventListener('focus', handleFocus)
    
    // Cleanup function would go here in a real app
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')

    console.log('Auth store: Updating profile:', updates)
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('Auth store: Profile update error:', error)
      throw error
    }

    // Update local state
    set(state => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    }))
    
    console.log('Auth store: Profile updated successfully')
  },
}))

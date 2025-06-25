
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { supabase } from '@/lib/supabase'

export const useAppFocus = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { checkSessionOnFocus, user } = useAuthStore()
  const { setIsSupabaseReady, setIsRecoveringSession } = useAppStore()

  useEffect(() => {
    const handleWindowFocus = async () => {
      try {
        console.log('App gained focus. Re-validating session and refreshing data...')
        setIsRefreshing(true)
        setIsRecoveringSession(true)
        setIsSupabaseReady(false)

        // Get latest session state
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check failed:', error)
          throw error
        }

        // Update auth state
        await checkSessionOnFocus()

        // If user is logged in, refresh essential data
        if (session?.user) {
          console.log('User session valid, refreshing user data...')
          // Additional data refresh can be added here if needed
        }

        console.log('App focus recovery completed successfully')
        setIsSupabaseReady(true)
      } catch (error) {
        console.error('Failed to refresh on app focus:', error)
        setIsSupabaseReady(true) // Still set to true to prevent permanent blocking
      } finally {
        setIsRefreshing(false)
        setIsRecoveringSession(false)
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await handleWindowFocus()
      }
    }

    // Listen for both focus and visibility change events
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkSessionOnFocus, setIsSupabaseReady, setIsRecoveringSession])

  return { isRefreshing }
}

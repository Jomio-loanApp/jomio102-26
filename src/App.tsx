
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { supabase } from '@/lib/supabase'
import SplashScreen from '@/components/SplashScreen'
import BottomNavigation from '@/components/BottomNavigation'
import HomePage from '@/pages/HomePage'
import CartPage from '@/pages/CartPage'
import WishlistPage from '@/pages/WishlistPage'
import ProfilePage from '@/pages/ProfilePage'
import ProfileEditPage from '@/pages/ProfileEditPage'
import OrderHistoryPage from '@/pages/OrderHistoryPage'
import AddressesPage from '@/pages/AddressesPage'
import AddressManagementPage from '@/pages/AddressManagementPage'
import DeliveryLocationPage from '@/pages/DeliveryLocationPage'
import SelectAddressPage from '@/pages/SelectAddressPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderSuccessPage from '@/pages/OrderSuccessPage'
import OrderFailurePage from '@/pages/OrderFailurePage'
import NotFound from '@/pages/NotFound'
import SearchResultsPage from "@/pages/SearchResultsPage"

// Component to handle Capacitor back button inside Router context
function AppWithRouter() {
  const navigate = useNavigate()
  const location = useLocation()
  const { initialize, isInitialized, user, checkSessionOnFocus } = useAuthStore()
  const { setIsSupabaseReady, setIsRecoveringSession } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // NATIVE APP STABILITY FEATURE 1: Capacitor back button handling
  useEffect(() => {
    const setupBackButtonHandler = async () => {
      try {
        // Dynamically import Capacitor to avoid build issues in web environment
        const { App: CapacitorApp } = await import('@capacitor/app')
        
        const backButtonListener = await CapacitorApp.addListener('backButton', () => {
          const currentPath = location.pathname
          
          // If on home page, exit app
          if (currentPath === '/') {
            CapacitorApp.exitApp()
          } else {
            // Navigate back one step
            navigate(-1)
          }
        })

        // Cleanup function
        return () => {
          backButtonListener.remove()
        }
      } catch (error) {
        // Capacitor not available (web environment)
        console.log('Capacitor not available, skipping back button handler')
      }
    }

    const cleanup = setupBackButtonHandler()
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn())
    }
  }, [navigate, location.pathname])

  // CRITICAL APP-WIDE "LAZY LOADING" BUG FIX
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          console.log('App became visible, refreshing Supabase connection')
          setIsRecoveringSession(true)
          setIsSupabaseReady(false)
          
          // Proactively refresh session to re-validate connection
          await supabase.auth.getSession()
          
          // Also check and update auth state
          await checkSessionOnFocus()
          
          console.log('App visibility change handled successfully')
          setIsSupabaseReady(true)
        } catch (error) {
          console.error('Failed to refresh Supabase connection:', error)
          setIsSupabaseReady(true) // Still set to true to prevent permanent blocking
        } finally {
          setIsRecoveringSession(false)
        }
      }
    }

    const handleWindowFocus = async () => {
      try {
        console.log('Window gained focus, checking session...')
        setIsRecoveringSession(true)
        setIsSupabaseReady(false)
        
        // Re-validate session on window focus to clear stale loading states
        await supabase.auth.getSession()
        await checkSessionOnFocus()
        
        console.log('Session checked and ready')
        setIsSupabaseReady(true)
      } catch (error) {
        console.error('Failed to check session on focus:', error)
        setIsSupabaseReady(true) // Still set to true to prevent permanent blocking
      } finally {
        setIsRecoveringSession(false)
      }
    }

    // Listen for both visibilitychange and focus events for comprehensive coverage
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [checkSessionOnFocus, setIsSupabaseReady, setIsRecoveringSession])

  if (!isInitialized) {
    return <SplashScreen />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        
        {/* Authentication-gated routes */}
        <Route 
          path="/profile" 
          element={<ProfilePage />} 
        />
        <Route 
          path="/profile/edit" 
          element={<ProfileEditPage />} 
        />
        <Route 
          path="/profile/orders" 
          element={<OrderHistoryPage />} 
        />
        <Route 
          path="/profile/addresses" 
          element={<AddressManagementPage />} 
        />

        {/* Checkout flow routes */}
        <Route 
          path="/select-address" 
          element={user ? <SelectAddressPage /> : <Navigate to="/set-delivery-location" />} 
        />
        <Route path="/set-delivery-location" element={<DeliveryLocationPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* Order confirmation routes - NEW SIMPLIFIED FLOW */}
        <Route path="/order-placed-successfully" element={<OrderSuccessPage />} />
        <Route path="/order-successful/:orderId" element={<Navigate to="/order-placed-successfully" />} />
        <Route path="/order-confirmation/success/:orderId" element={<Navigate to="/order-placed-successfully" />} />
        <Route path="/order-confirmation/failure" element={<OrderFailurePage />} />

        {/* Search route */}
        <Route path="/search" element={<SearchResultsPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppWithRouter />
    </BrowserRouter>
  )
}

export default App

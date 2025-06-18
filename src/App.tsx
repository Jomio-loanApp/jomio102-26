
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
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
  const { initialize, isInitialized, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Capacitor back button handling
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

  // Handle app visibility changes to prevent freezing
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          // Refresh the auth session to re-establish connection
          await supabase.auth.getSession()
          console.log('App became visible, refreshed Supabase connection')
        } catch (error) {
          console.error('Failed to refresh Supabase connection:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

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
        
        {/* Order confirmation routes */}
        <Route path="/order-confirmation/success/:orderId" element={<OrderSuccessPage />} />
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

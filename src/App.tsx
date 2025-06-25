
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { useAppFocus } from '@/hooks/useAppFocus'
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

// Component to handle Capacitor back button and app focus inside Router context
function AppWithRouter() {
  const navigate = useNavigate()
  const location = useLocation()
  const { initialize, isInitialized, user } = useAuthStore()
  const { isRecoveringSession } = useAppStore()
  
  // Use the new app focus hook for stability
  const { isRefreshing } = useAppFocus()

  useEffect(() => {
    initialize()
  }, [initialize])

  // NATIVE APP STABILITY FEATURE: Capacitor back button handling
  useEffect(() => {
    const setupBackButtonHandler = async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app')
        
        const backButtonListener = await CapacitorApp.addListener('backButton', () => {
          const currentPath = location.pathname
          
          if (currentPath === '/') {
            CapacitorApp.exitApp()
          } else {
            navigate(-1)
          }
        })

        return () => {
          backButtonListener.remove()
        }
      } catch (error) {
        console.log('Capacitor not available, skipping back button handler')
      }
    }

    const cleanup = setupBackButtonHandler()
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn())
    }
  }, [navigate, location.pathname])

  if (!isInitialized) {
    return <SplashScreen />
  }

  // Show loading overlay during session recovery
  if (isRecoveringSession || isRefreshing) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Refreshing...</p>
        </div>
      </div>
    )
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
          element={<AddressesPage />} 
        />

        {/* Checkout flow routes */}
        <Route 
          path="/select-address" 
          element={user ? <SelectAddressPage /> : <Navigate to="/set-delivery-location" />} 
        />
        <Route path="/set-delivery-location" element={<DeliveryLocationPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* Order confirmation routes */}
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


import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
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

function AppWithRouter() {
  const navigate = useNavigate()
  const location = useLocation()
  const { initialize, isInitialized, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Capacitor back button handling only
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

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/profile/orders" element={<OrderHistoryPage />} />
        <Route path="/profile/addresses" element={<AddressesPage />} />

        <Route 
          path="/select-address" 
          element={user ? <SelectAddressPage /> : <Navigate to="/set-delivery-location" />} 
        />
        <Route path="/set-delivery-location" element={<DeliveryLocationPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        
        <Route path="/order-placed-successfully" element={<OrderSuccessPage />} />
        <Route path="/order-successful/:orderId" element={<Navigate to="/order-placed-successfully" />} />
        <Route path="/order-confirmation/success/:orderId" element={<Navigate to="/order-placed-successfully" />} />
        <Route path="/order-confirmation/failure" element={<OrderFailurePage />} />

        <Route path="/search" element={<SearchResultsPage />} />
        
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

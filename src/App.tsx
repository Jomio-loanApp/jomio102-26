
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  const { initialize, isInitialized, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return <SplashScreen />
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App

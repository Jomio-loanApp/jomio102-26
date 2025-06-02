import { useEffect, useState } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useAuthStore } from '@/stores/authStore'
import SplashScreen from '@/components/SplashScreen'
import BottomNavigation from '@/components/BottomNavigation'
import HomePage from '@/pages/HomePage'
import CartPage from '@/pages/CartPage'
import WishlistPage from '@/pages/WishlistPage'
import DeliveryLocationPage from '@/pages/DeliveryLocationPage'
import CheckoutDetailsPage from '@/pages/CheckoutDetailsPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/select-delivery-location" element={<DeliveryLocationPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/*" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNavigation />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App

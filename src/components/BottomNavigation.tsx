
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useHomeStore } from '@/stores/homeStore'
import { Home, Heart, ShoppingCart, User, LogIn } from 'lucide-react'
import LoginModal from './LoginModal'

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { getItemCount } = useCartStore()
  const { isHeaderSticky } = useHomeStore()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const cartItemCount = getItemCount()

  const handleLoginClick = () => {
    if (user) {
      navigate('/profile')
    } else {
      setShowLoginModal(true)
    }
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/', onClick: () => navigate('/') },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/wishlist', onClick: () => navigate('/wishlist') },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, path: '/cart', badge: cartItemCount, onClick: () => navigate('/cart') },
    { 
      id: 'profile', 
      label: user ? 'Profile' : 'Login', 
      icon: user ? User : LogIn, 
      path: user ? '/profile' : '/login',
      onClick: handleLoginClick
    },
  ]

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 md:hidden shadow-lg transition-transform duration-300 ${
        isHeaderSticky ? 'translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex justify-around items-center py-2 safe-area-bottom">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center py-2 px-2 min-w-0 flex-1 relative transition-all duration-200 ${
                  isActive
                    ? 'text-green-600 scale-105'
                    : 'text-gray-500 hover:text-green-600 hover:scale-105'
                }`}
              >
                <div className="relative">
                  <div className={`p-1 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shadow-sm animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-1 truncate w-full text-center transition-all duration-200 ${
                  isActive ? 'font-medium' : 'font-normal'
                }`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}

export default BottomNavigation

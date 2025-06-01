
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Home, Heart, ShoppingCart, User, LogIn } from 'lucide-react'
import LoginModal from './LoginModal'

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { getItemCount } = useCartStore()
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 relative ${
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-500 hover:text-green-600'
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 truncate w-full text-center">
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

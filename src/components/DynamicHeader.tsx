
import { useEffect, useRef, useState } from 'react'
import { Search, User, ShoppingCart } from 'lucide-react'
import { useHomeStore } from '@/stores/homeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from './LoginModal'

interface DynamicHeaderProps {
  onSearch: (query: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const DynamicHeader = ({ onSearch, searchQuery, setSearchQuery }: DynamicHeaderProps) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getItemCount } = useCartStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { 
    headerBackground, 
    isHeaderSticky, 
    showHeaderText,
    setHeaderSticky,
    setShowHeaderText
  } = useHomeStore()
  
  const headerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const cartItemCount = getItemCount()

  useEffect(() => {
    const observerOptions = {
      threshold: 0,
      rootMargin: '0px'
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (!entry.isIntersecting) {
        // Trigger has scrolled out of view - header should be sticky
        setHeaderSticky(true)
        setShowHeaderText(false)
      } else {
        // Trigger is in view - header should not be sticky
        setHeaderSticky(false)
        setShowHeaderText(true)
      }
    }, observerOptions)

    if (triggerRef.current) {
      observer.observe(triggerRef.current)
    }

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current)
      }
    }
  }, [setHeaderSticky, setShowHeaderText])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile')
    } else {
      setShowLoginModal(true)
    }
  }

  const getHeaderStyle = () => {
    if (!headerBackground) return {}
    
    if (headerBackground.background_image_url) {
      return {
        backgroundImage: `url(${headerBackground.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    
    if (headerBackground.background_color_hex) {
      return {
        backgroundColor: headerBackground.background_color_hex
      }
    }
    
    return {}
  }

  return (
    <>
      {/* Single Parent Container with Background */}
      <div 
        ref={headerRef}
        className={`
          ${isHeaderSticky ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-lg' : 'relative'}
          transition-all duration-300 ease-in-out
        `}
        style={!isHeaderSticky ? getHeaderStyle() : {}}
      >
        {/* Semi-transparent overlay for readability when background image is present */}
        {headerBackground?.background_image_url && !isHeaderSticky && (
          <div className="absolute inset-0 bg-black bg-opacity-30 z-10" />
        )}

        <div className="relative z-20 px-4 py-4">
          {/* Row 1: Top Bar - "Darbhanga" and Icons */}
          {showHeaderText && !isHeaderSticky && (
            <div className="flex justify-between items-center mb-4">
              {/* Left Side: "Darbhanga" text */}
              <h1 
                className="text-2xl font-bold cursor-pointer transition-opacity duration-300"
                style={{ 
                  color: headerBackground?.background_image_url ? 'white' : '#059669',
                  textShadow: headerBackground?.background_image_url ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                }}
                onClick={() => navigate('/')}
              >
                Darbhanga
              </h1>

              {/* Right Side: Cart and Profile Icons */}
              <div className="flex items-center gap-3">
                {/* Cart Button */}
                <Link
                  to="/cart"
                  className="relative p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Profile Button */}
                <button
                  onClick={handleProfileClick}
                  className="p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <User className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          )}

          {/* Row 2: Full-Width Search Box */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-white rounded-full border-2 border-gray-200 focus:border-green-500 transition-colors"
              />
            </div>
          </form>

          {/* Row 3: Category Scroller - This will be imported from CategoryScroller component */}
          <div className="relative z-30">
            {/* CategoryScroller will be rendered here by parent component */}
          </div>
        </div>
      </div>

      {/* Invisible Trigger Element */}
      <div ref={triggerRef} className="h-px" />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}

export default DynamicHeader

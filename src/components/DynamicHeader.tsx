
import { useEffect, useState } from 'react'
import { Search, User, ShoppingCart, X } from 'lucide-react'
import { useHomeStore } from '@/stores/homeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link, useNavigate, useLocation } from 'react-router-dom'

interface DynamicHeaderProps {
  onProfileClick?: () => void
}

const DynamicHeader = ({ onProfileClick }: DynamicHeaderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { getItemCount } = useCartStore()
  const {
    headerBackground,
    isHeaderSticky,
    showHeaderText,
    setHeaderSticky,
    setShowHeaderText
  } = useHomeStore()

  const cartItemCount = getItemCount()
  const [localQuery, setLocalQuery] = useState('')

  // Keep input synced with URL q param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlQ = params.get('q') || ''
    setLocalQuery(urlQ)
  }, [location.pathname, location.search])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setHeaderSticky(scrollY > 100)
      setShowHeaderText(scrollY <= 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [setHeaderSticky, setShowHeaderText])

  // Manual search trigger - only on Enter or button click
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = localQuery.trim()
    if (trimmed.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const handleSearchButtonClick = () => {
    handleSearch()
  }

  const clearSearch = () => {
    setLocalQuery('')
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
    <div
      className={`
        ${isHeaderSticky ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-lg' : 'relative'}
        transition-all duration-300 ease-in-out
      `}
      style={!isHeaderSticky ? getHeaderStyle() : {}}
    >
      {/* Desktop-constrained content */}
      <div className={`${isHeaderSticky ? 'w-full max-w-screen-xl mx-auto' : ''} px-4 py-4`}>
        {/* Store Title - Hide when scrolled */}
        {showHeaderText && !isHeaderSticky && (
          <div className="text-center mb-4">
            <h1
              className="text-2xl sm:text-3xl font-bold cursor-pointer transition-opacity duration-300"
              style={{
                color: headerBackground?.background_image_url ? 'white' : '#059669',
                textShadow: headerBackground?.background_image_url ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
              }}
              onClick={() => navigate('/')}
            >
              JOMIO DARBHANGA
            </h1>
          </div>
        )}
        
        {/* Search Bar and Actions */}
        <div className="flex items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                inputMode="search"
                placeholder="Search for products..."
                value={localQuery}
                onChange={e => setLocalQuery(e.target.value)}
                className="pl-10 pr-20 py-3 w-full bg-white rounded-full border-2 border-gray-200 focus:border-green-500 transition-colors"
              />
              
              {/* Search and Clear buttons */}
              {localQuery.trim().length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={clearSearch}
                    className="p-1 h-7 w-7 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSearchButtonClick}
                    className="p-1 h-7 w-7 bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </form>
          
          {/* Cart Button */}
          <Link
            to="/cart"
            className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>
          
          {/* User Button */}
          {user ? (
            <Link to="/profile" className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
              <User className="w-6 h-6 text-gray-700" />
            </Link>
          ) : (
            <button
              className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              onClick={onProfileClick}
              aria-label="Login"
              type="button"
            >
              <User className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DynamicHeader

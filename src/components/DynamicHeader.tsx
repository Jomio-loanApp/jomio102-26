
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
    setShowHeaderText,
    categories,
    selectedCategory,
    setSelectedCategory
  } = useHomeStore()

  const cartItemCount = getItemCount()
  const [localQuery, setLocalQuery] = useState('')

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

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = localQuery.trim()
    if (trimmed.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const clearSearch = () => {
    setLocalQuery('')
  }

  return (
    <div
      className={`
        ${isHeaderSticky ? 'fixed top-0 left-0 right-0 z-50' : 'relative'}
        transition-all duration-300 ease-in-out w-full
      `}
    >
      {/* Single Parent Container with Background */}
      <div 
        className="relative w-full"
        style={{
          backgroundImage: !isHeaderSticky && headerBackground?.background_image_url ? `url(${headerBackground.background_image_url})` : 'none',
          backgroundColor: isHeaderSticky ? '#ffffff' : (headerBackground?.background_color_hex || '#059669'),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Glassy Overlay - only when not sticky and has background image */}
        {!isHeaderSticky && headerBackground?.background_image_url && (
          <div className="absolute inset-0 bg-black bg-opacity-30 z-10"></div>
        )}

        {/* Header Content */}
        <div className="w-full max-w-screen-xl mx-auto px-4 py-4 relative z-20 space-y-4">
          
          {/* Row 1: Top Bar */}
          <div className="flex justify-between items-center">
            {/* Left Side - Store Name */}
            <h1
              className="text-xl sm:text-2xl font-bold cursor-pointer transition-opacity duration-300"
              style={{
                color: isHeaderSticky ? '#059669' : 'white',
                textShadow: isHeaderSticky ? 'none' : '2px 2px 4px rgba(0,0,0,0.5)'
              }}
              onClick={() => navigate('/')}
            >
              JOMIO DARBHANGA
            </h1>
            
            {/* Right Side - Cart and Profile Icons */}
            <div className="flex items-center gap-3">
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

          {/* Row 2: Full-Width Search Box */}
          <form onSubmit={handleSearch} className="w-full">
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
                    onClick={handleSearch}
                    className="p-1 h-7 w-7 bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </form>

          {/* Row 3: Category Scroller */}
          <div className="w-full">
            <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-2">
              {/* All Category */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex-shrink-0 flex flex-col items-center min-w-[60px] transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
                  selectedCategory === null 
                    ? 'bg-white bg-opacity-80 ring-2 ring-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                }`}>
                  <span className="text-lg">🏪</span>
                </div>
                <span className={`text-xs font-medium text-center leading-tight ${
                  selectedCategory === null 
                    ? (isHeaderSticky ? 'text-green-600 font-bold' : 'text-white font-bold')
                    : (isHeaderSticky ? 'text-gray-700' : 'text-white')
                }`} style={{ textShadow: isHeaderSticky ? 'none' : '1px 1px 2px rgba(0,0,0,0.7)' }}>
                  All
                </span>
                {selectedCategory === null && (
                  <div className={`w-6 h-0.5 mt-1 rounded-full ${isHeaderSticky ? 'bg-green-600' : 'bg-white'}`}></div>
                )}
              </button>

              {/* Dynamic Categories */}
              {categories.map((category) => (
                <button
                  key={category.category_id}
                  onClick={() => setSelectedCategory(category.category_id)}
                  className="flex-shrink-0 flex flex-col items-center min-w-[60px] transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 overflow-hidden transition-all duration-200 ${
                    selectedCategory === category.category_id 
                      ? 'bg-white bg-opacity-80 ring-2 ring-white' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                  }`}>
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${
                    selectedCategory === category.category_id 
                      ? (isHeaderSticky ? 'text-green-600 font-bold' : 'text-white font-bold')
                      : (isHeaderSticky ? 'text-gray-700' : 'text-white')
                  }`} style={{ textShadow: isHeaderSticky ? 'none' : '1px 1px 2px rgba(0,0,0,0.7)' }}>
                    {category.name}
                  </span>
                  {selectedCategory === category.category_id && (
                    <div className={`w-6 h-0.5 mt-1 rounded-full ${isHeaderSticky ? 'bg-green-600' : 'bg-white'}`}></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicHeader

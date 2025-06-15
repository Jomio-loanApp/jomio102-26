
import { useEffect, useRef, useState } from 'react'
import { Search, User, ShoppingCart } from 'lucide-react'
import { useHomeStore } from '@/stores/homeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'

interface DynamicHeaderProps {
  onSearch: (query: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onProfileClick?: () => void
}

const DynamicHeader = ({ onSearch, searchQuery, setSearchQuery, onProfileClick }: DynamicHeaderProps) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getItemCount } = useCartStore()
  const { 
    headerBackground, 
    isHeaderSticky, 
    showHeaderText,
    setHeaderSticky,
    setShowHeaderText
  } = useHomeStore()
  
  const headerRef = useRef<HTMLDivElement>(null)
  const cartItemCount = getItemCount()
  const [localQuery, setLocalQuery] = useState(searchQuery || "")
  const debouncedTerm = useDebounce(localQuery, 400)
  const hasNavigated = useRef(false)

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  // Debounced navigation on header
  useEffect(() => {
    if (debouncedTerm && !hasNavigated.current) {
      hasNavigated.current = true
      navigate(`/search?q=${encodeURIComponent(debouncedTerm)}`)
    }
    if (!debouncedTerm && hasNavigated.current) {
      hasNavigated.current = false
    }
    // eslint-disable-next-line
  }, [debouncedTerm, navigate])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const threshold = 100
      
      setHeaderSticky(scrollY > threshold)
      setShowHeaderText(scrollY <= 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [setHeaderSticky, setShowHeaderText])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (localQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`)
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
    <div 
      ref={headerRef}
      className={`
        ${isHeaderSticky ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-lg' : 'relative'}
        transition-all duration-300 ease-in-out
      `}
      style={!isHeaderSticky ? getHeaderStyle() : {}}
    >
      <div className="px-4 py-4">
        {/* Store Title - Hide when scrolled */}
        {showHeaderText && !isHeaderSticky && (
          <div className="text-center mb-4">
            <h1 
              className="text-3xl font-bold cursor-pointer transition-opacity duration-300"
              style={{ 
                color: headerBackground?.background_image_url ? 'white' : '#059669',
                textShadow: headerBackground?.background_image_url ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
              }}
              onClick={() => navigate('/')}
            >
              JOMIO STORE
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
                placeholder="Search for products..."
                value={localQuery}
                onChange={(e) => {
                  setLocalQuery(e.target.value)
                  setSearchQuery(e.target.value)
                }}
                className="pl-10 pr-4 py-3 w-full bg-white rounded-full border-2 border-gray-200 focus:border-green-500 transition-colors"
              />
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


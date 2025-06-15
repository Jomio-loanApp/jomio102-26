import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { User, LogIn, ShoppingCart, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoginModal from './LoginModal'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'

interface HeaderProps {
  showSearch?: boolean
}

const MIN_SEARCH_LENGTH = 2

const Header = ({ showSearch = true }: HeaderProps) => {
  const { user, profile } = useAuthStore()
  const { getItemCount } = useCartStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 400)
  const navigate = useNavigate()
  const location = useLocation()
  const lastQueried = useRef('')

  // Only navigate and trigger search if query is >= 2 letters and has changed
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (trimmed.length >= MIN_SEARCH_LENGTH && trimmed !== lastQueried.current) {
      lastQueried.current = trimmed
      if (!location.pathname.startsWith('/search')) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`)
      } else {
        // If already on /search, update query param without pushing a new entry if possible
        navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
      }
    }
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      lastQueried.current = ''
    }
    // eslint-disable-next-line
  }, [debouncedQuery])

  // Keep search bar populated from URL when visiting /search?q=...
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlQ = params.get('q') || ''
    setSearchQuery(urlQ)
  }, [location.pathname, location.search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const cartItemCount = getItemCount()

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-600 cursor-pointer" onClick={() => navigate('/')}>
                JOMIO Online Store
              </h1>
            </div>
            {/* Search Bar - Desktop */}
            {showSearch && (
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      inputMode="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full"
                      minLength={MIN_SEARCH_LENGTH}
                    />
                  </div>
                </form>
              </div>
            )}

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
              {/* User */}
              {user ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden sm:inline">
                    {profile?.full_name || 'Profile'}
                  </span>
                </button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Button>
              )}
            </div>
          </div>
          {/* Search Bar - Mobile */}
          {showSearch && (
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    inputMode="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                    minLength={MIN_SEARCH_LENGTH}
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      </header>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}

export default Header

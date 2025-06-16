import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { User, LogIn, ShoppingCart, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoginModal from './LoginModal'
import { useNavigate, useLocation } from 'react-router-dom'

interface HeaderProps {
  showSearch?: boolean
}

const MIN_SEARCH_LENGTH = 2

const Header = ({ showSearch = true }: HeaderProps) => {
  const { user, profile } = useAuthStore()
  const { getItemCount } = useCartStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  // Remove debouncedQuery and all useDebounce usage

  // Keep search bar populated from URL q param, but do NOT auto-search
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlQ = params.get('q') || ''
    setSearchQuery(urlQ)
  }, [location.pathname, location.search])

  // Only trigger search on Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
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
                    
                    {/* Search and Clear buttons - appear when typing */}
                    {searchQuery.trim().length > 0 && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={clearSearch}
                          className="p-1 h-6 w-6 hover:bg-gray-100"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="p-1 h-6 w-6 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Search className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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
                  
                  {/* Search and Clear buttons - mobile */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearSearch}
                        className="p-1 h-6 w-6 hover:bg-gray-100"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="p-1 h-6 w-6 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Search className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
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

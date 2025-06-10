
import { useEffect, useRef } from 'react'
import { Search, User, ShoppingCart } from 'lucide-react'
import { useHomeStore } from '@/stores/homeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from 'react-router-dom'

interface DynamicHeaderProps {
  onSearch: (query: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const DynamicHeader = ({ onSearch, searchQuery, setSearchQuery }: DynamicHeaderProps) => {
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
  const triggerRef = useRef<HTMLDivElement>(null)
  const cartItemCount = getItemCount()

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (!entry.isIntersecting) {
        setHeaderSticky(true)
        setShowHeaderText(false)
      } else {
        setHeaderSticky(false)
        setShowHeaderText(true)
      }
    }

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-1px 0px 0px 0px',
      threshold: 0
    })

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
      <div 
        ref={headerRef}
        className={`
          ${isHeaderSticky ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-lg' : 'relative'}
          transition-all duration-300 ease-in-out
        `}
        style={!isHeaderSticky ? getHeaderStyle() : {}}
      >
        {/* Semi-transparent overlay for background readability */}
        {!isHeaderSticky && headerBackground?.background_image_url && (
          <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"></div>
        )}
        
        <div className="relative z-10">
          {/* Row 1: Top Bar - Hide when sticky */}
          {showHeaderText && !isHeaderSticky && (
            <div className="flex justify-between items-center px-4 py-3">
              <h1 
                className="text-2xl md:text-3xl font-bold cursor-pointer transition-opacity duration-300"
                style={{ 
                  color: headerBackground?.background_image_url ? 'white' : '#059669',
                  textShadow: headerBackground?.background_image_url ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                }}
                onClick={() => navigate('/')}
              >
                Darbhanga
              </h1>
              
              <div className="flex items-center gap-3">
                {/* Cart Button */}
                <Link
                  to="/cart"
                  className="relative p-2 md:p-3 bg-white bg-opacity-90 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-bold">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Profile Button */}
                <Link
                  to={user ? '/profile' : '/login'}
                  className="p-2 md:p-3 bg-white bg-opacity-90 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <User className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                </Link>
              </div>
            </div>
          )}

          {/* Row 2: Full-Width Search Box */}
          <div className="px-4 pb-3">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 pr-4 py-2 md:py-3 w-full bg-white rounded-full border-2 border-gray-200 focus:border-green-500 transition-colors text-sm md:text-base"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Invisible trigger element for Intersection Observer */}
      <div ref={triggerRef} className="h-px w-full"></div>
    </>
  )
}

export default DynamicHeader

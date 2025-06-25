
import { useState, useEffect } from 'react'
import { useHomeStore } from '@/stores/homeStore'
import DynamicHeader from '@/components/DynamicHeader'
import BannerStrip from '@/components/BannerStrip'
import ContentSectionRenderer from '@/components/ContentSectionRenderer'
import ProductQuickView from '@/components/ProductQuickView'
import { useAuthStore } from '@/stores/authStore'
import LoginModal from '@/components/LoginModal'

interface Product {
  product_id: string
  name: string
  description?: string
  price_string: string
  numeric_price: number
  unit_type: string
  image_url?: string
  category_id?: string
  is_active: boolean
  availability_status: string
}

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user } = useAuthStore()
  const { 
    selectedCategory,
    fetchHeaderBackground,
    fetchBannerStrips,
    fetchHomeContentSections,
    fetchCategories
  } = useHomeStore()

  useEffect(() => {
    fetchHeaderBackground()
    fetchBannerStrips()
    fetchHomeContentSections()
    fetchCategories()
  }, [fetchHeaderBackground, fetchBannerStrips, fetchHomeContentSections, fetchCategories])

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleCloseQuickView = () => {
    setSelectedProduct(null)
  }

  const handleProfileClick = () => {
    if (!user) setShowLoginModal(true)
  }

  const transformProductForQuickView = (product: Product) => {
    return {
      id: product.product_id,
      name: product.name,
      description: product.description || null,
      price_string: product.price_string,
      unit_type: product.unit_type,
      image_url: product.image_url || null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with integrated background and category scroller */}
      <DynamicHeader onProfileClick={handleProfileClick} />

      {/* Full-width banner strip */}
      <BannerStrip />

      {/* Desktop-constrained main content with reduced horizontal padding */}
      <main className="relative w-full max-w-screen-xl mx-auto px-2">
        {searchQuery ? (
          <div className="py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Search Results for "{searchQuery}"
            </h2>
            <p className="text-gray-600">Search functionality will be implemented here with interspersed content.</p>
          </div>
        ) : (
          <ContentSectionRenderer onQuickView={handleQuickView} />
        )}
      </main>

      {selectedProduct && (
        <ProductQuickView
          product={transformProductForQuickView(selectedProduct)}
          isOpen={!!selectedProduct}
          onClose={handleCloseQuickView}
        />
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}

export default HomePage

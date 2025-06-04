
import { useState, useEffect } from 'react'
import { useHomeStore } from '@/stores/homeStore'
import DynamicHeader from '@/components/DynamicHeader'
import CategoryScroller from '@/components/CategoryScroller'
import BannerStrip from '@/components/BannerStrip'
import ContentSectionRenderer from '@/components/ContentSectionRenderer'
import ProductQuickView from '@/components/ProductQuickView'

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
  const { 
    selectedCategory,
    fetchHeaderBackground,
    fetchBannerStrips,
    fetchHomeContentSections,
    isHeaderSticky
  } = useHomeStore()

  useEffect(() => {
    // Initialize with default home content
    fetchHeaderBackground()
    fetchBannerStrips()
    fetchHomeContentSections()
  }, [fetchHeaderBackground, fetchBannerStrips, fetchHomeContentSections])

  const handleSearch = (query: string) => {
    console.log('Search query:', query)
    setSearchQuery(query)
    // TODO: Implement search results with interspersed content
  }

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleCloseQuickView = () => {
    setSelectedProduct(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Header */}
      <DynamicHeader
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Category Scroller */}
      <div className={isHeaderSticky ? 'mt-32' : ''}>
        <CategoryScroller />
      </div>

      {/* Banner Strip */}
      <BannerStrip />

      {/* Main Content */}
      <main className="relative">
        {searchQuery ? (
          // Search Results View
          <div className="px-4 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Search Results for "{searchQuery}"
            </h2>
            <p className="text-gray-600">Search functionality will be implemented here with interspersed content.</p>
          </div>
        ) : (
          // Dynamic Content Sections
          <ContentSectionRenderer onQuickView={handleQuickView} />
        )}
      </main>

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  )
}

export default HomePage

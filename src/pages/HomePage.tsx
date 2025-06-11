
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
    isHeaderSticky,
    headerBackground
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

  // Transform product for ProductQuickView component
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
      {/* Dynamic Header with integrated background */}
      <DynamicHeader
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Category Scroller - positioned after header */}
      <CategoryScroller />

      {/* Banner Strip - Full width, outside background area */}
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
          product={transformProductForQuickView(selectedProduct)}
          isOpen={!!selectedProduct}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  )
}

export default HomePage

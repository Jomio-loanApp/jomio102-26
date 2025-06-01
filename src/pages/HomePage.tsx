
import { useState } from 'react'
import Header from '@/components/Header'
import OfferSlider from '@/components/OfferSlider'
import CategoryNavigation from '@/components/CategoryNavigation'
import ProductListing from '@/components/ProductListing'

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSelectedCategory(null) // Clear category filter when searching
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setSearchQuery('') // Clear search when selecting category
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          {/* Offer Slider */}
          <OfferSlider />

          {/* Category Navigation */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <CategoryNavigation 
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>

          {/* Products Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {searchQuery 
                ? `Search Results for "${searchQuery}"`
                : selectedCategory 
                  ? 'Products'
                  : 'All Products'
              }
            </h2>
            <ProductListing 
              categoryId={selectedCategory}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage

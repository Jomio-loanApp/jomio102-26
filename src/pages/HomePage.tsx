
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header onSearch={handleSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-8">
          {/* Offer Slider */}
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <OfferSlider />
          </div>

          {/* Category Navigation */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-1 h-6 bg-green-600 rounded-full mr-3"></span>
                Shop by Category
              </h2>
            </div>
            <CategoryNavigation 
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-1 h-6 bg-green-600 rounded-full mr-3"></span>
                {searchQuery 
                  ? `Search Results for "${searchQuery}"`
                  : selectedCategory 
                    ? 'Products'
                    : 'All Products'
                }
              </h2>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
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

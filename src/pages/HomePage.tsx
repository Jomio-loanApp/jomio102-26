
import { useState } from 'react'
import Header from '@/components/Header'
import OfferSlider from '@/components/OfferSlider'
import CategoryNavigation from '@/components/CategoryNavigation'
import ProductListing from '@/components/ProductListing'

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const handleSearch = (query: string) => {
    console.log('HomePage: Search query:', query)
    setSearchQuery(query)
    setSelectedCategory(null) // Clear category filter when searching
  }

  const handleCategorySelect = (categoryId: string | null) => {
    console.log('HomePage: Category selected:', categoryId)
    setSelectedCategory(categoryId)
    setSearchQuery('') // Clear search when selecting category
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header onSearch={handleSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-8">
          {/* Offer Slider */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <OfferSlider />
          </div>

          {/* Category Navigation */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3"></span>
                Shop by Category
              </h2>
              {selectedCategory && (
                <button
                  onClick={() => handleCategorySelect(null)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  View All
                </button>
              )}
            </div>
            <CategoryNavigation 
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3"></span>
                {searchQuery 
                  ? `Search Results for "${searchQuery}"`
                  : selectedCategory 
                    ? 'Category Products'
                    : 'Featured Products'
                }
              </h2>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
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

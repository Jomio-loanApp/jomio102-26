
import { useEffect } from 'react'
import { useHomeStore } from '@/stores/homeStore'

const CategoryScroller = () => {
  const { 
    categories, 
    selectedCategory, 
    setSelectedCategory, 
    fetchCategories,
    isHeaderSticky 
  } = useHomeStore()

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <div className={`
      ${isHeaderSticky ? 'fixed top-20 left-0 right-0 z-40 bg-white shadow-md' : 'relative'}
      transition-all duration-300 ease-in-out
    `}>
      <div className="px-4 py-3">
        <div className="flex overflow-x-auto scrollbar-hide gap-4">
          {/* All Category */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex-shrink-0 flex flex-col items-center min-w-[60px] transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
              selectedCategory === null 
                ? 'bg-green-100 ring-2 ring-green-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}>
              <span className="text-lg">🏪</span>
            </div>
            <span className={`text-xs font-medium text-center leading-tight ${
              selectedCategory === null ? 'text-green-600' : 'text-gray-700'
            }`}>
              All
            </span>
            {selectedCategory === null && (
              <div className="w-6 h-0.5 bg-green-500 mt-1 rounded-full"></div>
            )}
          </button>

          {/* Dynamic Categories */}
          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => setSelectedCategory(category.category_id)}
              className="flex-shrink-0 flex flex-col items-center min-w-[60px] transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 overflow-hidden transition-all duration-200 ${
                selectedCategory === category.category_id 
                  ? 'bg-green-100 ring-2 ring-green-500' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}>
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">📦</span>
                )}
              </div>
              <span className={`text-xs font-medium text-center leading-tight ${
                selectedCategory === category.category_id ? 'text-green-600' : 'text-gray-700'
              }`}>
                {category.name}
              </span>
              {selectedCategory === category.category_id && (
                <div className="w-6 h-0.5 bg-green-500 mt-1 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryScroller

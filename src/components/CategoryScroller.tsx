
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
        <div className="flex overflow-x-auto scrollbar-hide gap-3">
          {/* All Category */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`
              flex-shrink-0 flex flex-col items-center w-16 p-2 transition-all duration-200
            `}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-1">
              <span className="text-white font-bold text-sm">All</span>
            </div>
            <span className={`text-xs font-medium text-gray-700 text-center truncate w-full
              ${selectedCategory === null ? 'underline' : ''}
            `}>
              All
            </span>
          </button>

          {/* Dynamic Categories */}
          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => setSelectedCategory(category.category_id)}
              className={`
                flex-shrink-0 flex flex-col items-center w-16 p-2 transition-all duration-200
              `}
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-1 overflow-hidden">
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xs">📦</span>
                )}
              </div>
              <span className={`text-xs font-medium text-gray-700 text-center truncate w-full leading-tight
                ${selectedCategory === category.category_id ? 'underline' : ''}
              `}>
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryScroller

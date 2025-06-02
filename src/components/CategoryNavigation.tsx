
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Category {
  category_id: string
  name: string
  image_url: string | null
}

interface CategoryNavigationProps {
  onCategorySelect: (categoryId: string | null) => void
  selectedCategory: string | null
}

const CategoryNavigation = ({ onCategorySelect, selectedCategory }: CategoryNavigationProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('Fetching categories...')
      
      // Fixed query - only select existing columns, no filters for non-existent columns
      const { data, error } = await supabase
        .from('categories')
        .select('category_id, name, image_url')
        .order('name', { ascending: true })

      console.log('Categories query result:', { data, error })

      if (error) {
        console.error('Categories fetch error:', error)
        throw error
      }
      
      setCategories(data || [])
      console.log('Categories loaded successfully:', data?.length || 0, 'categories')
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      setError(error.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">Failed to load categories</div>
        <button
          onClick={fetchCategories}
          className="text-sm text-green-600 hover:text-green-700 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 min-w-[80px]">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse shadow-sm"></div>
            <div className="w-12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
      {/* All Categories */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`flex flex-col items-center space-y-2 min-w-[80px] transition-all duration-200 transform hover:scale-105 ${
          selectedCategory === null ? 'text-green-600' : 'text-gray-600 hover:text-green-500'
        }`}
      >
        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-200 ${
          selectedCategory === null 
            ? 'border-green-600 bg-gradient-to-br from-green-50 to-green-100 shadow-green-200' 
            : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-green-300 hover:shadow-lg'
        }`}>
          <span className="text-xl">🏪</span>
        </div>
        <span className="text-xs text-center font-medium">All</span>
      </button>

      {categories.map((category) => (
        <button
          key={category.category_id}
          onClick={() => onCategorySelect(category.category_id)}
          className={`flex flex-col items-center space-y-2 min-w-[80px] transition-all duration-200 transform hover:scale-105 ${
            selectedCategory === category.category_id ? 'text-green-600' : 'text-gray-600 hover:text-green-500'
          }`}
        >
          <div className={`w-16 h-16 rounded-full border-2 overflow-hidden shadow-md transition-all duration-200 ${
            selectedCategory === category.category_id 
              ? 'border-green-600 shadow-green-200' 
              : 'border-gray-200 hover:border-green-300 hover:shadow-lg'
          }`}>
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.innerHTML = '<span class="text-2xl flex items-center justify-center h-full">📦</span>'
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            )}
          </div>
          <span className="text-xs text-center font-medium line-clamp-2">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  )
}

export default CategoryNavigation

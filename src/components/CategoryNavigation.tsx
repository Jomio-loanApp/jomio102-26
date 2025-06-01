
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

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching categories...')
      
      // Fixed query - removing non-existent columns is_active and sort_order
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
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 min-w-[80px]">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
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
        className={`flex flex-col items-center space-y-2 min-w-[80px] transition-colors ${
          selectedCategory === null ? 'text-green-600' : 'text-gray-600'
        }`}
      >
        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
          selectedCategory === null 
            ? 'border-green-600 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <span className="text-lg">🏪</span>
        </div>
        <span className="text-xs text-center font-medium">All</span>
      </button>

      {categories.map((category) => (
        <button
          key={category.category_id}
          onClick={() => onCategorySelect(category.category_id)}
          className={`flex flex-col items-center space-y-2 min-w-[80px] transition-colors ${
            selectedCategory === category.category_id ? 'text-green-600' : 'text-gray-600'
          }`}
        >
          <div className={`w-16 h-16 rounded-full border-2 overflow-hidden ${
            selectedCategory === category.category_id 
              ? 'border-green-600' 
              : 'border-gray-200'
          }`}>
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
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

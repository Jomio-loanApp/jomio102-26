
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price_string: string
  unit_type: string
  image_url: string | null
  tags?: Array<{ name: string }>
}

interface ProductListingProps {
  categoryId?: string | null
  searchQuery?: string
}

const PRODUCTS_PER_PAGE = 12

const ProductListing = ({ categoryId, searchQuery }: ProductListingProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setCurrentPage(1)
    fetchProducts(1)
  }, [categoryId, searchQuery])

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage])

  const fetchProducts = async (page: number) => {
    try {
      setIsLoading(true)
      console.log('Fetching products with categoryId:', categoryId, 'searchQuery:', searchQuery)
      
      // First, let's try a simple query to see the table structure
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .neq('availability_status', 'Out of Stock')

      // Apply category filter
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Apply pagination
      const from = (page - 1) * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      console.log('Products query result:', { data, error, count })

      if (error) {
        console.error('Products fetch error:', error)
        throw error
      }

      // For now, just use the basic product data without tags
      const transformedProducts = data?.map(product => ({
        ...product,
        tags: [] // We'll handle tags separately once the basic query works
      })) || []

      setProducts(transformedProducts)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-600">
          {searchQuery 
            ? `No products match "${searchQuery}". Try a different search term.`
            : 'No products available in this category.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1} - {Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount)} of {totalCount} products
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-6">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProductListing

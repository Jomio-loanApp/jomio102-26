
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  product_id: string
  name: string
  description: string | null
  price_string: string
  unit_type: string
  image_url: string | null
  category_id: string | null
  availability_status: string
  is_active: boolean
}

interface ProductListingProps {
  categoryId?: string | null
  searchQuery?: string
}

const PRODUCTS_PER_PAGE = 12

const ProductListing = ({ categoryId, searchQuery }: ProductListingProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
      console.log('Fetching products with categoryId:', categoryId, 'searchQuery:', searchQuery)
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .neq('availability_status', 'Out of Stock')

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const from = (page - 1) * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      console.log('Products query result:', { data, error, count })

      if (error) {
        console.error('Products fetch error:', error)
        throw error
      }

      setProducts(data || [])
      setTotalCount(count || 0)
    } catch (error: any) {
      console.error('Error fetching products:', error)
      setError(error.message || 'Failed to load products')
      setProducts([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchProducts(currentPage)} variant="outline">
              Try again
            </Button>
          </div>
        </div>
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
          Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1} - {Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount)} of {totalCount} products
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.product_id} 
            product={{
              id: product.product_id,
              name: product.name,
              description: product.description,
              price_string: product.price_string,
              unit_type: product.unit_type,
              image_url: product.image_url
            }} 
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-6">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="hover:bg-green-50 hover:border-green-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="hover:bg-green-50 hover:border-green-300"
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

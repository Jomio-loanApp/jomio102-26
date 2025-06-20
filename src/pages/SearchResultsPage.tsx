import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, AlertCircle } from 'lucide-react'

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

interface ContentSection {
  content_section_id: string
  title: string
  section_type: string
  display_order: number
  section_items: any[]
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') || ''
  
  const [combinedResults, setCombinedResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const { isSupabaseReady, isRecoveringSession } = useAppStore()

  useEffect(() => {
    // DO NOT FETCH if Supabase is not ready or if there's no search term
    if (!isSupabaseReady || !searchTerm || isRecoveringSession) {
      if (!searchTerm) {
        setIsLoading(false)
        setCombinedResults([])
      }
      return
    }
    
    fetchSearchResults()
  }, [searchTerm, isSupabaseReady, isRecoveringSession])

  const fetchSearchResults = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching search results for:', searchTerm)
      
      // Parallel fetches for better performance
      const [productResponse, contentResponse] = await Promise.all([
        // Fetch 1: Product search results
        supabase.rpc('search_products', { search_term: searchTerm }),
        
        // Fetch 2: Interspersed dynamic content
        supabase
          .from('home_content_sections')
          .select('*, section_items(*, products(*))')
          .eq('display_context', 'search_results_interspersed_content')
          .order('display_order', { ascending: true })
      ])

      if (productResponse.error) {
        throw productResponse.error
      }

      if (contentResponse.error) {
        console.warn('Failed to fetch dynamic content:', contentResponse.error)
      }

      const products = productResponse.data || []
      const dynamicContent = contentResponse.data || []
      
      console.log('Search results fetched:', { products: products.length, dynamicContent: dynamicContent.length })
      
      // Merge results: insert dynamic content at intervals
      let results = [...products]
      
      // Insert dynamic content after every 6th product
      dynamicContent.forEach((contentBlock, index) => {
        const insertPosition = (index + 1) * 6 + index
        if (insertPosition < results.length) {
          results.splice(insertPosition, 0, { 
            ...contentBlock, 
            _type: 'content_section' 
          })
        } else {
          results.push({ 
            ...contentBlock, 
            _type: 'content_section' 
          })
        }
      })
      
      setCombinedResults(results)
      
    } catch (error: any) {
      console.error('Search failed:', error)
      setError(error.message || 'Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product)
    // You can implement a quick view modal here if needed
    console.log('Quick view for product:', product.name)
  }

  const renderSearchResults = () => {
    if (isLoading || isRecoveringSession) {
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
              <Skeleton className="aspect-square mb-2" />
              <Skeleton className="h-4 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSearchResults}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      )
    }

    if (!searchTerm) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Search for Products</h2>
          <p className="text-gray-600">Enter a search term to find products</p>
        </div>
      )
    }

    if (combinedResults.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h2>
          <p className="text-gray-600">Try searching with different keywords</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {combinedResults.map((item, index) => {
          // Check if this is a content section or a product
          if (item._type === 'content_section') {
            return (
              <div key={`content-${item.content_section_id}-${index}`} className="col-span-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <div className="text-sm text-gray-600">Dynamic content section</div>
                </div>
              </div>
            )
          }
          
          // Render as product
          return (
            <ProductCard
              key={`product-${item.product_id}-${index}`}
              product={item}
              onQuickView={handleQuickView}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {searchTerm && (
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Search results for "{searchTerm}"
            </h1>
            {!isLoading && !isRecoveringSession && combinedResults.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Found {combinedResults.filter(item => !item._type).length} products
              </p>
            )}
          </div>
        )}
        
        {renderSearchResults()}
      </div>
    </div>
  )
}

export default SearchResultsPage

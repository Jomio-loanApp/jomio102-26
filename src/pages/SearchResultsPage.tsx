
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import DynamicContentSection from '@/components/DynamicContentSection'
import ProductQuickView from '@/components/ProductQuickView'
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

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') || ''
  
  const [displayItems, setDisplayItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const { isSupabaseReady, isRecoveringSession } = useAppStore()

  useEffect(() => {
    // DO NOT FETCH if Supabase is not ready or if there's no search term
    if (!isSupabaseReady || !searchTerm || isRecoveringSession) {
      if (!searchTerm) {
        setIsLoading(false)
        setDisplayItems([])
      }
      return
    }
    
    fetchSearchResults()
  }, [searchTerm, isSupabaseReady, isRecoveringSession])

  // COMPLETE REBUILD: Search Results with Parallel Fetching and Data Merging
  const fetchSearchResults = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching search results for:', searchTerm)
      
      // PARALLEL FETCHES using Promise.all for better performance
      const [productResponse, dynamicContentResponse] = await Promise.all([
        // Fetch 1: Product search results using RPC function
        supabase.rpc('search_products', { search_term: searchTerm }),
        
        // Fetch 2: Interspersed dynamic content for search results
        supabase
          .from('home_content_sections')
          .select(`
            *,
            section_items (
              *,
              products (*)
            )
          `)
          .eq('display_context', 'search_results_interspersed_content')
          .order('display_order', { ascending: true })
      ])

      // Handle product response
      if (productResponse.error) {
        console.error('Product search error:', productResponse.error)
        throw new Error(`Product search failed: ${productResponse.error.message}`)
      }

      // Handle dynamic content response (warn but don't fail if this errors)
      if (dynamicContentResponse.error) {
        console.warn('Failed to fetch dynamic content:', dynamicContentResponse.error)
      }

      const products = productResponse.data || []
      const dynamicContent = dynamicContentResponse.data || []
      
      console.log('Search results fetched successfully:', { 
        products: products.length, 
        dynamicContent: dynamicContent.length 
      })
      
      // MERGE LOGIC: Insert dynamic content blocks at intervals
      let combinedList = [...products]
      
      // Insert dynamic blocks into the product list at intervals
      dynamicContent.forEach((block, index) => {
        const insertAt = ((index + 1) * 6) + index // Insert after every 6 products
        if (insertAt < combinedList.length) {
          combinedList.splice(insertAt, 0, { type: 'dynamic_section', data: block })
        } else {
          // If there are not enough products, append to the end
          combinedList.push({ type: 'dynamic_section', data: block })
        }
      })
      
      setDisplayItems(combinedList)
      console.log('Combined results set successfully. Total items:', combinedList.length)
      
    } catch (error: any) {
      console.error('Search failed:', error)
      setError(error.message || 'Search failed. Please try again.')
      setDisplayItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product)
    console.log('Quick view for product:', product.name)
  }

  const handleCloseQuickView = () => {
    setSelectedProduct(null)
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

    if (displayItems.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h2>
          <p className="text-gray-600">Try searching with different keywords</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* RENDER COMBINED RESULTS with proper type checking */}
        {displayItems.map((item, index) => {
          // Check if this is a content section or a product
          if (item.type === 'dynamic_section') {
            return (
              <DynamicContentSection
                key={`content-${item.data.id}-${index}`}
                sectionData={item.data}
                onQuickView={handleQuickView}
              />
            )
          }
          
          // Regular product - render in a grid container if it's the first in a group
          const isFirstInGroup = index === 0 || displayItems[index - 1]?.type === 'dynamic_section'
          
          if (isFirstInGroup) {
            // Find all consecutive products starting from this index
            const productGroup = []
            let currentIndex = index
            while (currentIndex < displayItems.length && !displayItems[currentIndex]?.type) {
              productGroup.push(displayItems[currentIndex])
              currentIndex++
            }
            
            return (
              <div key={`product-group-${index}`} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {productGroup.map((product, prodIndex) => (
                  <ProductCard
                    key={`product-${product.product_id}-${index + prodIndex}`}
                    product={{
                      ...product,
                      id: product.product_id // Add id for compatibility with ProductCard
                    }}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>
            )
          }
          
          // Skip individual products that are part of a group
          return null
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={true} />
      
      {/* FIXED: Reduced horizontal padding to match tighter layout */}
      <div className="max-w-7xl mx-auto px-2 py-6 pb-20 md:pb-6">
        {searchTerm && (
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Search results for "{searchTerm}"
            </h1>
            {!isLoading && !isRecoveringSession && displayItems.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Found {displayItems.filter(item => !item.type).length} products
              </p>
            )}
          </div>
        )}
        
        {renderSearchResults()}
      </div>

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  )
}

export default SearchResultsPage

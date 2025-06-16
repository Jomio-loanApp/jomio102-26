
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import ProductQuickView from '@/components/ProductQuickView'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  product_id: string
  name: string
  description: string | null
  price_string: string
  numeric_price: number
  unit_type: string
  image_url: string | null
  category_id: string | null
  availability_status: string
  is_active: boolean
}

interface DynamicContentSection {
  id: string
  section_type: string
  title: string
  subtitle: string | null
  background_color_hex: string | null
  background_image_url: string | null
  section_items: Array<{
    id: string
    item_type: string
    title: string
    subtitle: string | null
    image_url: string | null
    link_url: string | null
    button_text: string | null
  }>
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') || ''
  
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [dynamicSections, setDynamicSections] = useState<DynamicContentSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (searchTerm) {
      fetchSearchResults()
      fetchDynamicSections()
    } else {
      setSearchResults([])
      setDynamicSections([])
    }
  }, [searchTerm])

  const fetchSearchResults = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Searching for:', searchTerm)
      
      const { data, error } = await supabase.rpc('search_products', { 
        search_term: searchTerm 
      })

      if (error) {
        console.error('Search error:', error)
        throw error
      }

      const productsWithId = (data || []).map(product => ({
        ...product,
        id: product.product_id
      }))

      setSearchResults(productsWithId)
      console.log('Search results:', productsWithId)
    } catch (error: any) {
      console.error('Error fetching search results:', error)
      setError('Could not fetch search results.')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDynamicSections = async () => {
    try {
      const { data, error } = await supabase
        .from('home_content_sections')
        .select(`
          id,
          section_type,
          title,
          subtitle,
          background_color_hex,
          background_image_url,
          section_items:home_content_section_items(
            id,
            item_type,
            title,
            subtitle,
            image_url,
            link_url,
            button_text
          )
        `)
        .eq('display_context', 'search_results_interspersed_content')
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      
      // Only include sections that have items
      const sectionsWithItems = (data || []).filter(section => 
        section.section_items && section.section_items.length > 0
      )
      
      setDynamicSections(sectionsWithItems)
    } catch (error) {
      console.error('Error fetching dynamic sections:', error)
    }
  }

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product)
  }

  const renderDynamicSection = (section: DynamicContentSection) => {
    return (
      <div key={section.id} className="col-span-full my-8">
        <div 
          className="rounded-xl p-6 text-center"
          style={{
            backgroundColor: section.background_color_hex || '#f8f9fa',
            backgroundImage: section.background_image_url ? `url(${section.background_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h3 className="text-xl font-bold mb-2">{section.title}</h3>
          {section.subtitle && (
            <p className="text-gray-600 mb-4">{section.subtitle}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.section_items.map((item) => (
              <div key={item.id} className="bg-white bg-opacity-90 rounded-lg p-4">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-semibold">{item.title}</h4>
                {item.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{item.subtitle}</p>
                )}
                {item.link_url && item.button_text && (
                  <a 
                    href={item.link_url}
                    className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {item.button_text}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
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
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      )
    }

    if (searchResults.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600">
            No products match "{searchTerm}". Try checking your spelling or using a different term.
          </p>
        </div>
      )
    }

    const content = []
    let productIndex = 0

    while (productIndex < searchResults.length) {
      // Add 9 products
      const productsToAdd = searchResults.slice(productIndex, productIndex + 9)
      content.push(
        <div key={`products-${productIndex}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsToAdd.map((product) => (
            <ProductCard 
              key={product.product_id} 
              product={product}
              onQuickView={handleQuickView}
            />
          ))}
        </div>
      )
      productIndex += 9

      // Add dynamic section if available and we have more products
      if (dynamicSections.length > 0 && productIndex < searchResults.length) {
        const sectionIndex = Math.floor(productIndex / 9) - 1
        if (sectionIndex < dynamicSections.length) {
          content.push(renderDynamicSection(dynamicSections[sectionIndex]))
        }
      }
    }

    return content
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results
            </h1>
          </div>
          
          {searchTerm && (
            <p className="text-gray-600">
              {isLoading 
                ? `Searching for "${searchTerm}"...`
                : `${searchResults.length} results for "${searchTerm}"`
              }
            </p>
          )}
        </div>

        <div className="space-y-8">
          {renderContent()}
        </div>
      </div>

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

export default SearchResultsPage

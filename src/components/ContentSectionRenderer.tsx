
import { useState, useEffect } from 'react'
import { useHomeStore } from '@/stores/homeStore'
import ProductCard from '@/components/ProductCard'
import ProductListing from '@/components/ProductListing'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

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

interface ContentSectionRendererProps {
  onQuickView: (product: Product) => void
}

const ContentSectionRenderer = ({ onQuickView }: ContentSectionRendererProps) => {
  const { homeContentSections, sectionItems, selectedCategory } = useHomeStore()
  const [sectionProducts, setSectionProducts] = useState<{ [sectionId: string]: Product[] }>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchAllSectionProducts()
  }, [homeContentSections, sectionItems])

  const fetchAllSectionProducts = async () => {
    setIsLoading(true)
    const newSectionProducts: { [sectionId: string]: Product[] } = {}

    for (const section of homeContentSections) {
      const items = sectionItems[section.id] || []
      
      if (section.section_type === 'random_category_grid_3xN' && section.context_category_id) {
        // Always show 3x3 (9 products) for random category grids
        const productCount = 9

        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', section.context_category_id)
            .eq('is_active', true)
            .neq('availability_status', 'Out of Stock')
            .limit(productCount * 2) // Fetch more to randomize

          if (error) throw error
          
          // Randomly select products
          const shuffled = (data || []).sort(() => 0.5 - Math.random())
          newSectionProducts[section.id] = shuffled.slice(0, productCount)
        } catch (error) {
          console.error('Error fetching random products:', error)
        }
      } else {
        // Fetch products based on section items
        const productIds = items
          .filter(item => item.item_type === 'product' && item.product_id)
          .map(item => item.product_id!)

        if (productIds.length > 0) {
          try {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .in('product_id', productIds)
              .eq('is_active', true)

            if (error) throw error
            
            // Maintain order from section items
            const orderedProducts = productIds
              .map(id => data?.find(p => p.product_id === id))
              .filter(Boolean) as Product[]
              
            newSectionProducts[section.id] = orderedProducts
          } catch (error) {
            console.error('Error fetching section products:', error)
          }
        }
      }
    }

    setSectionProducts(newSectionProducts)
    setIsLoading(false)
  }

  const renderAdvertisementSlider = (section: any) => {
    const items = sectionItems[section.id] || []
    const adItems = items.filter(item => item.item_type === 'advertisement_image')

    if (!adItems.length) return null

    return (
      <div className="mb-8">
        {section.title_text && (
          <h2 className="text-xl font-bold text-gray-900 mb-4 px-4">{section.title_text}</h2>
        )}
        <div className="px-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {adItems.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => {
                    if (item.advertisement_link_url) {
                      window.open(item.advertisement_link_url, '_blank')
                    }
                  }}
                >
                  <img
                    src={item.advertisement_image_url}
                    alt="Advertisement"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderProductGrid = (section: any, products: Product[]) => {
    if (!products.length) return null

    return (
      <div className="mb-8">
        {section.title_text && (
          <h2 className="text-xl font-bold text-gray-900 mb-4 px-4">{section.title_text}</h2>
        )}
        <div className="px-4">
          <div className="grid grid-cols-3 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onQuickView={onQuickView}
                compact={true}
              />
            ))}
          </div>
          {section.see_more_link_url && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50"
                onClick={() => window.open(section.see_more_link_url, '_blank')}
              >
                See More <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderProductScroller = (section: any, products: Product[]) => {
    if (!products.length) return null

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-xl font-bold text-gray-900">{section.title_text}</h2>
          {section.see_more_link_url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700"
              onClick={() => window.open(section.see_more_link_url, '_blank')}
            >
              See more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 min-w-max">
            {products.map((product) => (
              <div key={product.product_id} className="flex-shrink-0 w-32">
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {homeContentSections.map((section) => {
        const products = sectionProducts[section.id] || []

        switch (section.section_type) {
          case 'advertisement_slider':
            return <div key={section.id}>{renderAdvertisementSlider(section)}</div>
          
          case 'curated_products_heading':
          case 'random_category_grid_3xN':
            return <div key={section.id}>{renderProductGrid(section, products)}</div>
          
          case 'horizontal_products_scroller':
            return <div key={section.id}>{renderProductScroller(section, products)}</div>
          
          default:
            return null
        }
      })}
      
      {/* Show category products when a specific category is selected */}
      {selectedCategory && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 px-4">All Products</h2>
          <div className="px-4">
            <ProductListing categoryId={selectedCategory} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentSectionRenderer


import { useHomeStore } from '@/stores/homeStore'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  const { 
    homeContentSections, 
    selectedCategory, 
    categoryProducts, 
    categoryProductsHasMore, 
    isLoadingCategoryProducts,
    loadMoreCategoryProducts,
    isLoading 
  } = useHomeStore()

  const renderAdvertisementSlider = (section: any) => {
    const adItems = section.section_items?.filter((item: any) => item.item_type === 'advertisement_image') || []

    if (!adItems.length) return null

    return (
      <div className="mb-8">
        {section.title_text && (
          <h2 className="text-xl font-bold text-gray-900 mb-4 px-4">{section.title_text}</h2>
        )}
        <div className="px-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {adItems.map((item: any) => (
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

  const renderProductGrid = (section: any) => {
    const productItems = section.section_items?.filter((item: any) => item.item_type === 'product' && item.products) || []
    const products = productItems.map((item: any) => item.products)

    if (!products.length) return null

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-xl font-bold text-gray-900">{section.title_text}</h2>
          {section.see_more_link_url && (
            <Link to={section.see_more_link_url}>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700"
              >
                See more <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
        <div className="px-4">
          <div className="grid grid-cols-3 gap-3">
            {products.map((product: Product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderProductScroller = (section: any) => {
    const productItems = section.section_items?.filter((item: any) => item.item_type === 'product' && item.products) || []
    const products = productItems.map((item: any) => item.products)

    if (!products.length) return null

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-xl font-bold text-gray-900">{section.title_text}</h2>
          {section.see_more_link_url && (
            <Link to={section.see_more_link_url}>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700"
              >
                See more <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 min-w-max">
            {products.map((product: Product) => (
              <div key={product.product_id} className="flex-shrink-0 w-40">
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderCategoryProducts = () => {
    if (!selectedCategory || !categoryProducts.length) return null

    return (
      <div className="mb-8">
        <div className="px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Products</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {categoryProducts.map((product: Product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onQuickView={onQuickView}
              />
            ))}
          </div>
          
          {categoryProductsHasMore && (
            <div className="text-center">
              <Button
                onClick={loadMoreCategoryProducts}
                disabled={isLoadingCategoryProducts}
                variant="outline"
                className="bg-white hover:bg-gray-50"
              >
                {isLoadingCategoryProducts ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
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
      {/* Render dynamic content sections */}
      {homeContentSections.map((section) => {
        switch (section.section_type) {
          case 'advertisement_slider':
            return <div key={section.id}>{renderAdvertisementSlider(section)}</div>
          
          case 'curated_products_heading':
          case 'random_category_grid_3xN':
            return <div key={section.id}>{renderProductGrid(section)}</div>
          
          case 'horizontal_products_scroller':
            return <div key={section.id}>{renderProductScroller(section)}</div>
          
          default:
            return null
        }
      })}

      {/* Render category products if on category page */}
      {renderCategoryProducts()}
    </div>
  )
}

export default ContentSectionRenderer

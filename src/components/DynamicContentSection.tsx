
import React from 'react'
import ProductCard from './ProductCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface SectionItem {
  section_item_id: string
  section_id: string
  item_type: string
  product_id?: string
  display_order: number
  products?: Product
}

interface DynamicContentSectionProps {
  sectionData: {
    content_section_id: string
    title: string
    section_type: string
    display_order: number
    section_items: SectionItem[]
  }
  onQuickView: (product: Product) => void
}

const DynamicContentSection: React.FC<DynamicContentSectionProps> = ({ 
  sectionData, 
  onQuickView 
}) => {
  const { title, section_type, section_items } = sectionData

  // Filter and sort section items
  const sortedItems = section_items
    ?.filter(item => item.products && item.products.is_active)
    ?.sort((a, b) => a.display_order - b.display_order) || []

  if (sortedItems.length === 0) {
    return null
  }

  const renderContent = () => {
    switch (section_type) {
      case 'advertisement_slider':
        return (
          <Card className="my-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-bold text-blue-800">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedItems.map((item) => (
                  item.products && (
                    <ProductCard
                      key={item.section_item_id}
                      product={item.products}
                      onQuickView={onQuickView}
                    />
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'horizontal_products_scroller':
        return (
          <Card className="my-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-green-800">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
                  {sortedItems.map((item) => (
                    item.products && (
                      <div key={item.section_item_id} className="flex-shrink-0 w-40">
                        <ProductCard
                          product={item.products}
                          onQuickView={onQuickView}
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'featured_products_grid':
        return (
          <Card className="my-6 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-bold text-yellow-800">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sortedItems.map((item) => (
                  item.products && (
                    <ProductCard
                      key={item.section_item_id}
                      product={item.products}
                      onQuickView={onQuickView}
                    />
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="my-6 border-2 border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedItems.map((item) => (
                  item.products && (
                    <ProductCard
                      key={item.section_item_id}
                      product={item.products}
                      onQuickView={onQuickView}
                    />
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return renderContent()
}

export default DynamicContentSection

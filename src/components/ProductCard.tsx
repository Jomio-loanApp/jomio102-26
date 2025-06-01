
import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import ProductQuickView from './ProductQuickView'

interface Product {
  id: string
  name: string
  description: string | null
  price_string: string
  unit_type: string
  image_url: string | null
  tags?: Array<{ name: string }>
}

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem, items, updateQuantity } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const [showQuickView, setShowQuickView] = useState(false)

  const isInCart = items.find(item => item.product_id === product.id)
  const cartQuantity = isInCart?.quantity || 0
  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      product_id: product.id,
      name: product.name,
      price_string: product.price_string,
      image_url: product.image_url,
    })
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleUpdateQuantity = (e: React.MouseEvent, quantity: number) => {
    e.stopPropagation()
    updateQuantity(product.id, quantity)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (inWishlist) {
      removeFromWishlist(product.id)
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      })
    } else {
      addToWishlist({
        product_id: product.id,
        name: product.name,
        price_string: product.price_string,
        image_url: product.image_url,
      })
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      })
    }
  }

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setShowQuickView(true)}
      >
        <div className="relative">
          <div className="aspect-square">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
            )}
          </div>
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
              inWishlist 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-green-600">
                {product.price_string}
              </p>
              <p className="text-xs text-gray-500">
                per {product.unit_type}
              </p>
            </div>

            {/* Add to Cart / Quantity Controls */}
            <div onClick={(e) => e.stopPropagation()}>
              {cartQuantity === 0 ? (
                <Button
                  onClick={handleAddToCart}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={(e) => handleUpdateQuantity(e, cartQuantity - 1)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium min-w-[20px] text-center">
                    {cartQuantity}
                  </span>
                  <Button
                    onClick={(e) => handleUpdateQuantity(e, cartQuantity + 1)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  )
}

export default ProductCard

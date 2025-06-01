
import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  description: string | null
  price_string: string
  unit_type: string
  image_url: string | null
  tags?: Array<{ name: string }>
}

interface ProductQuickViewProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

const ProductQuickView = ({ product, isOpen, onClose }: ProductQuickViewProps) => {
  const { addItem, items, updateQuantity } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const [quantity, setQuantity] = useState(1)

  const isInCart = items.find(item => item.product_id === product.id)
  const cartQuantity = isInCart?.quantity || 0
  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      price_string: product.price_string,
      image_url: product.image_url,
    }, quantity)
    
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    })
    
    onClose()
  }

  const handleWishlistToggle = () => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {product.price_string}
                </p>
                <p className="text-sm text-gray-500">
                  per {product.unit_type}
                </p>
              </div>

              {/* Wishlist Button */}
              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                size="sm"
                className={inWishlist ? 'text-red-500 border-red-500' : ''}
              >
                <Heart className={`w-4 h-4 mr-2 ${inWishlist ? 'fill-current' : ''}`} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium min-w-[30px] text-center">
                  {quantity}
                </span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add {quantity} to Cart
              {cartQuantity > 0 && (
                <span className="ml-2 text-sm opacity-75">
                  ({cartQuantity} in cart)
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductQuickView

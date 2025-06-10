
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { toast } from '@/hooks/use-toast'

interface Product {
  product_id: string
  name: string
  price_string: string
  numeric_price: number
  unit_type: string
  image_url?: string
  category_id?: string
  is_active: boolean
  availability_status: string
}

interface ProductCardProps {
  product: Product
  onQuickView: (product: Product) => void
  compact?: boolean
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, compact = false }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addItem: addToCart } = useCartStore()
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  
  const isWishlisted = isInWishlist(product.product_id)

  const handleWishlistToggle = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.product_id)
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        })
      } else {
        const wishlistItem = {
          product_id: product.product_id,
          name: product.name,
          price_string: product.price_string,
          image_url: product.image_url
        }
        await addToWishlist(wishlistItem)
        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddToCart = () => {
    const cartItem = {
      product_id: product.product_id,
      name: product.name,
      price_string: product.price_string,
      image_url: product.image_url
    }
    
    addToCart(cartItem, 1)
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      duration: 2000,
    })
  }

  const getAvailabilityColor = () => {
    switch (product.availability_status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800'
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'Out of Stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 border border-gray-200 h-full">
      <CardContent className="p-2 md:p-3 h-full flex flex-col">
        {/* Product Image */}
        <div 
          className="relative aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden cursor-pointer flex-shrink-0"
          onClick={() => onQuickView(product)}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl md:text-2xl">📦</span>
            </div>
          )}
          
          {/* Wishlist Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-1 right-1 p-1 md:p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 h-auto"
            onClick={(e) => {
              e.stopPropagation()
              handleWishlistToggle()
            }}
          >
            <Heart 
              className={`w-3 h-3 md:w-4 md:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>

          {/* Availability Badge */}
          <div className="absolute top-1 left-1">
            <Badge className={`text-xs px-1 py-0.5 ${getAvailabilityColor()}`}>
              {product.availability_status === 'In Stock' ? '●' : product.availability_status === 'Low Stock' ? '◐' : '○'}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1 flex-grow flex flex-col">
          <h3 
            className="font-medium text-gray-900 text-xs md:text-sm leading-tight line-clamp-2 cursor-pointer hover:text-green-600 transition-colors flex-grow"
            onClick={() => onQuickView(product)}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs md:text-sm font-bold text-green-600">
                {product.price_string}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                /{product.unit_type}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.availability_status === 'Out of Stock'}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 md:py-1.5 h-auto mt-auto"
            size="sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            ADD
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductCard

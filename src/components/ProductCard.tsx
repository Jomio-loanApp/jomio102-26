
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Plus, Eye } from 'lucide-react'
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
  description?: string
  price_string: string
  numeric_price: number
  unit_type: string
  image_url?: string
  category_id?: string
  is_active: boolean
  availability_status: string
}

interface Tag {
  tag_id: string
  name: string
}

interface ProductCardProps {
  product: Product
  tags?: Tag[]
  onQuickView: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, tags = [], onQuickView }) => {
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
    // Add item directly to cart
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
    <Card className="group hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <CardContent className="p-4">
        {/* Product Image */}
        <div 
          className="relative aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden cursor-pointer"
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
              <span className="text-4xl">📦</span>
            </div>
          )}
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation()
                onQuickView(product)
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Quick View
            </Button>
          </div>

          {/* Wishlist Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              handleWishlistToggle()
            }}
          >
            <Heart 
              className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>

          {/* Availability Badge */}
          <div className="absolute top-2 left-2">
            <Badge className={`text-xs ${getAvailabilityColor()}`}>
              {product.availability_status}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 
            className="font-semibold text-gray-900 text-sm line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
            onClick={() => onQuickView(product)}
          >
            {product.name}
          </h3>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag.tag_id} variant="outline" className="text-xs px-2 py-0">
                  {tag.name}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-green-600">
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
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductCard

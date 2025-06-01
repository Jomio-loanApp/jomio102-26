
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useCartStore } from '@/stores/cartStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface WishlistItem {
  id: string
  product_id: string
  product: {
    id: string
    name: string
    price_string: string
    image_url: string | null
  }
}

const WishlistPage = () => {
  const { user } = useAuthStore()
  const { items: localWishlist, removeItem: removeFromLocalWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const [dbWishlist, setDbWishlist] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchWishlistFromDB()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchWishlistFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          id,
          product_id,
          products!inner(
            id,
            name,
            price_string,
            image_url
          )
        `)
        .eq('profile_id', user!.id)

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product: Array.isArray(item.products) ? item.products[0] : item.products
      })) || []
      
      setDbWishlist(transformedData)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string, productName: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('wishlist_items')
          .delete()
          .eq('profile_id', user.id)
          .eq('product_id', productId)

        if (error) throw error
        
        setDbWishlist(prev => prev.filter(item => item.product_id !== productId))
        toast({
          title: "Removed from wishlist",
          description: `${productName} has been removed from your wishlist.`,
        })
      } catch (error) {
        console.error('Error removing from wishlist:', error)
        toast({
          title: "Error",
          description: "Failed to remove item from wishlist.",
          variant: "destructive",
        })
      }
    } else {
      removeFromLocalWishlist(productId)
      toast({
        title: "Removed from wishlist",
        description: `${productName} has been removed from your wishlist.`,
      })
    }
  }

  const moveToCart = (item: any) => {
    const productData = user ? item.product : item
    
    addToCart({
      product_id: productData.id,
      name: productData.name,
      price_string: productData.price_string,
      image_url: productData.image_url,
    })
    
    removeFromWishlist(productData.id, productData.name)
    
    toast({
      title: "Moved to cart",
      description: `${productData.name} has been added to your cart.`,
    })
  }

  const wishlistItems = user ? dbWishlist : localWishlist

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          <div className="text-center py-12">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Save your favorite items here for easy access later!
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Your Wishlist</h1>
            <span className="text-sm text-gray-500">({wishlistItems.length} items)</span>
          </div>

          {/* Wishlist Items */}
          <div className="space-y-4">
            {wishlistItems.map((item) => {
              const productData = user ? item.product : item
              
              return (
                <div key={user ? item.id : item.product_id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {productData.image_url ? (
                        <img
                          src={productData.image_url}
                          alt={productData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {productData.name}
                      </h3>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {productData.price_string}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => moveToCart(item)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Move to Cart
                      </Button>

                      <Button
                        onClick={() => removeFromWishlist(productData.id, productData.name)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WishlistPage

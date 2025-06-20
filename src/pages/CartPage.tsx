
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const CartPage = () => {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore()
  const { user } = useAuthStore()
  const [minimumOrderValue, setMinimumOrderValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchShopSettings()
  }, [])

  const fetchShopSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('minimum_order_value')
        .single()

      if (error) throw error
      setMinimumOrderValue(data?.minimum_order_value || 0)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subtotal = getSubtotal()
  const canProceedToCheckout = subtotal >= minimumOrderValue

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId)
    toast({
      title: "Item removed",
      description: `${productName} has been removed from your cart.`,
    })
  }

  const handleProceedToCheckout = () => {
    if (!canProceedToCheckout) {
      toast({
        title: "Minimum order not met",
        description: `Please add items worth ₹${(minimumOrderValue - subtotal).toFixed(2)} more to proceed.`,
        variant: "destructive",
      })
      return
    }
    
    // Check if user is logged in - if not, force login
    if (!user) {
      setShowLoginModal(true)
      return
    }
    
    // Navigate to address selection for authenticated users
    navigate('/select-address')
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    // After successful login, proceed to address selection
    navigate('/select-address')
  }

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          <div className="text-center py-12">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some delicious items to get started!
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              Start Shopping
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
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>

          {/* Cart Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product_id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details - Improved Layout */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-lg font-bold text-green-600">
                        {item.price_string}
                      </p>
                    </div>
                    
                    {/* Quantity Controls and Remove Button */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-base font-medium min-w-[30px] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Button
                        onClick={() => handleRemoveItem(item.product_id, item.name)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span className="text-green-600">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Delivery charges will be calculated based on your location and delivery option.
              </p>
            </div>

            {/* Minimum Order Warning */}
            {!canProceedToCheckout && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Minimum order value is ₹{minimumOrderValue.toFixed(2)}.</strong>
                  <br />
                  Please add items worth ₹{(minimumOrderValue - subtotal).toFixed(2)} more to proceed.
                </p>
              </div>
            )}

            <Button
              onClick={handleProceedToCheckout}
              disabled={!canProceedToCheckout}
              className="w-full mt-6"
              style={{ backgroundColor: '#23b14d' }}
              size="lg"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default CartPage

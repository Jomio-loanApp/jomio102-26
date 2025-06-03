
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cartStore'
import { ShoppingCart } from 'lucide-react'

const CartCheckoutButton = () => {
  const navigate = useNavigate()
  const { items, getSubtotal } = useCartStore()
  
  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      return
    }
    
    // Navigate to location selection first as per revised flow
    navigate('/set-delivery-location')
  }

  const subtotal = getSubtotal()
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
        </div>
        <div className="text-lg font-semibold text-gray-900">
          ₹{subtotal.toFixed(2)}
        </div>
      </div>
      
      <Button
        onClick={handleProceedToCheckout}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base"
        size="lg"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Proceed to Checkout
      </Button>
    </div>
  )
}

export default CartCheckoutButton

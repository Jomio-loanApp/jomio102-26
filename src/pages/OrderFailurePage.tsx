
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle } from 'lucide-react'

const OrderFailurePage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-red-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-600" strokeWidth={3} />
        </div>
        
        <h1 className="text-2xl font-bold text-red-700 text-center">
          Order Placement Failed
        </h1>
        
        <p className="text-lg text-gray-700 text-center">
          There was a problem processing your order. Please go back to the checkout page to review your details and try again. No charge has been made.
        </p>
        
        <Button
          className="w-full mt-4 bg-red-600 hover:bg-red-700"
          onClick={() => navigate('/checkout')}
          size="lg"
        >
          Back to Checkout
        </Button>
      </div>
    </div>
  )
}

export default OrderFailurePage

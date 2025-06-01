
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, Clock, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const OrderConfirmationPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [orderDetails] = useState({
    orderId: orderId,
    estimatedDelivery: '30-45 minutes',
    deliveryType: 'Instant Delivery',
    totalAmount: 850,
    customerPhone: '+91 98765 43210'
  })

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Order Placed Successfully!</CardTitle>
            <p className="text-gray-600 mt-2">
              Thank you for your order. We're preparing it for delivery.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Order Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">#{orderDetails.orderId}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-green-600">₹{orderDetails.totalAmount}</span>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">{orderDetails.deliveryType}</div>
                  <div className="text-sm text-blue-700">
                    Estimated delivery: {orderDetails.estimatedDelivery}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium">Need help?</div>
                  <div className="text-sm text-gray-600">
                    Call us at {orderDetails.customerPhone}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/profile/orders')}
                className="w-full"
                variant="outline"
              >
                <Package className="w-4 h-4 mr-2" />
                View Order History
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OrderConfirmationPage

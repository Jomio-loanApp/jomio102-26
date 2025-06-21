
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useLocationStore } from '@/stores/locationStore'
import { invokeFunction } from '@/services/api'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Loader2, MapPin, User, Phone, CreditCard, Truck } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DeliveryOption {
  type: string
  name: string
  description: string
  price: number
  estimated_time: string
}

interface ShopSettings {
  minimum_order_value: number
  shop_latitude: number
  shop_longitude: number
  shop_location_name: string
}

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { deliveryLocation } = useLocationStore()

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_on_delivery')
  const [customerNotes, setCustomerNotes] = useState('')

  // Data state
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(true)
  const [isLoadingShop, setIsLoadingShop] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations
  const subtotal = getTotalPrice()
  const selectedOption = deliveryOptions.find(option => option.type === selectedDeliveryType)
  const deliveryCharge = selectedOption?.price || 0
  const total = subtotal + deliveryCharge

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
      return
    }

    if (!deliveryLocation) {
      const redirectPath = user ? '/select-address' : '/set-delivery-location'
      navigate(redirectPath)
      return
    }

    // Pre-fill form if user is authenticated
    if (user && profile) {
      setCustomerName(profile.full_name || '')
      setCustomerPhone(profile.phone_number || '')
    }

    fetchDeliveryOptions()
    fetchShopSettings()
  }, [items, deliveryLocation, user, profile, navigate])

  const fetchDeliveryOptions = async () => {
    try {
      setIsLoadingDelivery(true)
      console.log('Fetching delivery options...')
      
      const response = await invokeFunction('get-available-delivery-options')

      if (response.error) {
        console.error('Error returned from invoke:', response.error)
        throw response.error
      }

      console.log('Successfully received data from server. Type:', typeof response.data, 'IsArray:', Array.isArray(response.data))
      console.log('Data content:', JSON.stringify(response.data, null, 2))

      if (!Array.isArray(response.data)) {
        console.error('Data format is not an array. Triggering fallback.')
        throw new Error('Received invalid data format from server.')
      }

      setDeliveryOptions(response.data)
      console.log('Delivery options state updated successfully.')

      // Auto-select first option if available
      if (response.data.length > 0) {
        setSelectedDeliveryType(response.data[0].type)
      }

    } catch (error) {
      console.error('Caught final error in delivery options fetch:', error.message)
      toast({
        title: "Error loading delivery options",
        description: "Using default delivery options",
        variant: "destructive",
      })
      // Fallback delivery options
      const fallbackOptions = [
        {
          type: 'instant',
          name: 'Instant Delivery',
          description: 'Get your order within 1-2 hours',
          price: 50,
          estimated_time: '1-2 hours'
        }
      ]
      setDeliveryOptions(fallbackOptions)
      setSelectedDeliveryType('instant')
    } finally {
      setIsLoadingDelivery(false)
    }
  }

  const fetchShopSettings = async () => {
    try {
      setIsLoadingShop(true)
      const { data, error } = await supabase
        .from('shop_settings')
        .select('minimum_order_value, shop_latitude, shop_longitude, shop_location_name')
        .single()

      if (error) throw error
      setShopSettings(data)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
    } finally {
      setIsLoadingShop(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and phone number",
        variant: "destructive",
      })
      return
    }

    if (!selectedDeliveryType) {
      toast({
        title: "Select Delivery Option",
        description: "Please choose a delivery option",
        variant: "destructive",
      })
      return
    }

    if (!deliveryLocation) {
      toast({
        title: "Missing Delivery Location",
        description: "Please set your delivery location",
        variant: "destructive",
      })
      return
    }

    if (shopSettings && subtotal < shopSettings.minimum_order_value) {
      toast({
        title: "Minimum Order Not Met",
        description: `Minimum order value is ₹${shopSettings.minimum_order_value}`,
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const orderData = {
        customer_profile_id: user?.id || null,
        guest_customer_name: !user ? customerName : null,
        guest_customer_phone: !user ? customerPhone : null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.numeric_price || 0
        })),
        items_subtotal: subtotal,
        delivery_charge: deliveryCharge,
        total_amount: total,
        delivery_latitude: deliveryLocation.latitude,
        delivery_longitude: deliveryLocation.longitude,
        delivery_location_name: deliveryLocation.address,
        delivery_type: selectedDeliveryType,
        customer_notes: customerNotes.trim() || null,
        payment_method: selectedPaymentMethod,
        shop_location_at_order_time_lat: shopSettings?.shop_latitude || null,
        shop_location_at_order_time_lon: shopSettings?.shop_longitude || null,
        shop_location_at_order_time_name: shopSettings?.shop_location_name || null
      }

      console.log('Placing order with data:', orderData)

      const response = await invokeFunction('place-order', orderData)

      if (response.error) {
        throw response.error
      }

      console.log('Order placed successfully:', response.data)

      // Clear cart and redirect to success page
      clearCart()
      navigate('/order-placed-successfully')

    } catch (error) {
      console.error('Error placing order:', error)
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingDelivery || isLoadingShop) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Customer Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Delivery Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {deliveryLocation?.address}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const redirectPath = user ? '/select-address' : '/set-delivery-location'
                  navigate(redirectPath)
                }}
                className="mt-2"
              >
                Change Address
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Delivery Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedDeliveryType} onValueChange={setSelectedDeliveryType}>
                {deliveryOptions.map((option) => (
                  <div key={option.type} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value={option.type} id={option.type} />
                    <div className="flex-1">
                      <label htmlFor={option.type} className="cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{option.name}</p>
                            <p className="text-sm text-gray-600">{option.description}</p>
                            <p className="text-xs text-gray-500">{option.estimated_time}</p>
                          </div>
                          <p className="font-semibold text-green-600">₹{option.price}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {item.price_string}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₹{((item.numeric_price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bill Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash_on_delivery" id="cod" />
                  <label htmlFor="cod" className="cursor-pointer">Cash on Delivery</label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any special instructions for delivery..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
              />
            </CardContent>
          </Card>

          {/* Place Order Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Place Order - ₹${total.toFixed(2)}`
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CheckoutPage


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useLocationStore } from '@/stores/locationStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, MapPin, Clock, CreditCard, ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DeliveryOption {
  type: string
  label: string
  charge: number
  estimated_time?: string
}

const CheckoutDetailsPage = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { items, getSubtotal, clearCart } = useCartStore()
  const { deliveryLat, deliveryLng, deliveryLocationName } = useLocationStore()

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  
  // Data states
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [minimumOrderValue, setMinimumOrderValue] = useState(0)
  
  // UI states
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect if no items or location
    if (items.length === 0) {
      navigate('/cart')
      return
    }
    
    if (!deliveryLat || !deliveryLng || !deliveryLocationName) {
      navigate('/select-delivery-location')
      return
    }
    
    // Initialize form with user data if available
    if (user && profile) {
      setCustomerName(profile.full_name || '')
      setCustomerPhone(profile.phone_number || '')
    }
    
    fetchInitialData()
  }, [items.length, deliveryLat, deliveryLng, user, profile, navigate])

  useEffect(() => {
    if (selectedDeliveryOption === 'instant' && deliveryLat && deliveryLng) {
      calculateDeliveryCharge()
    } else {
      setDeliveryCharge(0)
    }
  }, [selectedDeliveryOption, deliveryLat, deliveryLng])

  const fetchInitialData = async () => {
    await Promise.all([
      fetchShopSettings(),
      fetchDeliveryOptions()
    ])
  }

  const fetchShopSettings = async () => {
    try {
      console.log('Fetching shop settings...')
      const { data, error } = await supabase
        .from('shop_settings')
        .select('minimum_order_value')
        .single()

      if (error) throw error
      
      setMinimumOrderValue(data?.minimum_order_value || 0)
      console.log('Shop settings loaded:', data)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
      setMinimumOrderValue(0)
    }
  }

  const fetchDeliveryOptions = async () => {
    try {
      setIsLoadingOptions(true)
      setOptionsError(null)
      console.log('Fetching delivery options...')
      
      const { data, error } = await supabase.functions.invoke('get-available-delivery-options')
      
      if (error) throw error
      
      setDeliveryOptions(data || [])
      console.log('Delivery options loaded:', data)
    } catch (error) {
      console.error('Error fetching delivery options (likely CORS):', error)
      setOptionsError('Unable to load delivery options from server. Using defaults.')
      
      // Fallback options
      const fallbackOptions = [
        { type: 'instant', label: 'Instant Delivery (30-45 min)', charge: 0 },
        { type: 'morning', label: 'Morning Delivery (Tomorrow 7 AM - 9 AM)', charge: 0 },
        { type: 'evening', label: 'Evening Delivery (Tomorrow 6 PM - 8 PM)', charge: 0 },
      ]
      setDeliveryOptions(fallbackOptions)
    } finally {
      setIsLoadingOptions(false)
    }
  }

  const calculateDeliveryCharge = async () => {
    if (!deliveryLat || !deliveryLng) return

    try {
      console.log('Calculating delivery charge...')
      const { data, error } = await supabase.functions.invoke('calculate-delivery-charge', {
        body: { p_customer_lat: deliveryLat, p_customer_lon: deliveryLng }
      })
      
      if (error) throw error
      
      setDeliveryCharge(data?.delivery_charge || 0)
      console.log('Delivery charge calculated:', data)
    } catch (error) {
      console.error('Error calculating delivery charge (likely CORS):', error)
      const fallbackCharge = 25
      setDeliveryCharge(fallbackCharge)
      console.log('Using fallback delivery charge:', fallbackCharge)
    }
  }

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true)

    try {
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_latitude: deliveryLat,
        delivery_longitude: deliveryLng,
        delivery_location_name: deliveryLocationName,
        delivery_type: selectedDeliveryOption,
        customer_notes: customerNotes,
        payment_method: 'COD',
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: parseFloat(item.price_string.replace(/[^\d.]/g, '')),
          product_name_at_purchase: item.name,
          product_image_at_purchase: item.image_url,
        })),
        items_subtotal: getSubtotal(),
        delivery_charge: selectedDeliveryOption === 'instant' ? deliveryCharge : 0,
        total_amount: getSubtotal() + (selectedDeliveryOption === 'instant' ? deliveryCharge : 0),
      }

      console.log('Placing order with data:', orderData)

      let result
      if (user) {
        console.log('Creating authenticated order...')
        result = await supabase.functions.invoke('create-authenticated-order', {
          body: orderData
        })
      } else {
        console.log('Creating guest order...')
        result = await supabase.functions.invoke('create-guest-order', {
          body: orderData
        })
      }

      if (result.error) throw result.error

      console.log('Order created successfully:', result.data)
      clearCart()
      navigate(`/order-confirmation/${result.data.order_id}`)
      
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. You will receive updates soon.",
      })
    } catch (error) {
      console.error('Error placing order (likely CORS):', error)
      toast({
        title: "Order placement failed",
        description: "Unable to place order due to server connectivity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const subtotal = getSubtotal()
  const finalDeliveryCharge = selectedDeliveryOption === 'instant' ? deliveryCharge : 0
  const totalAmount = subtotal + finalDeliveryCharge
  const canProceed = subtotal >= minimumOrderValue

  if (!canProceed && subtotal > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <ShoppingBag className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Minimum Order Not Met
                </h2>
                <p className="text-gray-600 mb-4">
                  Minimum order value is ₹{minimumOrderValue.toFixed(2)}.
                  Please add items worth ₹{(minimumOrderValue - subtotal).toFixed(2)} more.
                </p>
                <Button onClick={() => navigate('/cart')} className="bg-green-600 hover:bg-green-700">
                  Go Back to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/select-delivery-location')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout Details</h1>
            <p className="text-sm text-gray-600">Complete your order information</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Location Display */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">Delivery Location</h3>
                    <p className="text-sm text-green-700">{deliveryLocationName}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/select-delivery-location')}
                    className="text-green-600 border-green-300 hover:bg-green-100"
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Delivery Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {optionsError && (
                  <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">{optionsError}</AlertDescription>
                  </Alert>
                )}
                
                {isLoadingOptions ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup value={selectedDeliveryOption} onValueChange={setSelectedDeliveryOption}>
                    {deliveryOptions.map((option) => (
                      <div key={option.type} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value={option.type} id={option.type} className="text-green-600" />
                        <div className="flex-1">
                          <label htmlFor={option.type} className="font-medium cursor-pointer text-gray-900">
                            {option.label}
                          </label>
                          {option.charge > 0 && (
                            <p className="text-sm text-gray-600">₹{option.charge} delivery charge</p>
                          )}
                        </div>
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions for your order..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="focus:ring-green-500 focus:border-green-500"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-green-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm py-2 border-b border-gray-100">
                      <span className="font-medium">{item.quantity}x {item.name}</span>
                      <span className="font-semibold">₹{(parseFloat(item.price_string.replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Costs */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery:</span>
                    <span className="font-medium">₹{finalDeliveryCharge.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">Cash on Delivery</div>
                      <div className="text-sm text-blue-700">Pay by cash or UPI upon delivery</div>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={!customerName || !customerPhone || !selectedDeliveryOption || isPlacingOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                  size="lg"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutDetailsPage

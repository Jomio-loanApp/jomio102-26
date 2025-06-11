
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useLocationStore } from '@/stores/locationStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Clock, CreditCard, ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DeliveryOption {
  type: string
  label: string
  charge: number
  estimated_time?: string
}

const CheckoutPage = () => {
  const { user, profile } = useAuthStore()
  const { items, getSubtotal, clearCart } = useCartStore()
  const { deliveryLat, deliveryLng, deliveryLocationName } = useLocationStore()
  const navigate = useNavigate()

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState('') // No default selection
  const [customerNotes, setCustomerNotes] = useState('')
  
  // Data states
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [minimumOrderValue, setMinimumOrderValue] = useState(0)
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isCalculatingCharge, setIsCalculatingCharge] = useState(false)
  const [deliveryOptionsError, setDeliveryOptionsError] = useState<string | null>(null)

  useEffect(() => {
    console.log('CheckoutPage: Component mounted, cart items:', items.length)
    
    if (items.length === 0) {
      console.log('CheckoutPage: No items in cart, redirecting to cart page')
      navigate('/cart')
      return
    }

    if (!deliveryLat || !deliveryLng) {
      console.log('CheckoutPage: No delivery location set, redirecting to location selection')
      
      // For logged-in users, redirect to address selection
      if (user) {
        navigate('/select-address')
      } else {
        navigate('/set-delivery-location')
      }
      return
    }
    
    initializeCheckout()
  }, [user, profile, items.length, deliveryLat, deliveryLng, navigate])

  useEffect(() => {
    // Only calculate delivery charge when instant delivery is explicitly selected
    if (selectedDeliveryOption === 'instant' && deliveryLat && deliveryLng) {
      calculateDeliveryCharge()
    } else {
      // Clear delivery charge for other options
      setDeliveryCharge(0)
    }
  }, [selectedDeliveryOption, deliveryLat, deliveryLng])

  const initializeCheckout = async () => {
    setIsLoading(true)
    
    try {
      await Promise.all([
        fetchShopSettings(),
        fetchDeliveryOptions()
      ])

      // Pre-fill customer info if logged in
      if (user && profile) {
        setCustomerName(profile.full_name || '')
        setCustomerPhone(profile.phone_number || '')
      }
    } catch (error) {
      console.error('Error initializing checkout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchShopSettings = async () => {
    try {
      console.log('CheckoutPage: Fetching shop settings...')
      const { data, error } = await supabase
        .from('shop_settings')
        .select('minimum_order_value')
        .single()

      if (error) {
        console.error('CheckoutPage: Error fetching shop settings:', error)
        throw error
      }
      
      console.log('CheckoutPage: Shop settings fetched:', data)
      setMinimumOrderValue(data?.minimum_order_value || 0)
    } catch (error) {
      console.error('Error fetching shop settings:', error)
      setMinimumOrderValue(0)
    }
  }

  const fetchDeliveryOptions = async () => {
    try {
      setIsLoadingOptions(true)
      setDeliveryOptionsError(null)
      console.log('CheckoutPage: Fetching delivery options...')
      
      const { data, error } = await supabase.functions.invoke('get-available-delivery-options')
      
      if (error) {
        console.error('CheckoutPage: Error fetching delivery options:', error)
        throw error
      }
      
      console.log('CheckoutPage: Delivery options response:', data)
      
      let optionsArray: DeliveryOption[] = []
      
      if (Array.isArray(data)) {
        optionsArray = data
      } else if (data && typeof data === 'object') {
        if (data.delivery_options && Array.isArray(data.delivery_options)) {
          optionsArray = data.delivery_options
        } else {
          optionsArray = [data]
        }
      } else {
        throw new Error('Invalid delivery options format')
      }
      
      setDeliveryOptions(optionsArray)
      
      // Do not set default selection - user must choose explicitly
      
    } catch (error) {
      console.error('Error fetching delivery options:', error)
      setDeliveryOptionsError('Failed to load delivery options. Using default options.')
      
      const fallbackOptions = [
        { type: 'instant', label: 'Instant Delivery (30-45 min)', charge: 0 },
        { type: 'morning', label: 'Morning Delivery (Tomorrow 7 AM - 9 AM)', charge: 0 },
        { type: 'evening', label: 'Evening Delivery (Tomorrow 6 PM - 8 PM)', charge: 0 },
      ]
      console.log('CheckoutPage: Using fallback delivery options:', fallbackOptions)
      setDeliveryOptions(fallbackOptions)
    } finally {
      setIsLoadingOptions(false)
    }
  }

  const calculateDeliveryCharge = async () => {
    if (!deliveryLat || !deliveryLng) return

    try {
      setIsCalculatingCharge(true)
      console.log('CheckoutPage: Calculating delivery charge for location:', { deliveryLat, deliveryLng })
      
      const { data, error } = await supabase.functions.invoke('calculate-delivery-charge', {
        body: { 
          p_customer_lat: deliveryLat, 
          p_customer_lon: deliveryLng 
        }
      })
      
      if (error) {
        console.error('CheckoutPage: Error calculating delivery charge:', error)
        throw error
      }
      
      console.log('CheckoutPage: Delivery charge response:', data)
      
      if (data && typeof data.delivery_charge === 'number') {
        setDeliveryCharge(data.delivery_charge)
      } else {
        throw new Error('Invalid delivery charge response format')
      }
      
    } catch (error) {
      console.error('Error calculating delivery charge:', error)
      const fallbackCharge = 20
      console.log('CheckoutPage: Using fallback delivery charge:', fallbackCharge)
      setDeliveryCharge(fallbackCharge)
      
      toast({
        title: "Could not calculate delivery charge",
        description: "Using standard delivery charge.",
        variant: "destructive"
      })
    } finally {
      setIsCalculatingCharge(false)
    }
  }

  const handlePlaceOrder = async () => {
    console.log('CheckoutPage: Placing order...')
    setIsPlacingOrder(true)

    try {
      const finalDeliveryCharge = selectedDeliveryOption === 'instant' ? deliveryCharge : 0
      
      // Prepare cart data
      const cartData = items.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity
      }))

      console.log('CheckoutPage: Order data prepared:', {
        user: !!user,
        cartData,
        deliveryInfo: { deliveryLat, deliveryLng, deliveryLocationName },
        deliveryType: selectedDeliveryOption,
        deliveryCharge: finalDeliveryCharge
      })

      if (user) {
        // Authenticated order
        console.log('CheckoutPage: User is authenticated, creating authenticated order')
        
        const orderData = {
          p_delivery_lat: deliveryLat,
          p_delivery_lon: deliveryLng,
          p_delivery_location_name: deliveryLocationName,
          p_delivery_type: selectedDeliveryOption,
          p_cart: cartData,
          p_customer_notes: customerNotes || null
        }

        console.log('CheckoutPage: Creating authenticated order with data:', orderData)

        const { data, error } = await supabase.functions.invoke('create-authenticated-order', {
          body: orderData
        })

        if (error) {
          console.error('CheckoutPage: Authenticated order creation failed:', error)
          throw error
        }

        console.log('CheckoutPage: Authenticated order created successfully:', data)
        
        if (data && data.order_id) {
          clearCart()
          navigate(`/order-confirmation/${data.order_id}`)
          
          toast({
            title: "Order placed successfully!",
            description: "Thank you for your order. You will receive updates soon.",
          })
        } else {
          throw new Error('Order created but no order ID returned')
        }
        
      } else {
        // Guest order
        console.log('CheckoutPage: User is guest, creating guest order')
        
        if (!customerName || !customerPhone) {
          throw new Error('Customer name and phone are required for guest orders')
        }
        
        const orderData = {
          p_name: customerName,
          p_phone: customerPhone,
          p_delivery_lat: deliveryLat,
          p_delivery_lon: deliveryLng,
          p_delivery_location_name: deliveryLocationName,
          p_delivery_type: selectedDeliveryOption,
          p_cart: cartData
        }

        console.log('CheckoutPage: Creating guest order with data:', orderData)

        const { data, error } = await supabase.functions.invoke('create-guest-order', {
          body: orderData
        })

        if (error) {
          console.error('CheckoutPage: Guest order creation failed:', error)
          throw error
        }

        console.log('CheckoutPage: Guest order created successfully:', data)
        
        if (data && data.order_id) {
          clearCart()
          navigate(`/order-confirmation/${data.order_id}`)
          
          toast({
            title: "Order placed successfully!",
            description: "Thank you for your order. You will receive updates soon.",
          })
        } else {
          throw new Error('Order created but no order ID returned')
        }
      }
      
    } catch (error) {
      console.error('CheckoutPage: Order creation failed:', error)
      let errorMessage = "Failed to place your order. Please try again."
      
      if (error.message?.includes('401')) {
        errorMessage = "Please log in again to place your order."
      } else if (error.message?.includes('400')) {
        errorMessage = "Please check your order details and try again."
      } else if (error.message?.includes('500')) {
        errorMessage = "Server error. Please try again in a moment."
      } else if (error.message?.includes('Customer name')) {
        errorMessage = "Please enter your name and phone number."
      }
      
      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const subtotal = getSubtotal()
  const finalDeliveryCharge = selectedDeliveryOption === 'instant' ? deliveryCharge : 0
  const totalAmount = subtotal + finalDeliveryCharge
  const canProceed = subtotal >= minimumOrderValue && customerName && customerPhone && selectedDeliveryOption

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

  if (!canProceed && subtotal < minimumOrderValue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header showSearch={false} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-yellow-600" />
                </div>
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
      <Header showSearch={false} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-green-600 rounded-full"></div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            </div>

            {/* Customer Information */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <span>Customer Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
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

            {/* Delivery Address Confirmation */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <span>Delivery Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{deliveryLocationName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Coordinates: {deliveryLat?.toFixed(6)}, {deliveryLng?.toFixed(6)}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(user ? '/select-address' : '/set-delivery-location')}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <span>Delivery Options</span>
                  {isLoadingOptions && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {deliveryOptionsError && (
                  <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">{deliveryOptionsError}</AlertDescription>
                  </Alert>
                )}
                
                {!selectedDeliveryOption && (
                  <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      Please select a delivery option to continue
                    </AlertDescription>
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
                          {option.type === 'instant' && selectedDeliveryOption === 'instant' && (
                            <div className="flex items-center space-x-2 mt-1">
                              {isCalculatingCharge ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Calculating charge...
                                </div>
                              ) : deliveryCharge > 0 ? (
                                <p className="text-sm text-gray-600">₹{deliveryCharge} delivery charge</p>
                              ) : null}
                            </div>
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
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                  <span>Special Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
            <Card className="sticky top-6 border-gray-200 shadow-sm">
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
                    <span className="font-medium">
                      {isCalculatingCharge ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : (
                        `₹${finalDeliveryCharge.toFixed(2)}`
                      )}
                    </span>
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
                  disabled={!canProceed || isPlacingOrder || isCalculatingCharge}
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

export default CheckoutPage

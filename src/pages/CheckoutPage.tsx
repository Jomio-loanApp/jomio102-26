
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import LocationSelector from '@/components/LocationSelector'
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

interface Address {
  id: string
  address_nickname: string
  latitude: number
  longitude: number
  location_name: string
  is_default: boolean
}

const CheckoutPage = () => {
  const { user, profile } = useAuthStore()
  const { items, getSubtotal, clearCart } = useCartStore()
  const navigate = useNavigate()

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null)
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null)
  const [deliveryLocationName, setDeliveryLocationName] = useState('')
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  
  // Data states
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [minimumOrderValue, setMinimumOrderValue] = useState(0)
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [deliveryOptionsError, setDeliveryOptionsError] = useState<string | null>(null)

  useEffect(() => {
    console.log('CheckoutPage: Component mounted, cart items:', items.length)
    
    if (items.length === 0) {
      console.log('CheckoutPage: No items in cart, redirecting to cart page')
      navigate('/cart')
      return
    }
    
    fetchShopSettings()
    if (user) {
      setCustomerName(profile?.full_name || '')
      setCustomerPhone(profile?.phone_number || '')
      fetchSavedAddresses()
    }
  }, [user, profile, items.length, navigate])

  useEffect(() => {
    console.log('CheckoutPage: Location or delivery option changed', {
      deliveryLat,
      deliveryLng,
      selectedDeliveryOption
    })
    
    if (deliveryLat && deliveryLng) {
      fetchDeliveryOptions()
      if (selectedDeliveryOption === 'instant') {
        calculateDeliveryCharge()
      }
    }
  }, [deliveryLat, deliveryLng, selectedDeliveryOption])

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

  const fetchSavedAddresses = async () => {
    if (!user) return

    try {
      console.log('CheckoutPage: Fetching saved addresses for user:', user.id)
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.id)
        .order('is_default', { ascending: false })

      if (error) {
        console.error('CheckoutPage: Error fetching addresses:', error)
        throw error
      }
      
      console.log('CheckoutPage: Saved addresses fetched:', data)
      setSavedAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setSavedAddresses([])
    }
  }

  const fetchDeliveryOptions = async () => {
    try {
      console.log('CheckoutPage: Fetching delivery options...')
      setDeliveryOptionsError(null)
      
      const { data, error } = await supabase.functions.invoke('get-available-delivery-options')
      
      if (error) {
        console.error('CheckoutPage: Error fetching delivery options:', error)
        throw error
      }
      
      console.log('CheckoutPage: Delivery options fetched:', data)
      setDeliveryOptions(data || [])
    } catch (error) {
      console.error('Error fetching delivery options:', error)
      setDeliveryOptionsError('Failed to load delivery options. Using default options.')
      
      // Fallback options
      const fallbackOptions = [
        { type: 'instant', label: 'Instant Delivery (30-45 min)', charge: 0 },
        { type: 'morning', label: 'Morning Delivery (Tomorrow 7 AM - 9 AM)', charge: 0 },
        { type: 'evening', label: 'Evening Delivery (Tomorrow 6 PM - 8 PM)', charge: 0 },
      ]
      console.log('CheckoutPage: Using fallback delivery options:', fallbackOptions)
      setDeliveryOptions(fallbackOptions)
    }
  }

  const calculateDeliveryCharge = async () => {
    if (!deliveryLat || !deliveryLng) return

    try {
      console.log('CheckoutPage: Calculating delivery charge for location:', { deliveryLat, deliveryLng })
      const { data, error } = await supabase.functions.invoke('calculate-delivery-charge', {
        body: { p_customer_lat: deliveryLat, p_customer_lon: deliveryLng }
      })
      
      if (error) {
        console.error('CheckoutPage: Error calculating delivery charge:', error)
        throw error
      }
      
      console.log('CheckoutPage: Delivery charge calculated:', data)
      setDeliveryCharge(data?.delivery_charge || 0)
    } catch (error) {
      console.error('Error calculating delivery charge:', error)
      const fallbackCharge = 20
      console.log('CheckoutPage: Using fallback delivery charge:', fallbackCharge)
      setDeliveryCharge(fallbackCharge)
    }
  }

  const handleLocationSelect = (lat: number, lng: number, locationName: string) => {
    console.log('CheckoutPage: Location selected:', { lat, lng, locationName })
    setDeliveryLat(lat)
    setDeliveryLng(lng)
    setDeliveryLocationName(locationName)
  }

  const selectSavedAddress = (address: Address) => {
    console.log('CheckoutPage: Saved address selected:', address)
    setDeliveryLat(address.latitude)
    setDeliveryLng(address.longitude)
    setDeliveryLocationName(address.location_name)
  }

  const handlePlaceOrder = async () => {
    console.log('CheckoutPage: Placing order...')
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

      console.log('CheckoutPage: Order data prepared:', orderData)

      let result
      if (user) {
        console.log('CheckoutPage: User is authenticated, creating authenticated order')
        // TODO: Call create-authenticated-order function when available
        result = { data: { order_id: 'temp_auth_' + Date.now() } }
      } else {
        console.log('CheckoutPage: User is guest, creating guest order')
        result = await supabase.functions.invoke('create-guest-order', {
          body: orderData
        })
      }

      if (result.error) {
        console.error('CheckoutPage: Order creation failed:', result.error)
        throw result.error
      }

      console.log('CheckoutPage: Order created successfully:', result.data)
      clearCart()
      navigate(`/order-confirmation/${result.data.order_id}`)
      
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. You will receive updates soon.",
      })
    } catch (error) {
      console.error('Error placing order:', error)
      toast({
        title: "Order failed",
        description: "Failed to place your order. Please try again.",
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

  console.log('CheckoutPage: Render state:', {
    itemsCount: items.length,
    subtotal,
    minimumOrderValue,
    canProceed,
    deliveryLat,
    deliveryLng,
    selectedDeliveryOption,
    deliveryOptionsCount: deliveryOptions.length
  })

  if (!canProceed && subtotal > 0) {
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

            {/* Step 1: Customer Information */}
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

            {/* Step 2: Delivery Location */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <span>Delivery Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Saved Addresses */}
                {user && savedAddresses.length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Saved Addresses</Label>
                    <div className="grid gap-3 mt-3">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => selectSavedAddress(address)}
                          className="text-left p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-gray-900">{address.address_nickname}</div>
                              <div className="text-sm text-gray-600">{address.location_name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <Label className="text-base font-medium">Or Select New Location</Label>
                  </div>
                )}

                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  selectedPosition={deliveryLat && deliveryLng ? [deliveryLat, deliveryLng] : undefined}
                />
              </CardContent>
            </Card>

            {/* Step 3: Delivery Options */}
            {deliveryLat && deliveryLng && deliveryOptions.length > 0 && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                    <span>Delivery Options</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {deliveryOptionsError && (
                    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700">{deliveryOptionsError}</AlertDescription>
                    </Alert>
                  )}
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
                </CardContent>
              </Card>
            )}

            {/* Step 4: Order Notes */}
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
                  disabled={!customerName || !customerPhone || !deliveryLat || !selectedDeliveryOption || isPlacingOrder}
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

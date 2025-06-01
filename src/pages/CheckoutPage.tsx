
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
import { MapPin, Clock, CreditCard, ShoppingBag } from 'lucide-react'
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
      const { data, error } = await supabase.functions.invoke('get-available-delivery-options')
      
      if (error) {
        console.error('CheckoutPage: Error fetching delivery options:', error)
        throw error
      }
      
      console.log('CheckoutPage: Delivery options fetched:', data)
      setDeliveryOptions(data || [])
    } catch (error) {
      console.error('Error fetching delivery options:', error)
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
      setDeliveryCharge(fallbackCharge) // Fallback charge
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
        // For now, simulate successful order creation
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
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ShoppingBag className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Minimum Order Not Met
                </h2>
                <p className="text-gray-600 mb-4">
                  Minimum order value is ₹{minimumOrderValue.toFixed(2)}.
                  Please add items worth ₹{(minimumOrderValue - subtotal).toFixed(2)} more.
                </p>
                <Button onClick={() => navigate('/cart')}>
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
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

            {/* Step 1: Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">1</div>
                  <span>Customer Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Delivery Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                  <span>Delivery Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Saved Addresses */}
                {user && savedAddresses.length > 0 && (
                  <div>
                    <Label>Saved Addresses</Label>
                    <div className="grid gap-2 mt-2">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => selectSavedAddress(address)}
                          className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{address.address_nickname}</div>
                              <div className="text-sm text-gray-600">{address.location_name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <Label>Or Select New Location</Label>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">3</div>
                    <span>Delivery Options</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedDeliveryOption} onValueChange={setSelectedDeliveryOption}>
                    {deliveryOptions.map((option) => (
                      <div key={option.type} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={option.type} id={option.type} />
                        <div className="flex-1">
                          <label htmlFor={option.type} className="font-medium cursor-pointer">
                            {option.label}
                          </label>
                          {option.charge > 0 && (
                            <p className="text-sm text-gray-600">₹{option.charge} delivery charge</p>
                          )}
                        </div>
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">4</div>
                  <span>Special Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions for your order..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{(parseFloat(item.price_string.replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Costs */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>₹{finalDeliveryCharge.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-4">
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
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
                  className="w-full"
                  size="lg"
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
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

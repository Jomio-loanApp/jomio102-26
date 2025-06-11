
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLocationStore } from '@/stores/locationStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Plus, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SavedAddress {
  id: string
  address_nickname: string
  latitude: number
  longitude: number
  location_name: string
  is_default: boolean
}

const SelectAddressPage = () => {
  const { user } = useAuthStore()
  const { setDeliveryLocation } = useLocationStore()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchAddresses()
  }, [user, navigate])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log('SelectAddressPage: Fetching addresses for user:', user.id)

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('SelectAddressPage: Error fetching addresses:', error)
        throw error
      }

      console.log('SelectAddressPage: Addresses fetched:', data)
      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast({
        title: "Error",
        description: "Failed to load your saved addresses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAddress = (address: SavedAddress) => {
    console.log('SelectAddressPage: Address selected:', address)
    setDeliveryLocation(address.latitude, address.longitude, address.location_name)
    navigate('/checkout')
  }

  const handleAddNewAddress = () => {
    navigate('/set-delivery-location')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
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
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Delivery Address</h1>
            <p className="text-gray-600">Choose from your saved addresses or add a new one</p>
          </div>

          {/* Add New Address Button */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-green-400 transition-colors cursor-pointer">
            <CardContent 
              className="p-6 text-center"
              onClick={handleAddNewAddress}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Add New Address</h3>
                  <p className="text-sm text-gray-600">Set a new delivery location</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Saved Addresses</h2>
              {addresses.map((address) => (
                <Card 
                  key={address.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAddressId === address.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => setSelectedAddressId(address.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{address.address_nickname}</h3>
                          {address.is_default && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{address.location_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectAddress(address)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Deliver Here
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {addresses.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Saved Addresses</h3>
                <p className="text-gray-600 mb-4">You haven't saved any delivery addresses yet.</p>
                <Button onClick={handleAddNewAddress} className="bg-green-600 hover:bg-green-700">
                  Add Your First Address
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SelectAddressPage

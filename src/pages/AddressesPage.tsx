
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MapPin, Trash2, Loader2, Home } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Address {
  id: string
  profile_id: string
  address_nickname: string
  latitude: number
  longitude: number
  location_name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

const AddressesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

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
      console.log('Fetching addresses for user:', user.id)
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        throw error
      }

      console.log('Addresses fetched:', data)
      setAddresses(data || [])
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
      toast({
        title: "Error",
        description: "Failed to load addresses. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      setIsDeletingId(addressId)
      console.log('Deleting address with ID:', addressId)
      
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)

      if (error) {
        console.error('Error deleting address:', error)
        throw error
      }

      console.log('Address deleted successfully')
      toast({
        title: "Success",
        description: "Address deleted successfully.",
      })

      // Update local state by removing the deleted address
      setAddresses(prev => prev.filter(addr => addr.id !== addressId))
      
    } catch (error) {
      console.error('Error deleting address:', error)
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    try {
      // Unset all default addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('profile_id', user.id)

      // Set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Default address updated.",
      })

      await fetchAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      toast({
        title: "Error",
        description: "Failed to update default address.",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Saved Addresses</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-gray-600">
                Manage your saved delivery addresses. Add new addresses during checkout.
              </p>
            </div>

            {/* Addresses List */}
            {addresses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                  <p className="text-gray-600 mb-4">You can add addresses during checkout.</p>
                  <Button onClick={() => navigate('/')} variant="outline">
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <Card key={address.id} className={`${address.is_default ? 'ring-2 ring-green-500' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{address.address_nickname}</h3>
                            {address.is_default && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-start space-x-2 text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{address.location_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!address.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(address.id)}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            disabled={isDeletingId === address.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isDeletingId === address.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddressesPage

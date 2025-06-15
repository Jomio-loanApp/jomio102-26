
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Loader2, Home } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import LocationSelector from '@/components/LocationSelector'

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
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nickname: '',
    latitude: 0,
    longitude: 0,
    locationName: '',
    isDefault: false
  })

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

  const resetForm = () => {
    setFormData({
      nickname: '',
      latitude: 0,
      longitude: 0,
      locationName: '',
      isDefault: false
    })
    setEditingAddress(null)
  }

  const handleAddAddress = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleEditAddress = (address: Address) => {
    setFormData({
      nickname: address.address_nickname,
      latitude: address.latitude,
      longitude: address.longitude,
      locationName: address.location_name,
      isDefault: address.is_default
    })
    setEditingAddress(address)
    setShowAddModal(true)
  }

  const handleLocationSelect = (lat: number, lng: number, locationName: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      locationName
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.locationName || !formData.nickname) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a location.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            address_nickname: formData.nickname,
            latitude: formData.latitude,
            longitude: formData.longitude,
            location_name: formData.locationName,
            is_default: formData.isDefault,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddress.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Address updated successfully.",
        })
      } else {
        // Add new address
        const { error } = await supabase
          .from('addresses')
          .insert({
            profile_id: user.id,
            address_nickname: formData.nickname,
            latitude: formData.latitude,
            longitude: formData.longitude,
            location_name: formData.locationName,
            is_default: formData.isDefault
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "Address added successfully.",
        })
      }

      // If this address is set as default, unset other default addresses
      if (formData.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('profile_id', user.id)
          .neq('id', editingAddress?.id || '')

        if (editingAddress) {
          await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('id', editingAddress.id)
        }
      }

      setShowAddModal(false)
      resetForm()
      await fetchAddresses()

    } catch (error) {
      console.error('Error saving address:', error)
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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
            {/* Add Address Button */}
            <Button
              onClick={handleAddAddress}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Address
            </Button>

            {/* Addresses List */}
            {addresses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                  <p className="text-gray-600 mb-4">Add your first delivery address to get started.</p>
                  <Button onClick={handleAddAddress} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
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
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            disabled={isDeletingId === address.id}
                            className="text-red-600 hover:text-red-700"
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

      {/* Add/Edit Address Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          setShowAddModal(false)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nickname">Address Name *</Label>
              <Input
                id="nickname"
                placeholder="e.g., Home, Work, etc."
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <LocationSelector
                onLocationSelect={handleLocationSelect}
                selectedPosition={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : undefined}
              />
              {formData.locationName && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Selected:</strong> {formData.locationName}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="default"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                disabled={isSubmitting}
              />
              <Label htmlFor="default">Set as default address</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.locationName || !formData.nickname}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingAddress ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingAddress ? 'Update Address' : 'Add Address'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddressesPage

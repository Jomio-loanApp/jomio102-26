
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Plus, Edit, Trash, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import LocationSelector from '@/components/LocationSelector'

interface SavedAddress {
  id: string
  address_nickname: string
  latitude: number
  longitude: number
  location_name: string
  is_default: boolean
  created_at: string
}

const AddressManagementPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null)
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form states
  const [dialogAddressNickname, setDialogAddressNickname] = useState('')
  const [dialogIsDefault, setDialogIsDefault] = useState(false)
  const [dialogLat, setDialogLat] = useState<number | null>(null)
  const [dialogLng, setDialogLng] = useState<number | null>(null)
  const [dialogLocationName, setDialogLocationName] = useState('')
  
  // Operation states
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      console.log('AddressManagementPage: Fetching addresses for user:', user.id)

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('AddressManagementPage: Error fetching addresses:', error)
        throw error
      }

      console.log('AddressManagementPage: Addresses fetched:', data)
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

  const handleLocationSelect = (lat: number, lng: number, locationName: string) => {
    console.log('AddressManagementPage: Location selected:', { lat, lng, locationName })
    setDialogLat(lat)
    setDialogLng(lng)
    setDialogLocationName(locationName)
  }

  const openAddDialog = () => {
    setDialogAddressNickname('')
    setDialogIsDefault(false)
    setDialogLat(null)
    setDialogLng(null)
    setDialogLocationName('')
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (address: SavedAddress) => {
    setSelectedAddress(address)
    setDialogAddressNickname(address.address_nickname)
    setDialogIsDefault(address.is_default)
    setDialogLat(address.latitude)
    setDialogLng(address.longitude)
    setDialogLocationName(address.location_name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (address: SavedAddress) => {
    setSelectedAddress(address)
    setIsDeleteDialogOpen(true)
  }

  const validateForm = () => {
    if (!dialogAddressNickname.trim()) {
      toast({
        title: "Error",
        description: "Please enter a nickname for this address",
        variant: "destructive",
      })
      return false
    }

    if (!dialogLat || !dialogLng || !dialogLocationName) {
      toast({
        title: "Error",
        description: "Please select a location on the map",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleAddAddress = async () => {
    if (!user || !validateForm()) return
    
    try {
      setIsSubmitting(true)
      console.log('AddressManagementPage: Adding new address')

      const newAddress = {
        profile_id: user.id,
        address_nickname: dialogAddressNickname,
        latitude: dialogLat,
        longitude: dialogLng,
        location_name: dialogLocationName,
        is_default: dialogIsDefault
      }

      // If setting this as default, update other addresses to not be default
      if (dialogIsDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('profile_id', user.id)
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([newAddress])
        .select()

      if (error) {
        console.error('AddressManagementPage: Error adding address:', error)
        throw error
      }

      console.log('AddressManagementPage: Address added successfully:', data)
      setIsAddDialogOpen(false)
      await fetchAddresses()
      
      toast({
        title: "Success",
        description: "Address added successfully",
      })
    } catch (error) {
      console.error('Error adding address:', error)
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAddress = async () => {
    if (!user || !selectedAddress || !validateForm()) return
    
    try {
      setIsSubmitting(true)
      console.log('AddressManagementPage: Updating address:', selectedAddress.id)

      const updatedAddress = {
        address_nickname: dialogAddressNickname,
        latitude: dialogLat,
        longitude: dialogLng,
        location_name: dialogLocationName,
        is_default: dialogIsDefault
      }

      // If setting this as default, update other addresses to not be default
      if (dialogIsDefault && !selectedAddress.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('profile_id', user.id)
      }

      const { error } = await supabase
        .from('addresses')
        .update(updatedAddress)
        .eq('id', selectedAddress.id)

      if (error) {
        console.error('AddressManagementPage: Error updating address:', error)
        throw error
      }

      console.log('AddressManagementPage: Address updated successfully')
      setIsEditDialogOpen(false)
      await fetchAddresses()
      
      toast({
        title: "Success",
        description: "Address updated successfully",
      })
    } catch (error) {
      console.error('Error updating address:', error)
      toast({
        title: "Error",
        description: "Failed to update address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAddress = async () => {
    if (!user || !selectedAddress) return
    
    try {
      setIsSubmitting(true)
      console.log('AddressManagementPage: Deleting address:', selectedAddress.id)

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', selectedAddress.id)

      if (error) {
        console.error('AddressManagementPage: Error deleting address:', error)
        throw error
      }

      console.log('AddressManagementPage: Address deleted successfully')
      setIsDeleteDialogOpen(false)
      await fetchAddresses()
      
      toast({
        title: "Success",
        description: "Address deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting address:', error)
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border">
                <div className="flex space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
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
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
            <Button 
              onClick={openAddDialog} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Saved Addresses</h3>
                <p className="text-gray-600 mb-4">You haven't saved any delivery addresses yet.</p>
                <Button 
                  onClick={openAddDialog} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Your First Address
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <Card key={address.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="mr-4 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(address)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => openDeleteDialog(address)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/profile')}
              className="text-green-600"
            >
              Back to Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Address Nickname</Label>
              <Input
                id="nickname"
                placeholder="Home, Office, etc."
                value={dialogAddressNickname}
                onChange={(e) => setDialogAddressNickname(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Location</Label>
              <div className="border rounded-md p-4">
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="default"
                checked={dialogIsDefault}
                onCheckedChange={setDialogIsDefault}
              />
              <Label htmlFor="default">
                Set as default address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAddress}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Address'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nickname">Address Nickname</Label>
              <Input
                id="edit-nickname"
                placeholder="Home, Office, etc."
                value={dialogAddressNickname}
                onChange={(e) => setDialogAddressNickname(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Update Location</Label>
              <div className="border rounded-md p-4">
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialPosition={dialogLat && dialogLng ? [dialogLat, dialogLng] : undefined}
                  selectedPosition={dialogLat && dialogLng ? [dialogLat, dialogLng] : undefined}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-default"
                checked={dialogIsDefault}
                onCheckedChange={setDialogIsDefault}
              />
              <Label htmlFor="edit-default">
                Set as default address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAddress}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this address?
              {selectedAddress?.is_default && (
                <span className="block mt-2 text-red-600 font-medium">
                  This is your default address.
                </span>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAddress}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddressManagementPage

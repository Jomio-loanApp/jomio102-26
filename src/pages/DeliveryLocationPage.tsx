
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLocationStore } from '@/stores/locationStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import LocationSelector from '@/components/LocationSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const DeliveryLocationPage = () => {
  const { user } = useAuthStore()
  const { setDeliveryLocation, deliveryLat, deliveryLng, deliveryLocationName } = useLocationStore()
  const navigate = useNavigate()
  
  const [selectedLat, setSelectedLat] = useState<number | null>(deliveryLat)
  const [selectedLng, setSelectedLng] = useState<number | null>(deliveryLng)
  const [selectedLocationName, setSelectedLocationName] = useState(deliveryLocationName)
  const [addressNickname, setAddressNickname] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleLocationSelect = (lat: number, lng: number, locationName: string) => {
    console.log('DeliveryLocationPage: Location selected:', { lat, lng, locationName })
    setSelectedLat(lat)
    setSelectedLng(lng)
    setSelectedLocationName(locationName)
  }

  const saveAddressForUser = async () => {
    if (!user || !selectedLat || !selectedLng || !selectedLocationName) {
      return false
    }

    try {
      console.log('DeliveryLocationPage: Saving address for user:', user.id)
      
      const addressData = {
        profile_id: user.id,
        address_nickname: addressNickname || 'Home',
        latitude: selectedLat,
        longitude: selectedLng,
        location_name: selectedLocationName,
        is_default: isDefault
      }

      const { error } = await supabase
        .from('addresses')
        .insert([addressData])

      if (error) {
        console.error('DeliveryLocationPage: Error saving address:', error)
        throw error
      }

      console.log('DeliveryLocationPage: Address saved successfully')
      return true
    } catch (error) {
      console.error('Error saving address:', error)
      toast({
        title: "Error saving address",
        description: "Failed to save your address. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleConfirmLocation = async () => {
    if (!selectedLat || !selectedLng || !selectedLocationName) {
      toast({
        title: "Location required",
        description: "Please select a delivery location",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // For logged-in users, save the address automatically
      if (user) {
        const saved = await saveAddressForUser()
        if (!saved) {
          setIsSaving(false)
          return
        }
      }

      // Set the delivery location in store
      setDeliveryLocation(selectedLat, selectedLng, selectedLocationName)
      
      // Navigate to checkout
      navigate('/checkout')
      
      toast({
        title: "Location confirmed",
        description: user ? "Address saved and location set!" : "Delivery location set!",
      })
    } catch (error) {
      console.error('Error confirming location:', error)
      toast({
        title: "Error",
        description: "Failed to confirm location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Delivery Location</h1>
            <p className="text-gray-600">Select your delivery address on the map</p>
          </div>

          {/* Location Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Choose Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationSelector
                onLocationSelect={handleLocationSelect}
                initialPosition={selectedLat && selectedLng ? [selectedLat, selectedLng] : undefined}
                selectedPosition={selectedLat && selectedLng ? [selectedLat, selectedLng] : undefined}
              />
            </CardContent>
          </Card>

          {/* Address Details for Logged-in Users */}
          {user && selectedLat && selectedLng && (
            <Card>
              <CardHeader>
                <CardTitle>Save This Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Address Nickname</Label>
                  <Input
                    id="nickname"
                    placeholder="Home, Office, etc."
                    value={addressNickname}
                    onChange={(e) => setAddressNickname(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="default"
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                  />
                  <Label htmlFor="default" className="text-sm">
                    Set as default address
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation */}
          {selectedLat && selectedLng && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-6 h-6 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900 mb-1">Selected Location</h3>
                    <p className="text-green-800">{selectedLocationName}</p>
                    <p className="text-sm text-green-700 mt-1">
                      {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleConfirmLocation}
                  disabled={isSaving}
                  className="w-full mt-4 hover:bg-green-700"
                  style={{ backgroundColor: '#23b14d' }}
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {user ? 'Saving Address...' : 'Confirming...'}
                    </>
                  ) : (
                    'Confirm Location & Proceed'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryLocationPage

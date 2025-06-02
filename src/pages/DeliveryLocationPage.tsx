
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/stores/locationStore'
import { useCartStore } from '@/stores/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Loader2, ArrowLeft, Search } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const DeliveryLocationPage = () => {
  const navigate = useNavigate()
  const { items } = useCartStore()
  const { setDeliveryLocation } = useLocationStore()
  
  const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946]) // Bangalore default
  const [isLocating, setIsLocating] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [locationName, setLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, name: string} | null>(null)
  
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
      return
    }
    
    initializeMap()
  }, [items.length, navigate])

  const initializeMap = async () => {
    try {
      // Dynamically import Google Maps API
      const { GoogleMap, Marker, LoadScript } = await import('@react-google-maps/api')
      setIsLoadingMap(false)
      
      // For now, we'll use a simple implementation
      // The actual Google Maps integration would require the LoadScript wrapper
      console.log('Map initialized with position:', position)
      updateLocationName(position[0], position[1])
    } catch (error) {
      console.error('Error loading map:', error)
      setIsLoadingMap(false)
      toast({
        title: "Map loading failed",
        description: "Please use manual location selection",
        variant: "destructive"
      })
    }
  }

  const updateLocationName = async (lat: number, lng: number) => {
    try {
      console.log('Getting location name for:', lat, lng)
      
      // Try to call the edge function first (will fail due to CORS until user fixes it)
      try {
        const { data, error } = await supabase.functions.invoke('get-location-name', {
          body: { latitude: lat, longitude: lng }
        })
        
        if (!error && data?.location_name) {
          setLocationName(data.location_name)
          return
        }
      } catch (edgeFunctionError) {
        console.log('Edge function call failed (expected due to CORS):', edgeFunctionError)
      }
      
      // Fallback to a formatted location string
      const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setLocationName(fallbackName)
      
    } catch (error) {
      console.error('Error getting location name:', error)
      const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setLocationName(fallbackName)
    }
  }

  const getCurrentLocation = () => {
    setIsLocating(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Got current location:', latitude, longitude)
          setPosition([latitude, longitude])
          updateLocationName(latitude, longitude)
          setIsLocating(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setIsLocating(false)
          toast({
            title: "Location access denied",
            description: "Please select your location manually on the map",
            variant: "destructive"
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      setIsLocating(false)
      toast({
        title: "Geolocation not supported",
        description: "Please enter your address manually",
        variant: "destructive"
      })
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng)
    setPosition([lat, lng])
    updateLocationName(lat, lng)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // In a real implementation, this would use Google Places API
      // For now, we'll create a mock location
      const mockLat = position[0] + (Math.random() - 0.5) * 0.01
      const mockLng = position[1] + (Math.random() - 0.5) * 0.01
      
      setPosition([mockLat, mockLng])
      setLocationName(searchQuery.trim())
      
      toast({
        title: "Location found",
        description: `Using: ${searchQuery.trim()}`,
      })
    }
  }

  const handleConfirmLocation = () => {
    if (position && locationName) {
      setDeliveryLocation(position[0], position[1], locationName)
      
      toast({
        title: "Location confirmed",
        description: "Proceeding to checkout details",
      })
      
      navigate('/checkout-details')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cart')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Set Delivery Location</h1>
            <p className="text-sm text-gray-600">Choose where you want your order delivered</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Current Location Button */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <Button
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 mr-2" />
              )}
              Use Current Location
            </Button>
          </CardContent>
        </Card>

        {/* Search Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search for your location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="flex-1"
              />
              <Button onClick={handleSearchSubmit} disabled={!searchQuery.trim()}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Map Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Select on Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
              {isLoadingMap ? (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-green-600" />
                  <p className="text-sm text-gray-600">Loading interactive map...</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Interactive Map</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Google Maps integration will be available here.<br />
                    Click anywhere to select your delivery location.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMapClick(position[0] + 0.001, position[1] + 0.001)}
                    >
                      Mock Location A
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMapClick(position[0] - 0.001, position[1] - 0.001)}
                    >
                      Mock Location B
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Location Display */}
        {locationName && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Selected Location</h3>
                  <p className="text-sm text-blue-700">{locationName}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Button */}
        <div className="pt-4">
          <Button
            onClick={handleConfirmLocation}
            disabled={!locationName}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            size="lg"
          >
            Confirm Location & Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeliveryLocationPage

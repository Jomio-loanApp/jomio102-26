
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/stores/locationStore'
import { useCartStore } from '@/stores/cartStore'
import { supabase } from '@/lib/supabase'
import { GoogleMap, Marker, LoadScript, Autocomplete } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Loader2, ArrowLeft, Search } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const libraries: ("places")[] = ["places"]

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 12.9716, // Bangalore default
  lng: 77.5946
}

const DeliveryLocationPage = () => {
  const navigate = useNavigate()
  const { items } = useCartStore()
  const { setDeliveryLocation } = useLocationStore()
  
  const [position, setPosition] = useState(defaultCenter)
  const [isLocating, setIsLocating] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [locationName, setLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
      return
    }
  }, [items.length, navigate])

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
    setIsLoadingMap(false)
    updateLocationName(position.lat, position.lng)
  }

  const updateLocationName = async (lat: number, lng: number) => {
    try {
      console.log('Getting location name for:', lat, lng)
      
      // Try to call the edge function first
      try {
        const { data, error } = await supabase.functions.invoke('get-location-name', {
          body: { latitude: lat, longitude: lng }
        })
        
        if (!error && data?.location_name) {
          setLocationName(data.location_name)
          return
        }
      } catch (edgeFunctionError) {
        console.log('Edge function call failed (expected if not deployed):', edgeFunctionError)
      }
      
      // Fallback to Google Geocoding API
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setLocationName(results[0].formatted_address)
        } else {
          // Final fallback
          const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setLocationName(fallbackName)
        }
      })
      
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
          const newPosition = { lat: latitude, lng: longitude }
          setPosition(newPosition)
          updateLocationName(latitude, longitude)
          setIsLocating(false)
          
          // Center map if loaded
          if (mapRef.current) {
            mapRef.current.panTo(newPosition)
          }
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

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      console.log('Map clicked at:', lat, lng)
      const newPosition = { lat, lng }
      setPosition(newPosition)
      updateLocationName(lat, lng)
    }
  }

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      console.log('Marker dragged to:', lat, lng)
      const newPosition = { lat, lng }
      setPosition(newPosition)
      updateLocationName(lat, lng)
    }
  }

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const newPosition = { lat, lng }
        setPosition(newPosition)
        setLocationName(place.formatted_address || place.name || '')
        setSearchQuery(place.formatted_address || place.name || '')
        
        // Center map
        if (mapRef.current) {
          mapRef.current.panTo(newPosition)
        }
        
        toast({
          title: "Location found",
          description: `Using: ${place.formatted_address || place.name}`,
        })
      }
    }
  }

  const handleConfirmLocation = () => {
    if (position && locationName) {
      setDeliveryLocation(position.lat, position.lng, locationName)
      
      toast({
        title: "Location confirmed",
        description: "Proceeding to checkout details",
      })
      
      navigate('/checkout-details')
    }
  }

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q'

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

        {/* Google Maps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Select on Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadScript 
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={libraries}
              loadingElement={
                <div className="h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-green-600" />
                    <p className="text-sm text-gray-600">Loading Google Maps...</p>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Search Input with Autocomplete */}
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Autocomplete
                      onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete
                      }}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <Input
                        placeholder="Search for your location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </Autocomplete>
                  </div>
                </div>

                {/* Google Map */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={position}
                    zoom={15}
                    onLoad={handleMapLoad}
                    onClick={handleMapClick}
                    options={{
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    <Marker
                      position={position}
                      draggable={true}
                      onDragEnd={handleMarkerDragEnd}
                    />
                  </GoogleMap>
                </div>
              </div>
            </LoadScript>
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
                    Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
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

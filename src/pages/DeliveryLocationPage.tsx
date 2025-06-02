import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLocationStore } from '@/stores/locationStore'
import { useCartStore } from '@/stores/cartStore'
import { supabase } from '@/lib/supabase'
import { GoogleMap, Marker, LoadScript, Autocomplete } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Navigation, Loader2, ArrowLeft, Search } from 'lucide-react'
import CrosshairIcon from '@/components/CrosshairIcon'
import { toast } from '@/hooks/use-toast'

const libraries: ("places")[] = ["places"]

const mapContainerStyle = {
  width: '100%',
  height: '70vh'
}

const defaultCenter = {
  lat: 12.9716, // Bangalore default
  lng: 77.5946
}

const DeliveryLocationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { addItem } = useCartStore()
  const { setDeliveryLocation } = useLocationStore()
  
  // Get product data from navigation state
  const productToAdd = location.state?.product
  
  const [position, setPosition] = useState(defaultCenter)
  const [isLocating, setIsLocating] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [locationName, setLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [useReticle, setUseReticle] = useState(true) // Mobile-first approach
  
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    // If no product is being added, still allow location selection
    getCurrentLocation()
  }, [])

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
    if (event.latLng && !useReticle) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      console.log('Map clicked at:', lat, lng)
      const newPosition = { lat, lng }
      setPosition(newPosition)
      updateLocationName(lat, lng)
    }
  }

  const handleMapCenterChanged = () => {
    if (useReticle && mapRef.current) {
      const center = mapRef.current.getCenter()
      if (center) {
        const lat = center.lat()
        const lng = center.lng()
        const newPosition = { lat, lng }
        setPosition(newPosition)
        // Debounce the location name update
        const timeoutId = setTimeout(() => {
          updateLocationName(lat, lng)
        }, 500)
        return () => clearTimeout(timeoutId)
      }
    }
  }

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    if (event.latLng && !useReticle) {
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
      
      // Add product to cart if coming from product selection
      if (productToAdd) {
        addItem(productToAdd, 1)
        toast({
          title: "Product added to cart",
          description: `${productToAdd.name} has been added to your cart`,
        })
      }
      
      toast({
        title: "Location confirmed",
        description: "Proceeding to checkout",
      })
      
      navigate('/checkout')
    }
  }

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q'

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Set Delivery Location</h1>
            </div>
          </div>
          <Button
            onClick={getCurrentLocation}
            disabled={isLocating}
            variant="outline"
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar - Overlay */}
      <div className="absolute top-20 left-4 right-4 z-40">
        <LoadScript 
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={libraries}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
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
                className="pl-10 bg-white shadow-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </Autocomplete>
          </div>
        </LoadScript>
      </div>

      {/* Full Screen Map */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        <LoadScript 
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          loadingElement={
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-green-600" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          }
        >
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={position}
            zoom={15}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
            onCenterChanged={handleMapCenterChanged}
            options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              disableDefaultUI: true,
              gestureHandling: 'greedy',
            }}
          >
            {useReticle ? (
              // Centered crosshair/reticle for mobile UX
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="relative">
                  <CrosshairIcon className="w-8 h-8 text-red-500" />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    Tap location
                  </div>
                </div>
              </div>
            ) : (
              // Traditional draggable marker
              <Marker
                position={position}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {/* Map Mode Toggle */}
        <div className="absolute top-4 right-4 z-30">
          <Button
            onClick={() => setUseReticle(!useReticle)}
            variant="outline"
            size="sm"
            className="bg-white"
          >
            {useReticle ? 'Drag Mode' : 'Tap Mode'}
          </Button>
        </div>
      </div>

      {/* Bottom Panel with Location Info and Confirm Button */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        {locationName && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 text-sm">Selected Location</h3>
                  <p className="text-sm text-blue-700">{locationName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleConfirmLocation}
          disabled={!locationName}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          size="lg"
        >
          {productToAdd ? 'Confirm Location & Add to Cart' : 'Confirm Location & Proceed'}
        </Button>
      </div>
    </div>
  )
}

export default DeliveryLocationPage

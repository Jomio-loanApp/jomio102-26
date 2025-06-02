
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/stores/locationStore'
import { supabase } from '@/lib/supabase'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Search, Navigation, Loader2, MapPin, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const libraries: ("places")[] = ["places"]

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const defaultCenter = {
  lat: 12.9716, // Bangalore default
  lng: 77.5946
}

const DeliveryLocationPage = () => {
  const navigate = useNavigate()
  const { setDeliveryLocation } = useLocationStore()
  
  const [position, setPosition] = useState(defaultCenter)
  const [isLocating, setIsLocating] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [locationName, setLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const centerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Don't automatically get location on page load, let user choose
    setIsLoadingMap(false)
  }, [])

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
    setIsLoadingMap(false)
    // Set initial position without getting location name immediately
    setPosition(defaultCenter)
  }

  const updateLocationName = async (lat: number, lng: number) => {
    if (isUpdatingLocation) return
    
    try {
      setIsUpdatingLocation(true)
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
        console.log('Edge function call failed, trying Google Geocoding:', edgeFunctionError)
      }
      
      // Fallback to Google Geocoding API
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setLocationName(results[0].formatted_address)
          } else {
            const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            setLocationName(fallbackName)
          }
        })
      } else {
        const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setLocationName(fallbackName)
      }
      
    } catch (error) {
      console.error('Error getting location name:', error)
      const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setLocationName(fallbackName)
    } finally {
      setIsUpdatingLocation(false)
    }
  }

  const getCurrentLocation = () => {
    setIsLocating(true)
    setLocationPermissionDenied(false)
    
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
          
          toast({
            title: "Location found",
            description: "Map centered on your current location",
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setIsLocating(false)
          setLocationPermissionDenied(true)
          toast({
            title: "Location access denied",
            description: "Please select your location manually on the map or enable location access",
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
      setLocationPermissionDenied(true)
      toast({
        title: "Geolocation not supported",
        description: "Please enter your address manually",
        variant: "destructive"
      })
    }
  }

  const handleMapCenterChanged = useCallback(() => {
    if (!mapRef.current || isUpdatingLocation) return
    
    // Clear any existing timeout
    if (centerChangeTimeoutRef.current) {
      clearTimeout(centerChangeTimeoutRef.current)
    }
    
    // Debounce the center change handler
    centerChangeTimeoutRef.current = setTimeout(() => {
      const center = mapRef.current?.getCenter()
      if (center) {
        const lat = center.lat()
        const lng = center.lng()
        const newPosition = { lat, lng }
        
        // Only update if position actually changed significantly
        const latDiff = Math.abs(lat - position.lat)
        const lngDiff = Math.abs(lng - position.lng)
        
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          setPosition(newPosition)
          updateLocationName(lat, lng)
        }
      }
    }, 1000)
  }, [position.lat, position.lng, isUpdatingLocation])

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
        description: "Proceeding to checkout",
      })
      
      navigate('/checkout')
    } else {
      toast({
        title: "Please select a location",
        description: "Move the map to select your delivery location",
        variant: "destructive"
      })
    }
  }

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q'

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 relative z-50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Add address</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 relative z-40">
        <LoadScript 
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={libraries}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <Input
              placeholder="Search for a new area, locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </LoadScript>
      </div>

      {/* Device location not enabled banner */}
      {locationPermissionDenied && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 relative z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Device location not enabled</p>
                <p className="text-xs text-red-600">Enable for a better delivery experience</p>
              </div>
            </div>
            <Button
              onClick={getCurrentLocation}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Enable
            </Button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative" style={{ height: locationPermissionDenied ? 'calc(100vh - 180px)' : 'calc(100vh - 140px)' }}>
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
            mapContainerStyle={mapContainerStyle}
            center={position}
            zoom={15}
            onLoad={handleMapLoad}
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
            {/* Fixed center pin overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="relative">
                {/* Pin icon */}
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                
                {/* Tooltip */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm whitespace-nowrap">
                  Your order will be delivered here
                  <br />
                  Move pin to your exact location
                </div>
              </div>
            </div>
          </GoogleMap>
        </LoadScript>

        {/* Use current location button - floating */}
        <div className="absolute bottom-24 left-4 right-4 z-30">
          <Button
            onClick={getCurrentLocation}
            disabled={isLocating}
            variant="outline"
            className="w-full bg-white border-gray-300 text-gray-700 shadow-lg"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2 text-green-600" />
                Use current location
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bottom confirmation card */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Delivering your order to</div>
          
          {locationName ? (
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{locationName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLocationName('')
                      setSearchQuery('')
                    }}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-gray-500">
              <MapPin className="w-5 h-5" />
              <span>Move the map to select your location</span>
            </div>
          )}

          <Button
            onClick={handleConfirmLocation}
            disabled={!locationName || isUpdatingLocation}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            size="lg"
          >
            {isUpdatingLocation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting location...
              </>
            ) : (
              'Confirm Location & Proceed'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeliveryLocationPage

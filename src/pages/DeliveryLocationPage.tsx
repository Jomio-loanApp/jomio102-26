import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLocationStore } from '@/stores/locationStore'
import { supabase } from '@/lib/supabase'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Search, Navigation, Loader2, MapPin, AlertCircle, Home, Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const libraries: ("places" | "geocoding")[] = ["places", "geocoding"]

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
}

const mapOptions = {
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
}

interface SavedAddress {
  id: string
  address_nickname: string
  latitude: number
  longitude: number
  location_name: string
  is_default: boolean
}

const DeliveryLocationPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setDeliveryLocation, setLocationPermission, hasLocationPermission } = useLocationStore()
  
  const [position, setPosition] = useState(defaultCenter)
  const [isLocating, setIsLocating] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [locationName, setLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [showLocationBanner, setShowLocationBanner] = useState(!hasLocationPermission)
  const [locationError, setLocationError] = useState('')
  const [mapLoadError, setMapLoadError] = useState<string | null>(null)
  
  // Address management states
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [showAddressSelection, setShowAddressSelection] = useState(true)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const centerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setLocationPermission(true)
          setShowLocationBanner(false)
        } else if (result.state === 'denied') {
          setLocationPermission(false)
          setShowLocationBanner(true)
        }
      })
    }
    setIsLoadingMap(false)

    // Load saved addresses if user is logged in
    if (user) {
      fetchSavedAddresses()
    } else {
      setShowAddressSelection(false)
    }
  }, [setLocationPermission, user])

  const fetchSavedAddresses = async () => {
    if (!user) return

    try {
      setIsLoadingAddresses(true)
      console.log('Fetching saved addresses for user:', user.id)
      
      const { data, error } = await supabase
        .from('addresses')
        .select('id, address_nickname, latitude, longitude, location_name, is_default')
        .eq('profile_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        setShowAddressSelection(false)
        return
      }

      console.log('Saved addresses fetched:', data)
      setSavedAddresses(data || [])
      
      // If user has no saved addresses, skip to map selection
      if (!data || data.length === 0) {
        setShowAddressSelection(false)
      }
    } catch (error) {
      console.error('Failed to fetch saved addresses:', error)
      setShowAddressSelection(false)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    setIsLoadingMap(false)
    
    if (searchInputRef.current && window.google?.maps?.places?.PlaceAutocompleteElement) {
      try {
        autocompleteElementRef.current = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: 'IN' },
          types: ['establishment', 'geocode']
        })
        
        autocompleteElementRef.current.addEventListener('gmp-placeselect', onPlaceChanged)
        
        if (searchInputRef.current.parentNode) {
          searchInputRef.current.parentNode.insertBefore(autocompleteElementRef.current, searchInputRef.current.nextSibling)
          searchInputRef.current.style.display = 'none'
        }
      } catch (error) {
        console.error('Error initializing PlaceAutocompleteElement:', error)
      }
    }
  }, [])

  const updateLocationName = async (lat: number, lng: number) => {
    if (isUpdatingLocation) return
    
    try {
      setIsUpdatingLocation(true)
      setLocationError('')
      console.log('Getting location name for:', lat, lng)
      
      const { data, error } = await supabase.functions.invoke('get-location-name', {
        body: { latitude: lat, longitude: lng }
      })
      
      if (error) {
        console.error('Edge function error:', error)
        throw error
      }
      
      if (data?.delivery_location_name) {
        setLocationName(data.delivery_location_name)
        console.log('Location name received:', data.delivery_location_name)
      } else {
        if (window.google?.maps?.Geocoder) {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setLocationName(results[0].formatted_address)
            } else {
              console.error('Geocoding failed:', status)
              const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
              setLocationName(fallbackName)
            }
          })
        } else {
          const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setLocationName(fallbackName)
        }
      }
      
    } catch (error) {
      console.error('Error getting location name:', error)
      setLocationError('Could not determine address. Please try a different location.')
      const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setLocationName(fallbackName)
    } finally {
      setIsUpdatingLocation(false)
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
          setLocationPermission(true)
          setShowLocationBanner(false)
          
          if (mapRef.current) {
            mapRef.current.panTo(newPosition)
            mapRef.current.setZoom(16)
          }
          
          toast({
            title: "Location found",
            description: "Map centered on your current location",
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setIsLocating(false)
          setLocationPermission(false)
          setShowLocationBanner(true)
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
      setShowLocationBanner(true)
      toast({
        title: "Geolocation not supported",
        description: "Please select your location manually on the map",
        variant: "destructive"
      })
    }
  }

  const handleMapCenterChanged = useCallback(() => {
    if (!mapRef.current || isUpdatingLocation || showAddressSelection) return
    
    if (centerChangeTimeoutRef.current) {
      clearTimeout(centerChangeTimeoutRef.current)
    }
    
    centerChangeTimeoutRef.current = setTimeout(() => {
      const center = mapRef.current?.getCenter()
      if (center) {
        const lat = center.lat()
        const lng = center.lng()
        const newPosition = { lat, lng }
        
        const latDiff = Math.abs(lat - position.lat)
        const lngDiff = Math.abs(lng - position.lng)
        
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          setPosition(newPosition)
          updateLocationName(lat, lng)
        }
      }
    }, 1000)
  }, [position.lat, position.lng, isUpdatingLocation, showAddressSelection])

  const onPlaceChanged = (event: any) => {
    const place = event.detail.place
    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      const newPosition = { lat, lng }
      setPosition(newPosition)
      setLocationName(place.formatted_address || place.name || '')
      setSearchQuery(place.formatted_address || place.name || '')
      
      if (mapRef.current) {
        mapRef.current.panTo(newPosition)
        mapRef.current.setZoom(16)
      }
      
      toast({
        title: "Location found",
        description: `Using: ${place.formatted_address || place.name}`,
      })
    }
  }

  const handleSelectSavedAddress = (address: SavedAddress) => {
    const newPosition = { lat: address.latitude, lng: address.longitude }
    setPosition(newPosition)
    setLocationName(address.location_name)
    setShowAddressSelection(false)
    
    if (mapRef.current) {
      mapRef.current.panTo(newPosition)
      mapRef.current.setZoom(16)
    }
    
    toast({
      title: "Address selected",
      description: `Using: ${address.address_nickname}`,
    })
  }

  const handleUseNewLocation = () => {
    setShowAddressSelection(false)
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

  // Add a debug log to print the actual API key being used for maps
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q'
  // Debug key log (only do this in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Google Maps API Key used:', GOOGLE_MAPS_API_KEY)
  }

  // Handler for map loading errors
  const handleMapError = (error: any) => {
    console.error("Google Maps error:", error)
    setMapLoadError(
      typeof error === 'string'
        ? error
        : (error?.message || "Failed to load Google Maps. Please check your API key and network connection.")
    )
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 relative z-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">
            {showAddressSelection ? 'Select delivery address' : 'Add address'}
          </h1>
        </div>
      </div>

      {/* Show error banner if map failed to load */}
      {mapLoadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4 z-50">
          <strong className="font-bold">Map Load Error: </strong> 
          <span className="block sm:inline">{mapLoadError}</span>
          <div className="mt-2 text-xs text-red-800">
            Make sure:<br />
            - API Key is correct and not restricted<br />
            - <strong>Maps JavaScript API</strong> and <strong>Places API</strong> are enabled<br />
            - Billing is enabled on Google Cloud<br />
            - API key matches what is expected<br />
            - No browser extension is blocking map<br />
          </div>
        </div>
      )}

      {/* rest of delivery location logic */}
      {showAddressSelection && user ? (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {isLoadingAddresses ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {savedAddresses.map((address) => (
                  <Card 
                    key={address.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                    onClick={() => handleSelectSavedAddress(address)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Home className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{address.address_nickname}</h3>
                            {address.is_default && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{address.location_name}</p>
                        </div>
                        <div className="text-gray-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={handleUseNewLocation}
                >
                  <div className="flex items-center space-x-3 text-center">
                    <Plus className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Add new delivery location</h3>
                      <p className="text-sm text-gray-600">Use map to set a custom location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="px-4 py-3 bg-white border-b border-gray-100 relative z-40 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Input
                ref={searchInputRef}
                placeholder="Search for a new area, locality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Device location banner */}
          {showLocationBanner && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 relative z-40 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">Device location not enabled</p>
                    <p className="text-xs text-red-600">Enable for a better delivery experience</p>
                  </div>
                </div>
                <Button
                  onClick={getCurrentLocation}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 ml-2"
                  disabled={isLocating}
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enable"}
                </Button>
              </div>
            </div>
          )}

          {/* Location Error Banner */}
          {locationError && (
            <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 relative z-40 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">{locationError}</p>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 relative">
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
              onError={handleMapError}
              onLoad={() => {
                setMapLoadError(null)
                console.log('Google Map script loaded successfully')
              }}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={position}
                zoom={15}
                onLoad={handleMapLoad}
                onCenterChanged={handleMapCenterChanged}
                options={mapOptions}
              >
                {/* Fixed center pin overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="relative">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-red-500"></div>
                    
                    {!locationName && (
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                        Your order will be delivered here
                        <br />
                        Move pin to your exact location
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black border-t-opacity-80"></div>
                      </div>
                    )}
                  </div>
                </div>
              </GoogleMap>
            </LoadScript>

            {/* Use current location button */}
            <div className="absolute top-4 left-4 right-4 z-30">
              <Button
                onClick={getCurrentLocation}
                disabled={isLocating}
                variant="outline"
                className="w-full bg-white border-gray-300 text-gray-700 shadow-lg hover:bg-gray-50"
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
          <div className="bg-white border-t border-gray-200 p-4 relative z-40 flex-shrink-0 safe-area-bottom">
            <div className="space-y-4">
              <div className="text-sm text-gray-600">Delivering your order to</div>
              
              {locationName ? (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm leading-tight">{locationName}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLocationName('')
                          setSearchQuery('')
                          setLocationError('')
                        }}
                        className="text-xs px-3 py-1 h-auto"
                      >
                        Change
                      </Button>
                      {isUpdatingLocation && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Updating...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-gray-500">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Move the map to select your location</span>
                </div>
              )}

              <Button
                onClick={handleConfirmLocation}
                disabled={!locationName || isUpdatingLocation}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base"
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
        </>
      )}
    </div>
  )
}

export default DeliveryLocationPage

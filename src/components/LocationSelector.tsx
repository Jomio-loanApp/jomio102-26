
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lng: number, locationName: string) => void
  initialPosition?: [number, number]
  selectedPosition?: [number, number]
}

declare global {
  interface Window {
    google: any
    initMap: () => void
    googleMapsLoaded: boolean
  }
}

const LocationSelector = ({ onLocationSelect, initialPosition, selectedPosition }: LocationSelectorProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedPosition || initialPosition || [25.9716, 85.5946] // Darbhanga coordinates
  )
  const [isLocating, setIsLocating] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [isGettingLocationName, setIsGettingLocationName] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const isMountedRef = useRef(true)
  const scriptLoadedRef = useRef(false)

  const getLocationName = async (lat: number, lng: number) => {
    setIsGettingLocationName(true)
    try {
      console.log('Getting location name for:', lat, lng)
      
      // Try Supabase Edge Function first
      const { data, error } = await supabase.functions.invoke('get-location-name', {
        body: { latitude: lat, longitude: lng }
      })
      
      if (error) {
        console.error('Edge function error:', error)
        throw error
      }
      
      if (data?.delivery_location_name) {
        return data.delivery_location_name
      } else {
        throw new Error('No location name returned')
      }
    } catch (error) {
      console.error('Error getting location name from Edge Function:', error)
      
      // Fallback to Google Geocoding if available
      if (window.google?.maps?.Geocoder) {
        return new Promise<string>((resolve) => {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0].formatted_address)
            } else {
              resolve(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
            }
          })
        })
      } else {
        return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    } finally {
      setIsGettingLocationName(false)
    }
  }

  const handleLocationChange = async (lat: number, lng: number) => {
    if (!isMountedRef.current) return
    
    try {
      console.log('Location changed to:', lat, lng)
      setPosition([lat, lng])
      
      const name = await getLocationName(lat, lng)
      if (isMountedRef.current) {
        setLocationName(name)
        onLocationSelect(lat, lng, name)
      }
      
    } catch (error) {
      console.error('Error handling location change:', error)
      if (isMountedRef.current) {
        const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setLocationName(fallbackName)
        onLocationSelect(lat, lng, fallbackName)
      }
    }
  }

  const getCurrentLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedRef.current) return
          
          const { latitude, longitude } = position.coords
          console.log('Got current location:', latitude, longitude)
          handleLocationChange(latitude, longitude)
          
          // Update map if loaded
          if (mapInstanceRef.current && markerRef.current) {
            const newPos = { lat: latitude, lng: longitude }
            mapInstanceRef.current.setCenter(newPos)
            markerRef.current.setPosition(newPos)
          }
          
          setIsLocating(false)
        },
        (error) => {
          console.error('Error getting current location:', error)
          if (isMountedRef.current) {
            setIsLocating(false)
            alert('Unable to get your current location. Please select on the map.')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      )
    } else {
      setIsLocating(false)
      alert('Geolocation is not supported by this browser.')
    }
  }

  const handleManualAddressSubmit = () => {
    if (manualAddress.trim()) {
      const mockLocation = 'Manual Address: ' + manualAddress.trim()
      setLocationName(mockLocation)
      onLocationSelect(position[0], position[1], mockLocation)
    }
  }

  const initializeGoogleMap = () => {
    if (!window.google?.maps || !mapRef.current || mapInstanceRef.current || !isMountedRef.current) {
      console.log('Cannot initialize map:', {
        hasGoogle: !!window.google?.maps,
        hasMapRef: !!mapRef.current,
        hasMapInstance: !!mapInstanceRef.current,
        isMounted: isMountedRef.current
      })
      return
    }

    console.log('Initializing Google Map...')

    try {
      // Clear any existing content in the map container
      if (mapRef.current) {
        mapRef.current.innerHTML = ''
      }

      const mapOptions = {
        center: { lat: position[0], lng: position[1] },
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

      // Add marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat: position[0], lng: position[1] },
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Delivery Location'
      })

      // Map click event
      mapInstanceRef.current.addListener('click', (event: any) => {
        if (!isMountedRef.current) return
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        markerRef.current.setPosition({ lat, lng })
        handleLocationChange(lat, lng)
      })

      // Marker drag event
      markerRef.current.addListener('dragend', (event: any) => {
        if (!isMountedRef.current) return
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        handleLocationChange(lat, lng)
      })

      setMapLoaded(true)
      console.log('Google Map initialized successfully')
    } catch (error) {
      console.error('Error initializing Google Map:', error)
    }
  }

  const loadGoogleMapsScript = () => {
    // Prevent multiple script loads
    if (window.googleMapsLoaded || scriptLoadedRef.current) {
      console.log('Google Maps already loaded or loading')
      if (window.google?.maps) {
        setScriptsLoaded(true)
        setTimeout(initializeGoogleMap, 100)
      }
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      console.log('Google Maps script already exists in DOM')
      scriptLoadedRef.current = true
      
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps && isMountedRef.current) {
          clearInterval(checkInterval)
          window.googleMapsLoaded = true
          setScriptsLoaded(true)
          setTimeout(initializeGoogleMap, 100)
        }
      }, 100)
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkInterval), 10000)
      return
    }

    console.log('Loading Google Maps script...')
    scriptLoadedRef.current = true

    // Create callback function
    window.initMap = () => {
      console.log('Google Maps API loaded via callback')
      if (isMountedRef.current) {
        window.googleMapsLoaded = true
        setScriptsLoaded(true)
        setTimeout(initializeGoogleMap, 100)
      }
    }

    // Create and load script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBgvl_eqV5JeJBP35Rg6fMT1lXHkBgN0vI&libraries=places&callback=initMap`
    script.async = true
    script.defer = true

    script.onerror = () => {
      console.error('Failed to load Google Maps script')
      scriptLoadedRef.current = false
      if (isMountedRef.current) {
        setScriptsLoaded(false)
      }
    }

    document.head.appendChild(script)
  }

  useEffect(() => {
    isMountedRef.current = true
    
    // Check if Google Maps is already available
    if (window.google?.maps) {
      console.log('Google Maps already available')
      setScriptsLoaded(true)
      setTimeout(initializeGoogleMap, 100)
    } else {
      loadGoogleMapsScript()
    }
    
    return () => {
      console.log('LocationSelector cleanup')
      isMountedRef.current = false
      
      // Clear references without touching DOM
      mapInstanceRef.current = null
      markerRef.current = null
      
      // Clear the map container content to prevent React from trying to manage Google Maps DOM
      if (mapRef.current) {
        // Use setTimeout to ensure this runs after React's cleanup
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.innerHTML = ''
          }
        }, 0)
      }
    }
  }, [])

  // Update map when position changes externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && selectedPosition && isMountedRef.current) {
      const newPos = { lat: selectedPosition[0], lng: selectedPosition[1] }
      mapInstanceRef.current.setCenter(newPos)
      markerRef.current.setPosition(newPos)
      setPosition(selectedPosition)
      handleLocationChange(selectedPosition[0], selectedPosition[1])
    }
  }, [selectedPosition])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <Button
          onClick={getCurrentLocation}
          disabled={isLocating}
          variant="outline"
          className="flex-1"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Use Current Location
        </Button>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          Click or drag marker on map
        </div>
      </div>

      {/* Google Map container with explicit height */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-[50vh] min-h-[300px] w-full rounded-lg overflow-hidden border bg-gray-100 z-10"
          style={{ isolation: 'isolate' }}
        >
          {/* Loading overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Location name loading overlay */}
        {isGettingLocationName && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30 rounded-lg">
            <div className="bg-white p-3 rounded-lg flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Getting location...</span>
            </div>
          </div>
        )}
      </div>

      {locationName && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Selected Location:</strong> {locationName}
          </p>
        </div>
      )}

      {/* Manual address input as fallback */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Or enter your delivery address manually:
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter your full address..."
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button 
            onClick={handleManualAddressSubmit}
            disabled={!manualAddress.trim()}
            size="sm"
          >
            Use Address
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LocationSelector

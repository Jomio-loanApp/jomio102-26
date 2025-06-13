
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lng: number, locationName: string) => void
  initialPosition?: [number, number]
  selectedPosition?: [number, number]
}

const LocationSelector = ({ onLocationSelect, initialPosition, selectedPosition }: LocationSelectorProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedPosition || initialPosition || [12.9716, 77.5946]
  )
  const [isLocating, setIsLocating] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [isGettingLocationName, setIsGettingLocationName] = useState(false)
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)

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
      
      // Fallback to direct geocoding if available
      if (window.google?.maps?.Geocoder) {
        return new Promise<string>((resolve) => {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
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
    try {
      console.log('Location changed to:', lat, lng)
      setPosition([lat, lng])
      
      const name = await getLocationName(lat, lng)
      setLocationName(name)
      onLocationSelect(lat, lng, name)
      
    } catch (error) {
      console.error('Error handling location change:', error)
      const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setLocationName(fallbackName)
      onLocationSelect(lat, lng, fallbackName)
    }
  }

  const getCurrentLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Got current location:', latitude, longitude)
          handleLocationChange(latitude, longitude)
          setIsLocating(false)
        },
        (error) => {
          console.error('Error getting current location:', error)
          setIsLocating(false)
          alert('Unable to get your current location. Please enter your address manually.')
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

  // Initialize simple map when component mounts
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const L = await import('leaflet')
        await import('leaflet/dist/leaflet.css')

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current).setView(position, 15)

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstanceRef.current)

          const marker = L.marker(position).addTo(mapInstanceRef.current)

          mapInstanceRef.current.on('click', (e: any) => {
            const { lat, lng } = e.latlng
            marker.setLatLng([lat, lng])
            handleLocationChange(lat, lng)
          })
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initializeMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update map when position changes externally
  useEffect(() => {
    if (mapInstanceRef.current && selectedPosition) {
      setPosition(selectedPosition)
      mapInstanceRef.current.setView(selectedPosition, 15)
      handleLocationChange(selectedPosition[0], selectedPosition[1])
    }
  }, [selectedPosition])

  return (
    <div className="space-y-4">
      <div className="flex space-x-3">
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
        <div className="flex-1 flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          Or click on the map below
        </div>
      </div>

      {/* Map container */}
      <div 
        ref={mapRef}
        className="h-64 md:h-80 rounded-lg overflow-hidden border bg-gray-100 relative"
        style={{ minHeight: '256px' }}
      >
        {/* Loading overlay */}
        {isGettingLocationName && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-3 rounded-lg flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Getting location...</span>
            </div>
          </div>
        )}
        
        {/* Fallback content while map loads */}
        <div className="h-full flex items-center justify-center text-center text-gray-500">
          <div>
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Loading interactive map...</p>
            <p className="text-xs">Click anywhere on the map to select location</p>
          </div>
        </div>
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

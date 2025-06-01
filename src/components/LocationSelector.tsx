
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lng: number, locationName: string) => void
  initialPosition?: [number, number]
  selectedPosition?: [number, number]
}

const LocationSelector = ({ onLocationSelect, initialPosition, selectedPosition }: LocationSelectorProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedPosition || initialPosition || [12.9716, 77.5946] // Bangalore as default
  )
  const [isLocating, setIsLocating] = useState(false)
  const [locationName, setLocationName] = useState('')

  const handleLocationChange = async (lat: number, lng: number) => {
    try {
      // Mock location name derivation since get-location-name function doesn't exist yet
      const mockLocationName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setLocationName(mockLocationName)
      onLocationSelect(lat, lng, mockLocationName)
      
      // TODO: Replace with actual Edge Function call when available
      // const { data, error } = await supabase.functions.invoke('get-location-name', {
      //   body: { latitude: lat, longitude: lng }
      // })
      // if (!error && data?.location_name) {
      //   setLocationName(data.location_name)
      //   onLocationSelect(lat, lng, data.location_name)
      // }
    } catch (error) {
      console.error('Error getting location name:', error)
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
          setPosition([latitude, longitude])
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
          maximumAge: 300000, // 5 minutes
        }
      )
    } else {
      setIsLocating(false)
      alert('Geolocation is not supported by this browser.')
    }
  }

  useEffect(() => {
    if (selectedPosition) {
      setPosition(selectedPosition)
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
          Or enter address below
        </div>
      </div>

      {/* Simplified map placeholder - removing complex react-leaflet to avoid context errors */}
      <div className="h-64 md:h-80 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">Interactive map temporarily unavailable</p>
          <p className="text-xs">Use "Current Location" button or enter address manually</p>
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
        <input
          type="text"
          placeholder="Enter your full address..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          onBlur={(e) => {
            if (e.target.value.trim()) {
              const mockLocation = 'Manual Address: ' + e.target.value.trim()
              setLocationName(mockLocation)
              // Use default coordinates for manual address - in real app this would be geocoded
              onLocationSelect(position[0], position[1], mockLocation)
            }
          }}
        />
      </div>
    </div>
  )
}

export default LocationSelector

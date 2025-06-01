
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        handleLocationChange(lat, lng)
      },
    })

    return <Marker position={position} />
  }

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
          alert('Unable to get your current location. Please select a location on the map.')
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
          Or click on the map
        </div>
      </div>

      <div className="h-64 md:h-80 rounded-lg overflow-hidden border">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>

      {locationName && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Selected Location:</strong> {locationName}
          </p>
        </div>
      )}
    </div>
  )
}

export default LocationSelector

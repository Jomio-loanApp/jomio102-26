
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin, Navigation, ArrowLeft } from 'lucide-react'
import { LoadScript, GoogleMap } from '@react-google-maps/api'

// Basic default values
const defaultCenter = { lat: 12.9716, lng: 77.5946 }
const mapContainerStyle = { width: '100%', height: '360px', border: '2px solid #AAAAAA', borderRadius: '10px', margin: '20px 0' }

const GOOGLE_MAPS_API_KEY = "AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q"

const DeliveryLocationPage = () => {
  const navigate = useNavigate()
  const [center, setCenter] = useState(defaultCenter)
  const [locationName, setLocationName] = useState('')
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  // Called when user clicks use current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setCenter({ lat: coords.latitude, lng: coords.longitude })
        },
        (error) => {
          setMapError('Location permission denied or unavailable.')
        }
      )
    } else {
      setMapError('Geolocation not supported on this browser.')
    }
  }

  // Map load success
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsLoadingMap(false)
    setMapError(null)
    console.log("Google Map loaded:", map)
  }, [])

  // Map error
  const handleMapError = (err: any) => {
    setIsLoadingMap(false)
    setMapError(
      typeof err === "string" ? err : (
        err?.message || "Failed to load Google Map. Check API key/network."
      )
    )
  }

  // Confirm action (stub for the confirm button)
  const handleConfirm = () => {
    alert("Confirm Location: " + JSON.stringify(center))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">
            Add address
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b">
        <Input placeholder="Search location (not implemented)" disabled className="bg-gray-100" />
      </div>

      {/* Use current location button  */}
      <div className="p-4">
        <Button
          onClick={getCurrentLocation}
          variant="outline"
          className="w-full bg-white border-gray-300 text-gray-700"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Use current location
        </Button>
      </div>

      {/* Map area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Loading */}
        {isLoadingMap && !mapError && (
          <div className="flex items-center gap-2 py-10">
            <Loader2 className="animate-spin w-7 h-7 text-green-700" /> <span className="text-gray-600">Loading map...</span>
          </div>
        )}
        {/* Map errors */}
        {mapError && (
          <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-5 rounded w-full max-w-md mt-4 text-center">
            <b>Map Load Error:</b> {mapError}
            <div className="text-xs text-red-700 mt-2">If you still have issues:<br/>
              - Confirm your API key is correct (current: <code>{GOOGLE_MAPS_API_KEY}</code>).<br/>
              - Check Maps JavaScript API and Places API are enabled for your Google Cloud project.<br/>
              - Billing must be enabled.<br/>
              - Try disabling browser extensions and disabling adblockers.<br/>
              - Open devtools for network errors.<br/>
            </div>
          </div>
        )}
        {/* The map itself */}
        {!mapError && (
          <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API_KEY}
            onLoad={() => setMapError(null)}
            onError={handleMapError}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              onLoad={handleMapLoad}
              onUnmount={() => { mapRef.current = null }}
              options={{
                disableDefaultUI: false,
                streetViewControl: false,
                fullscreenControl: false
              }}
            />
          </LoadScript>
        )}
      </div>

      {/* Confirm and location info (bottom) */}
      <div className="border-t p-4 bg-white">
        <div className="text-sm text-gray-600 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-2"/> Move the map to select your location</div>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          onClick={handleConfirm}
        >
          Confirm Location & Proceed
        </Button>
      </div>
    </div>
  )
}

export default DeliveryLocationPage

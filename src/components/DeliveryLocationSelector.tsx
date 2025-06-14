
import React, { useCallback, useRef, useState } from "react"
import { GoogleMap, LoadScript, StandaloneSearchBox } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Locate, ArrowDown, ArrowUp } from "lucide-react"
import CrosshairIcon from "./CrosshairIcon"
import { useLocationStore } from "@/stores/locationStore"
import { useNavigate } from "react-router-dom"

const GOOGLE_MAPS_API_KEY = "AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q"
const defaultCenter = { lat: 12.9716, lng: 77.5946 }

const mapContainerStyle = { width: '100%', height: '340px', borderRadius: '14px', border: '2px solid #aaa' }
const mobileMapMin = 200
const mobileMapMax = 480

const DeliveryLocationSelector: React.FC = () => {
  const navigate = useNavigate()
  const [map, setMap] = useState<google.maps.Map|null>(null)
  const [center, setCenter] = useState(defaultCenter)
  const [mapHeight, setMapHeight] = useState(340)
  const [dragging, setDragging] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox|null>(null)
  const [address, setAddress] = useState<string>("")
  const [isLoadingPlace, setIsLoadingPlace] = useState(false)
  const { setDeliveryLocation } = useLocationStore()

  // Ref for input + search box
  const inputRef = useRef<HTMLInputElement|null>(null)
  const mapDivRef = useRef<HTMLDivElement|null>(null)
  const handleMapLoad = useCallback((mapObj: google.maps.Map) => {
    setMap(mapObj)
  }, [])

  // Pin address finder
  const getAddress = useCallback(async (lat: number, lng: number) => {
    setIsLoadingPlace(true)
    try {
      const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`)
      const data = await resp.json()
      if (data?.results?.[0]?.formatted_address) {
        setAddress(data.results[0].formatted_address)
      } else {
        setAddress("Unnamed location")
      }
    } catch(e) {
      setAddress("Failed to fetch address")
    }
    setIsLoadingPlace(false)
  }, [])

  // Center changes: get address
  React.useEffect(() => {
    getAddress(center.lat, center.lng)
  }, [center.lat, center.lng, getAddress])

  // Use current device location to center map
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setCenter({ lat: coords.latitude, lng: coords.longitude })
        }, 
        () => {
          alert("Couldn't fetch current location. Check device and permissions.")
        }
      )
    } else {
      alert("Geolocation not supported on this device.")
    }
  }

  // Map drag/resize handling (slide up/down on mobile)
  const handleDragStart = (event: React.TouchEvent|React.MouseEvent) => {
    setDragging(true)
  }
  const handleDragEnd = (event: React.TouchEvent|React.MouseEvent) => {
    setDragging(false)
  }
  const handleDrag = (event: React.TouchEvent|React.MouseEvent) => {
    if (!dragging) return
    let clientY = 0
    if ('touches' in event) {
      clientY = event.touches[0].clientY
    } else {
      clientY = event.clientY
    }
    if (!mapDivRef.current) return
    const top = mapDivRef.current.getBoundingClientRect().top
    let height = Math.max(mobileMapMin, Math.min(mobileMapMax, window.innerHeight - top - 120))
    setMapHeight(height)
  }

  // Search box logic
  const onSBLoad = (sb: google.maps.places.SearchBox) => setSearchBox(sb)
  const onPlacesChanged = () => {
    const places = searchBox?.getPlaces?.()
    if (places && places.length > 0 && places[0].geometry?.location) {
      const loc = places[0].geometry.location
      setCenter({ lat: loc.lat(), lng: loc.lng() })
      setSearchText(places[0].formatted_address || "")
    }
  }

  // Confirm: Save to store and proceed
  const handleConfirm = () => {
    setDeliveryLocation(center.lat, center.lng, address)
    // Go to next step/page (implement: route as needed)
    navigate("/checkout")
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-2 mb-6 bg-white shadow rounded-lg">
      {/* Search */}
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        <div className="p-4 border-b flex gap-2 items-center">
          <StandaloneSearchBox
            onLoad={onSBLoad}
            onPlacesChanged={onPlacesChanged}
          >
            <Input
              ref={inputRef}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search for a location"
              className="bg-gray-100 flex-1"
              autoComplete="off"
            />
          </StandaloneSearchBox>
        </div>

        <div className="relative w-full" ref={mapDivRef}
             style={{touchAction: dragging ? "none" : "auto"}}
             onTouchStart={handleDragStart}
             onTouchEnd={handleDragEnd}
             onTouchMove={handleDrag}
             onMouseDown={handleDragStart}
             onMouseUp={handleDragEnd}
             onMouseMove={handleDrag}
        >
          {/* Slide Drag Handle */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <div className="h-2 w-16 bg-gray-300 rounded-full shadow mb-1" />
          </div>
          {/* Google Map */}
          <GoogleMap
            mapContainerStyle={{ ...mapContainerStyle, height: `${mapHeight}px` }}
            center={center}
            zoom={16}
            onLoad={handleMapLoad}
            onDragEnd={() => {
              if (map) {
                const c = map.getCenter()
                setCenter({ lat: c?.lat() || center.lat, lng: c?.lng() || center.lng })
              }
            }}
            options={{
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
              clickableIcons: false,
            }}
          >
            {/* No dynamic marker, but a static pin is overlayed with CSS */}
          </GoogleMap>
          {/* Pinned icon overlay (center, interactive) */}
          <CrosshairIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-green-600 w-12 h-12 shadow-lg drop-shadow-xl z-10" />
        </div>

        {/* Use current location button */}
        <div className="p-4 pt-3 flex gap-2 items-center">
          <Button 
            variant="outline"
            className="w-full border-gray-300 flex items-center gap-2"
            onClick={handleUseCurrentLocation}
            type="button"
          >
            <Locate className="w-4 h-4" /> Use my current location
          </Button>
        </div>
        {/* Selected position/address info */}
        <div className="px-4 pb-3">
          <div className="text-xs text-gray-500 mb-1">Location selected:</div>
          <div className="font-medium text-gray-800 mb-0.5">{isLoadingPlace ? "Fetching address..." : address}</div>
          <div className="text-xs text-gray-400">{center.lat.toFixed(6)}, {center.lng.toFixed(6)}</div>
        </div>
        {/* Confirm button */}
        <div className="px-4 pb-5">
          <Button
            onClick={handleConfirm}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-base"
            size="lg"
            type="button"
          >
            <MapPin className="mr-2 w-5 h-5" />
            Confirm location & proceed
          </Button>
        </div>
      </LoadScript>
    </div>
  )
}

export default DeliveryLocationSelector

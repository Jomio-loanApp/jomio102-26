
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation } from "lucide-react";

interface GoogleMapSelectorProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q";

const loadGoogleMaps = (callback: () => void) => {
  // Do not load the script twice
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const scriptId = "google-maps-script";
  if (document.getElementById(scriptId)) {
    (window as any).initMapCallback = callback;
    return;
  }

  (window as any).initMapCallback = callback;
  const script = document.createElement("script");
  script.id = scriptId;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMapCallback`;
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
};

const GoogleMapSelector: React.FC<GoogleMapSelectorProps> = ({
  onLocationSelected,
  initialLat = 25.9716,
  initialLng = 85.5946
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [address, setAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapRef.current) return;

      // @ts-ignore
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        // FIXED: Enable single-finger pan on mobile
        gestureHandling: 'greedy', // This allows single-finger pan
        clickableIcons: false,
      });

      // Add search box
      if (autocompleteRef.current) {
        // @ts-ignore
        const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current);
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            mapInstanceRef.current.setCenter({ lat, lng });
            handlePositionChange(lat, lng);
          }
        });
      }

      let timeout: NodeJS.Timeout;

      // FIXED: Use center of map for "fixed pin" interaction
      mapInstanceRef.current.addListener("idle", () => {
        clearTimeout(timeout);
        // Debounce to avoid too-rapid API calls
        timeout = setTimeout(() => {
          const center = mapInstanceRef.current.getCenter();
          if (center) {
            const lat = center.lat();
            const lng = center.lng();
            handlePositionChange(lat, lng);
          }
        }, 250);
      });

      // Initial address lookup
      handlePositionChange(initialLat, initialLng);
      setIsReady(true);
    });

    // Cleanup on unmount
    return () => {
      setIsReady(false);
    };
    // eslint-disable-next-line
  }, []);

  const handlePositionChange = async (lat: number, lng: number) => {
    // Reverse geocode
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === "OK" && results && results[0]) {
          setAddress(results[0].formatted_address);
          onLocationSelected(lat, lng, results[0].formatted_address);
        } else {
          setAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
          onLocationSelected(lat, lng, `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        }
      });
    }
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (res) => {
        const lat = res.coords.latitude;
        const lng = res.coords.longitude;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
        }
        handlePositionChange(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Could not access your location.");
      }
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Search and Controls - positioned at top */}
      <div className="absolute top-4 left-4 right-4 z-20 bg-white rounded-lg shadow-lg p-3 space-y-3">
        <div className="flex flex-col space-y-2">
          <input
            ref={autocompleteRef}
            placeholder="Search for a place…"
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 text-base"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
          <Button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isLocating ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 w-4 h-4" />
            )}
            Use Current Location
          </Button>
        </div>
        
        {address && (
          <div className="bg-green-50 px-3 py-2 rounded text-green-900 text-sm border border-green-200">
            <b>Selected:</b> {address}
          </div>
        )}
      </div>

      {/* FIXED: Map container with relative positioning for fixed pin */}
      <div className="relative h-full w-full">
        {/* Actual map */}
        <div ref={mapRef} className="h-full w-full" />
        
        {/* FIXED: Static centered pin that doesn't move */}
        {isReady && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
            <MapPin className="text-red-600 w-8 h-8 drop-shadow-lg" fill="currentColor" />
          </div>
        )}
        
        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-30">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleMapSelector;

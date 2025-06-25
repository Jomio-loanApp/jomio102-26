
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface GoogleMapSelectorProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q";

const loadGoogleMaps = (callback: () => void) => {
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
  initialLng = 85.5946,
  searchQuery = "",
  onSearchQueryChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [address, setAddress] = useState("");
  const mapInstanceRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapRef.current) return;

      // Initialize map with single-finger pan enabled
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy', // Enable single-finger pan
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Set up search autocomplete if search input exists
      if (searchInputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            fields: ['geometry', 'formatted_address', 'name'],
          }
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(16);
            handlePositionChange(lat, lng);
          }
        });
      }

      let debounceTimeout: NodeJS.Timeout;

      // Use map idle event for "fixed pin" interaction
      mapInstanceRef.current.addListener("idle", () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          const center = mapInstanceRef.current.getCenter();
          if (center) {
            const lat = center.lat();
            const lng = center.lng();
            handlePositionChange(lat, lng);
          }
        }, 300);
      });

      // Initial address lookup
      handlePositionChange(initialLat, initialLng);
      setIsReady(true);
    });

    return () => {
      setIsReady(false);
    };
  }, []);

  // Handle external search query changes
  useEffect(() => {
    if (searchInputRef.current && searchQuery !== searchInputRef.current.value) {
      searchInputRef.current.value = searchQuery;
    }
  }, [searchQuery]);

  const handlePositionChange = async (lat: number, lng: number) => {
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === "OK" && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setAddress(formattedAddress);
          onLocationSelected(lat, lng, formattedAddress);
        } else {
          const fallbackAddress = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
          setAddress(fallbackAddress);
          onLocationSelected(lat, lng, fallbackAddress);
        }
      });
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Hidden search input for autocomplete */}
      <input
        ref={searchInputRef}
        type="text"
        onChange={handleSearchInputChange}
        className="absolute -top-10 left-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full relative">
        {/* Fixed Pin in Center */}
        {isReady && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
            <div className="relative">
              <MapPin className="text-red-600 w-8 h-8 drop-shadow-lg" fill="currentColor" />
              {/* Pulsing dot at pin base */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
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

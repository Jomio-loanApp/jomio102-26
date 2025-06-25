
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

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        let debounceTimeout: NodeJS.Timeout;

        map.addListener("idle", () => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            const center = map.getCenter();
            if (center) {
              const lat = center.lat();
              const lng = center.lng();
              handlePositionChange(lat, lng);
            }
          }, 300);
        });

        handlePositionChange(initialLat, initialLng);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setIsReady(false);
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.onload = initMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setIsReady(false);
      };
      document.head.appendChild(script);
    }

    return () => {
      setIsReady(false);
    };
  }, []);

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

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full relative">
        {/* Fixed Pin in Center */}
        {isReady && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
            <div className="relative">
              <MapPin className="text-red-600 w-8 h-8 drop-shadow-lg" fill="currentColor" />
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

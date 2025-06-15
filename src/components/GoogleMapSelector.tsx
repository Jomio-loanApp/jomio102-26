
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";

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
  const [markerLat, setMarkerLat] = useState(initialLat);
  const [markerLng, setMarkerLng] = useState(initialLng);
  const [address, setAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const autocompleteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapRef.current) return;

      // @ts-ignore
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
      });

      // Create one marker, hidden (we will use pin overlay instead)
      // Add search box
      if (autocompleteRef.current) {
        // @ts-ignore
        const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current);
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.setCenter({ lat, lng });
            handlePositionChange(lat, lng);
          }
        });
      }

      let timeout: NodeJS.Timeout;

      // Center pin: use the center of the map, not a marker
      map.addListener("idle", () => {
        clearTimeout(timeout);
        // Debounce to avoid too-rapid API calls.
        timeout = setTimeout(() => {
          const center = map.getCenter();
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

    // Cleanup on unmount.
    return () => {
      setIsReady(false);
    };
    // eslint-disable-next-line
  }, []);

  const handlePositionChange = async (lat: number, lng: number) => {
    setMarkerLat(lat);
    setMarkerLng(lng);

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
        setMarkerLat(lat);
        setMarkerLng(lng);
        if (window.google && window.google.maps && mapRef.current) {
          // @ts-ignore
          const map = new window.google.maps.Map(mapRef.current);
          map.setCenter({ lat, lng });
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
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <input
          ref={autocompleteRef}
          placeholder="Search for a place…"
          className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 text-base"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
        />
        <Button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          type="button"
          variant="outline"
        >
          {isLocating ? <Loader2 className="mr-1 w-4 h-4 animate-spin" /> : <span className="mr-1">📍</span>}
          Use Current Location
        </Button>
      </div>
      <div className="relative rounded-md overflow-hidden border h-[380px]">
        {/* Actual map */}
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        {/* Fixed pin on map center */}
        {isReady && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-10">
            <MapPin className="text-green-700 w-10 h-10 drop-shadow-lg" fill="currentColor" />
          </div>
        )}
      </div>
      <div className="bg-green-50 px-4 py-2 rounded text-green-900 text-sm border border-green-200 shadow-sm">
        <b>Selected:</b> {address || "Move map to pick location"}
      </div>
    </div>
  );
};

export default GoogleMapSelector;

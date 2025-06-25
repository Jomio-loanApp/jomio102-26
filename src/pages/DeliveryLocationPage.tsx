
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useLocationStore } from "@/stores/locationStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { Navigation, MapPin, AlertCircle } from "lucide-react";

const DeliveryLocationPage = () => {
  const navigate = useNavigate();
  const setDeliveryLocation = useLocationStore((state) => state.setDeliveryLocation);
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addressNickname, setAddressNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setHasLocationPermission(result.state === 'granted');
      }).catch(() => {
        setHasLocationPermission(false);
      });
    } else {
      setHasLocationPermission(false);
    }
  }, []);

  useEffect(() => {
    // Initialize map with a simple implementation
    const initMap = () => {
      const mapElement = document.getElementById('simple-map');
      if (!mapElement || !window.google) return;

      try {
        const map = new window.google.maps.Map(mapElement, {
          center: { lat: 25.9716, lng: 85.5946 },
          zoom: 16,
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        map.addListener('idle', () => {
          const center = map.getCenter();
          if (center) {
            const lat = center.lat();
            const lng = center.lng();
            setSelected({ 
              lat, 
              lng, 
              address: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}` 
            });
          }
        });

        setMapLoaded(true);
      } catch (error) {
        console.error('Map initialization error:', error);
        setMapLoaded(false);
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDUMzd5GLeuk4sQ85HhxcyaJQdfZpNry_Q&libraries=places`;
      script.onload = initMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setMapLoaded(false);
      };
      document.head.appendChild(script);
    }
  }, []);

  const showNicknameField = !!user;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelected({ 
          lat: latitude, 
          lng: longitude, 
          address: `Current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
        });
        setHasLocationPermission(true);
        
        // Update map center if loaded
        const mapElement = document.getElementById('simple-map');
        if (mapElement && window.google) {
          const map = new window.google.maps.Map(mapElement);
          map.setCenter({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setHasLocationPermission(false);
        toast({
          title: "Location access denied",
          description: "Please enable location access or select a location on the map.",
          variant: "destructive",
        });
      }
    );
  };

  const handleConfirm = async () => {
    setNicknameError(null);

    if (!selected) {
      toast({
        title: "Please select a location.",
        variant: "destructive",
      });
      return;
    }

    if (showNicknameField && !addressNickname.trim()) {
      setNicknameError("Please provide a nickname for this address (e.g. Home, Work).");
      return;
    }

    setDeliveryLocation(selected.lat, selected.lng, selected.address);

    if (user && selected) {
      setIsSaving(true);
      try {
        const { error } = await supabase.from("addresses").insert([
          {
            profile_id: user.id,
            address_nickname: addressNickname.trim(),
            latitude: selected.lat,
            longitude: selected.lng,
            location_name: selected.address,
            is_default: false,
          },
        ]);
        if (error) {
          toast({
            title: "Could not save address",
            description: "We'll still use this location for your order.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Address Saved!",
            description: "You can now reuse this address in future orders.",
            variant: "default",
          });
        }
      } catch (err) {
        toast({
          title: "Address save error",
          description: "We'll still use this location, but it was not saved.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: "Location Confirmed!",
        description: selected.address,
        variant: "default",
      });
    }
    navigate("/checkout");
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header showSearch={false} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Controls Section */}
        <div className="flex-shrink-0 bg-white border-b p-4 space-y-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-center mb-3">Set Delivery Location</h1>
            
            {/* Location Permission Banner */}
            {hasLocationPermission === false && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-800">Device location not enabled</p>
                  </div>
                  <Button
                    onClick={handleGetCurrentLocation}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700"
                  >
                    Enable
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search for a place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
              
              <Button
                onClick={handleGetCurrentLocation}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Navigation className="mr-2 w-5 h-5" />
                Use Current Location
              </Button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 relative">
          <div 
            id="simple-map"
            className="w-full h-full bg-gray-200"
            style={{ minHeight: '300px' }}
          />
          
          {/* Fixed Pin */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <MapPin className="w-8 h-8 text-red-600 drop-shadow-lg" fill="currentColor" />
          </div>
          
          {/* Selected Location Display */}
          {selected && (
            <div className="absolute top-4 left-4 right-4 z-30 bg-white rounded-lg shadow-lg p-3 border border-green-200">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">Selected Location</p>
                  <p className="text-xs text-green-700 break-words">{selected.address}</p>
                </div>
              </div>
            </div>
          )}

          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Section */}
        <div className="flex-shrink-0 bg-white border-t p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {showNicknameField && (
              <div>
                <label htmlFor="address-nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  Save address as <span className="text-red-600">*</span>
                </label>
                <input
                  id="address-nickname"
                  type="text"
                  value={addressNickname}
                  onChange={(e) => setAddressNickname(e.target.value)}
                  placeholder="Home, Work, Mom's House"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  disabled={isSaving}
                />
                {nicknameError && (
                  <p className="text-xs text-red-600 mt-1">{nicknameError}</p>
                )}
              </div>
            )}
            
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              size="lg"
              onClick={handleConfirm}
              disabled={!selected || isSaving}
            >
              {isSaving ? "Saving..." : "Confirm Location & Proceed"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLocationPage;

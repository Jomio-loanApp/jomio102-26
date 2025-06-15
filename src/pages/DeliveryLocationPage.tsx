
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapSelector from "@/components/GoogleMapSelector";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useLocationStore } from "@/stores/locationStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

const DeliveryLocationPage = () => {
  const navigate = useNavigate();
  const setDeliveryLocation = useLocationStore((state) => state.setDeliveryLocation);
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addressNickname, setAddressNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Authenticated user must provide nickname; guests do not see field
  const showNicknameField = !!user;

  const handleConfirm = async () => {
    setNicknameError(null);

    if (!selected) {
      toast({
        title: "Please select a location.",
        variant: "destructive",
      });
      return;
    }

    // If user is authenticated, make sure nickname is provided
    if (showNicknameField && !addressNickname.trim()) {
      setNicknameError("Please provide a nickname for this address (e.g. Home, Work).");
      return;
    }

    // Save location to global store for downstream flow
    setDeliveryLocation(selected.lat, selected.lng, selected.address);

    // Authenticated user: Save new address
    if (user && selected) {
      setIsSaving(true);
      try {
        // Save new address to user's saved addresses table
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
          // Allow flow to continue, but toast for user
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
      // Guest mode: no address table
      toast({
        title: "Location Confirmed!",
        description: selected.address,
        variant: "default",
      });
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      <div className="max-w-2xl mx-auto my-10 px-4 pb-20">
        <h1 className="text-2xl font-bold mb-1 text-center">Set Delivery Location</h1>
        <p className="text-center mb-4 text-gray-600">
          Search for your address, use your current location, or move the map pin.
        </p>
        <div className="rounded-xl border bg-white shadow p-4">
          <h2 className="font-semibold text-lg flex items-center mb-2 gap-2">
            <span className="inline-block">📍</span> Choose Location
          </h2>
          <GoogleMapSelector
            onLocationSelected={(lat, lng, address) => setSelected({ lat, lng, address })}
          />
          {/* Authenticated user input: Save address as */}
          {showNicknameField && (
            <div className="mt-4">
              <label htmlFor="address-nickname" className="block text-sm font-medium text-gray-700">
                Save address as <span className="text-red-600">*</span>
              </label>
              <input
                id="address-nickname"
                required
                type="text"
                minLength={2}
                value={addressNickname}
                onChange={(e) => setAddressNickname(e.target.value)}
                placeholder="Home, Work, Mom's House"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600"
                disabled={isSaving}
              />
              {nicknameError && (
                <div className="text-xs text-red-600 mt-1">{nicknameError}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">Help yourself remember: Give addresses a friendly label for future orders.</div>
            </div>
          )}
        </div>
        <Button
          className="w-full mt-6 text-base"
          size="lg"
          onClick={handleConfirm}
          disabled={!selected || isSaving}
        >
          {isSaving ? "Saving..." : "Confirm Location & Proceed"}
        </Button>
      </div>
    </div>
  );
};

export default DeliveryLocationPage;


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
  const setDeliveryLocation = useLocationStore(state => state.setDeliveryLocation);
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) {
      toast({
        title: "Please select a location.",
        variant: "destructive",
      });
      return;
    }

    // Save location to global store
    setDeliveryLocation(selected.lat, selected.lng, selected.address);

    // Authenticated user: Save new address
    if (user && selected) {
      setIsSaving(true);
      try {
        // Save new address to user's saved addresses table
        const { error } = await supabase.from("addresses").insert([{
          profile_id: user.id,
          address_nickname: "Saved Location " + new Date().toLocaleTimeString(),
          latitude: selected.lat,
          longitude: selected.lng,
          location_name: selected.address,
          is_default: false
        }]);
        if (error) {
          throw error;
        }
        toast({
          title: "Address Saved!",
          description: "You can re-use this location next time.",
          variant: "default",
        });
      } catch (err) {
        toast({
          title: "Error saving address",
          description: "Could not save, but you can proceed with this location.",
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
        </div>
        <Button
          className="w-full mt-6 text-base"
          size="lg"
          onClick={handleConfirm}
          loading={isSaving}
          disabled={!selected || isSaving}
        >
          {isSaving ? "Saving..." : "Confirm Location & Proceed"}
        </Button>
      </div>
    </div>
  );
};

export default DeliveryLocationPage;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapSelector from "@/components/GoogleMapSelector";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useLocationStore } from "@/stores/locationStore";

const DeliveryLocationPage = () => {
  const navigate = useNavigate();
  const setDeliveryLocation = useLocationStore(state => state.setDeliveryLocation);
  const [selected, setSelected] = useState<{lat: number, lng: number, address: string} | null>(null);

  const handleConfirm = () => {
    if (!selected) {
      toast({
        title: "Please select a location.",
        variant: "destructive",
      });
      return;
    }
    // This will save the selected location in global location store (Zustand)
    setDeliveryLocation(selected.lat, selected.lng, selected.address);
    toast({
      title: "Location Confirmed!",
      description: selected.address,
      variant: "default",
    });
    navigate("/checkout"); // now go to checkout
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
          disabled={!selected}
        >
          Confirm Location & Proceed
        </Button>
      </div>
    </div>
  );
};

export default DeliveryLocationPage;

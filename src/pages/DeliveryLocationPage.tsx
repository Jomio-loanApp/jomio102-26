
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapSelector from "@/components/GoogleMapSelector";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const DeliveryLocationPage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<{lat: number, lng: number, address: string} | null>(null);

  const handleConfirm = () => {
    if (!selected) {
      toast({
        title: "Please select a location.",
        variant: "destructive",
      });
      return;
    }
    // Save the selected location to the store or pass to checkout as needed
    toast({
      title: "Location Confirmed!",
      description: selected.address,
      variant: "default",
    });
    // Proceed to next checkout page
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
          disabled={!selected}
        >
          Confirm Location & Proceed
        </Button>
      </div>
    </div>
  );
};

export default DeliveryLocationPage;

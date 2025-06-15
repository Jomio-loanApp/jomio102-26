import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Order Placed Successfully!</CardTitle>
            <p className="text-gray-600 mt-2">
              Thank you! Your order has been placed successfully.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">#{orderId}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-2 mt-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">Check order status in Order History at any time.</span>
            </div>
            <div className="space-y-3 mt-6">
              <Button onClick={() => navigate("/profile/orders")} className="w-full" variant="outline">
                View Orders
              </Button>
              <Button onClick={() => navigate("/")} className="w-full">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default OrderConfirmationPage;


import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-green-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-700 text-center">
          Thank you! Your order has been placed successfully.
        </h2>
        <p className="text-lg text-gray-700 text-center">
          Your Order ID is: <span className="font-semibold text-gray-900">#{orderId}</span>
        </p>
        <Button
          className="w-full mt-2"
          onClick={() => navigate("/")}
          variant="default"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;

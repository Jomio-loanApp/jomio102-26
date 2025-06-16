
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Receipt } from "lucide-react";

const PAGE_SIZE = 10;

const OrderHistoryPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchOrders(1, true);
  }, [user]);

  const fetchOrders = async (pageNum: number, replace: boolean = false) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data, error } = await supabase
        .from("orders")
        .select("id, ordered_at, status, total_amount")
        .eq("customer_profile_id", user?.id)
        .order("ordered_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (replace) {
        setOrders(data || []);
      } else {
        setOrders((prev) => [...prev, ...(data || [])]);
      }
      setHasMore((data && data.length === PAGE_SIZE) ?? false);
      setPage(pageNum);
    } catch (err: any) {
      setFetchError("Could not load your order history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchOrders(page + 1);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold mb-2">Order History</h1>
        <p className="mb-6 text-gray-600">See your recent orders</p>
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : fetchError ? (
          <Card className="p-6 text-center">
            <Receipt className="mx-auto w-8 h-8 text-gray-300 mb-2" />
            <p className="text-red-600">{fetchError}</p>
            <Button variant="default" className="mt-3 mx-auto" onClick={() => fetchOrders(1, true)}>
              Retry
            </Button>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-6 text-center">
            <Receipt className="mx-auto w-8 h-8 text-gray-300 mb-2" />
            <p className="font-semibold text-gray-700 mb-1">No orders yet.</p>
            <p className="text-gray-500 mb-4">Place your first order to see it here!</p>
            <Button className="mx-auto" onClick={() => navigate("/")}>Start Shopping</Button>
          </Card>
        ) : (
          <>
            <ul className="space-y-4">
              {orders.map((order) => (
                <li key={order.id}>
                  <Card className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:ring-2 hover:ring-green-100"
                        onClick={() => navigate(`/order-confirmation/${order.id}`)}>
                    <div>
                      <div className="font-semibold">Order #{typeof order.id === 'string' ? order.id.slice(-6) : order.id}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(order.ordered_at)}
                      </div>
                      <div className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-bold text-lg text-green-600">₹{order.total_amount?.toFixed(2)}</div>
                      <Button size="sm" variant="ghost" className="mt-1 px-3"
                        onClick={e => { e.stopPropagation(); navigate(`/order-confirmation/${order.id}`); }}>
                        Details
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="flex justify-center py-6">
                <Button onClick={handleLoadMore} variant="outline" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "placed":
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "preparing":
    case "ready":
      return "bg-yellow-100 text-yellow-800";
    case "out_for_delivery":
      return "bg-purple-100 text-purple-800";
    case "delivered":
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default OrderHistoryPage;

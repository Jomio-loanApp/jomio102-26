
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Receipt, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface Order {
  order_id: number
  ordered_at: string
  status: string
  total_amount: number
}

const OrderHistoryPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchOrders(1, true);
  }, [user, navigate]);

  const fetchOrders = async (pageNum: number, replace: boolean = false) => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      console.log('Fetching orders for user:', user?.id, 'page:', pageNum);
      
      const { data, error, count } = await supabase
        .from("orders")
        .select("order_id, ordered_at, status, total_amount", { count: 'exact' })
        .eq("customer_profile_id", user?.id)
        .order("ordered_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Order fetch error:', error);
        throw error;
      }

      console.log('Orders fetched:', data, 'count:', count);

      if (replace) {
        setOrders(data || []);
      } else {
        setOrders((prev) => [...prev, ...(data || [])]);
      }
      
      setTotalCount(count || 0);
      setHasMore((data && data.length === PAGE_SIZE) ?? false);
      setCurrentPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setFetchError("Could not load your order history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchOrders(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      fetchOrders(currentPage - 1, true);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(currentPage + 1);
      fetchOrders(currentPage + 1, true);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
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
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="flex items-center space-x-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Order History</h1>
        </div>

        <p className="mb-6 text-gray-600">View your recent orders and track their status</p>
        
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : fetchError ? (
          <Card className="p-8 text-center">
            <Receipt className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <p className="text-red-600 font-medium mb-4">{fetchError}</p>
            <Button 
              variant="default" 
              onClick={() => fetchOrders(1, true)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Try Again
            </Button>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center">
            <Receipt className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Place your first order to see it here!</p>
            <Button onClick={() => navigate("/")}>Start Shopping</Button>
          </Card>
        ) : (
          <>
            {/* Orders List */}
            <div className="space-y-4 mb-6">
              {orders.map((order) => (
                <Card 
                  key={order.order_id} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/order-confirmation/success/${order.order_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-lg">
                          Order #{order.order_id.toString().slice(-6).toUpperCase()}
                        </h3>
                        <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Ordered on {formatDate(order.ordered_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        ₹{order.total_amount?.toFixed(2)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order-confirmation/success/${order.order_id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} orders
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Loading indicator for pagination */}
            {isLoading && orders.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

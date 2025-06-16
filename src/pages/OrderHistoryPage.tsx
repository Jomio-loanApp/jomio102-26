
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Receipt, ChevronLeft, ChevronRight, Eye } from "lucide-react";

const PAGE_SIZE = 10;

interface Order {
  order_id: number
  ordered_at: string
  status: string
  total_amount: number
  delivery_location_name: string
}

interface OrderItem {
  id: string
  product_name_at_purchase: string
  quantity: number
  price_at_purchase: number
  product_image_at_purchase: string | null
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
  
  // Order details modal states
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        .select("order_id, ordered_at, status, total_amount, delivery_location_name", { count: 'exact' })
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

  const fetchOrderItems = async (orderId: number) => {
    setIsLoadingItems(true);
    try {
      console.log('Fetching items for order:', orderId);
      
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) {
        console.error('Order items fetch error:', error);
        throw error;
      }

      console.log('Order items fetched:', data);
      setOrderItems(data || []);
    } catch (err: any) {
      console.error('Error fetching order items:', err);
      setOrderItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
    fetchOrderItems(orderId);
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
      
      {/* Desktop-constrained container */}
      <div className="w-full max-w-screen-xl mx-auto px-4 py-8 pb-20">
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
                <Card key={order.order_id} className="p-4 hover:shadow-md transition-shadow">
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
                      <p className="text-sm text-gray-600 mb-1">
                        Ordered on {formatDate(order.ordered_at)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Delivery to: {order.delivery_location_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600 mb-2">
                        ₹{order.total_amount?.toFixed(2)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(order.order_id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
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

        {/* Order Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Order Details #{selectedOrderId?.toString().slice(-6).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="ml-2">Loading order items...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items found for this order.</p>
                ) : (
                  orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product_image_at_purchase ? (
                          <img
                            src={item.product_image_at_purchase}
                            alt={item.product_name_at_purchase}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span>📦</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product_name_at_purchase}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-600">Price: ₹{item.price_at_purchase.toFixed(2)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ₹{(item.price_at_purchase * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrderHistoryPage;

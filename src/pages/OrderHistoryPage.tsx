import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Package, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price_at_purchase: number
  product_name_at_purchase: string
  product_image_at_purchase: string | null
}

interface Order {
  id: string
  ordered_at: string
  status: string
  total_amount: number
  delivery_charge: number
  items_subtotal: number
  delivery_location_name: string
  delivery_type: string
  payment_method: string
  customer_notes: string | null
  order_items?: OrderItem[]
}

const OrderHistoryPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 5

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchOrders(1)
  }, [user, navigate])

  const fetchOrders = async (pageNum: number) => {
    if (!user) return

    try {
      setIsLoading(true)
      const start = (pageNum - 1) * itemsPerPage
      const end = start + itemsPerPage - 1

      // fetch orders that belong to this user (customer_profile_id = user.id)
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items:order_items (
            id, product_id, quantity, price_at_purchase, product_name_at_purchase, product_image_at_purchase
         )`)
        .eq('customer_profile_id', user.id)
        .order('ordered_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      setOrders(pageNum === 1 ? (data || []) : prev => [...prev, ...(data || [])])
      setHasMore(data && data.length === itemsPerPage)
      setPage(pageNum)
    } catch (error) {
      setOrders([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreOrders = () => {
    fetchOrders(page + 1)
  }

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'placed':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
      case 'ready':
        return 'bg-yellow-100 text-yellow-800'
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch={false} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border">
                <div className="flex space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-600">Track and view your past orders</p>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                <Button 
                  onClick={() => navigate('/')} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <CardHeader className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base flex items-center flex-wrap gap-2">
                            <span>Order #{order.id.slice(-6)}</span>
                            <span 
                              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                          </CardTitle>
                          <p className="text-xs text-gray-500 mt-1">
                            Placed on {formatDate(order.ordered_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-green-600">
                            ₹{order.total_amount.toFixed(2)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleOrderDetails(order.id)}
                            className="p-1 h-auto"
                          >
                            <ChevronRight 
                              className={`w-5 h-5 transition-transform ${
                                expandedOrder === order.id ? 'rotate-90' : ''
                              }`} 
                            />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* Order Details (Expandable) */}
                    {expandedOrder === order.id && (
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Items</h4>
                            <div className="space-y-2">
                              {order.order_items?.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md">
                                  {item.product_image_at_purchase ? (
                                    <img
                                      src={item.product_image_at_purchase}
                                      alt={item.product_name_at_purchase}
                                      className="w-10 h-10 object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {item.product_name_at_purchase}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Quantity: {item.quantity} × ₹{item.price_at_purchase.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-sm font-semibold">
                                    ₹{(item.quantity * item.price_at_purchase).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Order Summary */}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span>₹{order.items_subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery:</span>
                              <span>₹{order.delivery_charge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-1">
                              <span>Total:</span>
                              <span className="text-green-600">₹{order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Delivery Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-1">Delivery Address</h4>
                              <p className="text-gray-600">{order.delivery_location_name}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-1">Delivery Type</h4>
                              <p className="text-gray-600">
                                {order.delivery_type.charAt(0).toUpperCase() + order.delivery_type.slice(1)} Delivery
                              </p>
                            </div>
                            {order.customer_notes && (
                              <div className="col-span-2">
                                <h4 className="font-semibold text-gray-700 mb-1">Notes</h4>
                                <p className="text-gray-600">{order.customer_notes}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Help or Reorder Button */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button variant="outline" size="sm" className="sm:ml-auto">
                              Need Help?
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Reorder
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={loadMoreOrders}
                    variant="outline"
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More Orders</span>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/profile')}
              className="text-green-600"
            >
              Back to Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderHistoryPage

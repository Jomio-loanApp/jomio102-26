
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, ChevronDown, ChevronRight, Package, Loader2, ShoppingBag } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface Order {
  id: string
  profile_id: string
  total_amount: number
  delivery_location_name: string
  status: string
  ordered_at: string
  created_at: string
  updated_at: string
}

interface OrderItem {
  id: string
  order_id: string
  product_name_at_purchase: string
  quantity: number
  price_at_purchase: number
}

const OrderHistoryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orderItems, setOrderItems] = useState<{ [key: string]: OrderItem[] }>({})
  const [loadingItems, setLoadingItems] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchOrders()
  }, [user, navigate])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log('Fetching orders for user:', user.id)
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', user.id)
        .order('ordered_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        throw error
      }

      console.log('Orders fetched:', data)
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast({
        title: "Error",
        description: "Failed to load order history. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      return // Already fetched
    }

    try {
      setLoadingItems(prev => ({ ...prev, [orderId]: true }))
      console.log('Fetching order items for order:', orderId)
      
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (error) {
        console.error('Error fetching order items:', error)
        throw error
      }

      console.log('Order items fetched:', data)
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }))
    } catch (error) {
      console.error('Failed to fetch order items:', error)
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive"
      })
    } finally {
      setLoadingItems(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleToggleOrderDetails = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
      await fetchOrderItems(orderId)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-orange-100 text-orange-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Order History</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-5 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">When you place orders, they'll appear here.</p>
                  <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Summary */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(order.ordered_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <div>
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleOrderDetails(order.id)}
                                  className="flex items-center space-x-1"
                                >
                                  <span>See Details</span>
                                  {expandedOrder === order.id ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </Collapsible>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {expandedOrder === order.id && (
                      <div className="border-t bg-gray-50">
                        <div className="p-6 space-y-6">
                          {/* Order Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                              <p className="text-sm text-gray-600">{order.delivery_location_name}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Order Status</h4>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Items Ordered
                            </h4>
                            
                            {loadingItems[order.id] ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-600">Loading items...</span>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {orderItems[order.id]?.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{item.product_name_at_purchase}</h5>
                                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-gray-900">
                                        {formatCurrency(item.price_at_purchase)}
                                      </p>
                                      <p className="text-xs text-gray-600">per item</p>
                                    </div>
                                  </div>
                                )) || (
                                  <p className="text-center text-gray-600 py-4">No items found for this order.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistoryPage

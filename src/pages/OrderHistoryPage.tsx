
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, ShoppingBag, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

interface Order {
  order_id: string
  ordered_at: string
  status: string
  total_amount: number
  delivery_type: string
  delivery_location_name?: string
}

interface OrderItem {
  product_name_at_purchase: string
  quantity: number
  price_at_purchase: number
}

const OrderHistoryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!user) {
      navigate('/profile')
      return
    }
    fetchOrders()
  }, [user, navigate])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching orders for user:', user?.id)
      
      // FIXED QUERY: Using correct columns as per Backend Schema
      const { data, error } = await supabase
        .from('orders')
        .select('order_id, ordered_at, status, total_amount, delivery_type, delivery_location_name')
        .eq('customer_profile_id', user?.id)
        .order('ordered_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        throw error
      }

      console.log('Orders fetched successfully:', data)
      setOrders(data || [])
    } catch (error: any) {
      console.error('Failed to fetch orders:', error)
      setError(error.message || 'Failed to load order history')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId] || loadingItems[orderId]) return

    try {
      setLoadingItems(prev => ({ ...prev, [orderId]: true }))
      
      console.log('Fetching items for order:', orderId)
      
      const { data, error } = await supabase
        .from('order_items')
        .select('product_name_at_purchase, quantity, price_at_purchase')
        .eq('order_id', orderId)

      if (error) {
        console.error('Error fetching order items:', error)
        throw error
      }

      console.log('Order items fetched:', data)
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }))
    } catch (error) {
      console.error('Failed to fetch order items:', error)
    } finally {
      setLoadingItems(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const toggleOrderDetails = (orderId: string) => {
    const isExpanded = expandedOrders[orderId]
    setExpandedOrders(prev => ({ ...prev, [orderId]: !isExpanded }))
    
    if (!isExpanded) {
      fetchOrderItems(orderId)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-orange-100 text-orange-800'
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDeliveryType = (type: string) => {
    switch (type) {
      case 'instant':
        return 'Instant Delivery'
      case 'morning':
        return 'Morning Delivery'
      case 'evening':
        return 'Evening Delivery'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {[...Array(5)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Order History</h1>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Orders</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchOrders}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Order History</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your order history here!</p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.order_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Order #{order.order_id}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(order.ordered_at), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-green-600">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivery Type:</span>
                      <span className="text-sm">{formatDeliveryType(order.delivery_type)}</span>
                    </div>
                    
                    {/* See Details Section */}
                    <Collapsible 
                      open={expandedOrders[order.order_id]} 
                      onOpenChange={() => toggleOrderDetails(order.order_id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          <span>See Details</span>
                          {expandedOrders[order.order_id] ? (
                            <ChevronUp className="w-4 h-4 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-2" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3 pt-3 border-t">
                        {order.delivery_location_name && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-600">Delivery Location:</span>
                            <span className="text-sm text-right max-w-xs">{order.delivery_location_name}</span>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                          {loadingItems[order.order_id] ? (
                            <div className="space-y-2">
                              {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {orderItems[order.order_id]?.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                  <span>{item.quantity}x {item.product_name_at_purchase}</span>
                                  <span className="font-medium">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                                </div>
                              )) || (
                                <p className="text-sm text-gray-500">No items found for this order</p>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistoryPage

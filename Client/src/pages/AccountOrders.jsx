import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/api';
import Button from '../components/Common/Button';
import { toast } from 'react-hot-toast';
import Modal from '../components/Common/Modal';

const AccountOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Fetch orders with React Query
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const response = await axios.get('/orders');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch single order details
  const { data: orderDetails, isLoading: orderDetailsLoading, refetch: refetchOrderDetails } = useQuery({
    queryKey: ['order-details', selectedOrder],
    queryFn: async () => {
      try {
        const response = await axios.get(`/orders/${selectedOrder}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
      }
    },
    enabled: !!selectedOrder,
    onSuccess: () => {
      setShowOrderModal(true);
    },
    onError: () => {
      toast.error('Failed to fetch order details');
    }
  });

  // Cancel order mutation
  const queryClient = useQueryClient();
  const cancelOrder = useMutation(
    async (orderId) => {
      const response = await axios.patch(`/orders/${orderId}/cancel`);
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate and refetch orders query
        queryClient.invalidateQueries(['orders']);
        if (selectedOrder) {
          refetchOrderDetails();
        }
        toast.success('Order cancelled successfully');
      },
      onError: () => {
        toast.error('Failed to cancel order');
      }
    }
  );

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Get payment status badge class
  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Handle view order details
  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
  };

  // Handle cancel order
  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(orderId);
    }
  };

  // Check if order can be cancelled (only processing orders can be cancelled)
  const canCancelOrder = (order) => {
    return order.orderStatus === 'processing';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading orders</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">No Orders Yet</h2>
        <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
        <Button href="/shop">Start Shopping</Button>
      </div>
    );
  }

  return (
    <div>
      {selectedOrder && !showOrderModal ? (
        // Selected order details view
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Order #{selectedOrder.substring(0, 8)}</h2>
            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>Back to Orders</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
                <p>{formatDate(orders.find(o => o._id === selectedOrder)?.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
                <p>{formatCurrency(orders.find(o => o._id === selectedOrder)?.totalAmount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Order Status</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(orders.find(o => o._id === selectedOrder)?.orderStatus)}`}>
                  {orders.find(o => o._id === selectedOrder)?.orderStatus.charAt(0).toUpperCase() + orders.find(o => o._id === selectedOrder)?.orderStatus.slice(1)}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeClass(orders.find(o => o._id === selectedOrder)?.paymentStatus)}`}>
                  {orders.find(o => o._id === selectedOrder)?.paymentStatus.charAt(0).toUpperCase() + orders.find(o => o._id === selectedOrder)?.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
            
            {canCancelOrder(orders.find(o => o._id === selectedOrder)) && (
              <div className="mb-6">
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleCancelOrder(selectedOrder)}
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Orders list view
        <div>
          <h2 className="text-xl font-semibold mb-6">My Orders</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order._id.substring(0, 8)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button variant="outline" size="xs" onClick={() => handleViewOrder(order._id)}>View Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && orderDetails && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order Details #${orderDetails._id.substring(0, 8)}`}
        >
          <div className="p-4">
            {/* Order Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
                <p className="font-medium">{formatDate(orderDetails.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
                <p className="font-medium">{formatCurrency(orderDetails.totalAmount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Order Status</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(orderDetails.orderStatus)}`}>
                  {orderDetails.orderStatus.charAt(0).toUpperCase() + orderDetails.orderStatus.slice(1)}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeClass(orderDetails.paymentStatus)}`}>
                  {orderDetails.paymentStatus.charAt(0).toUpperCase() + orderDetails.paymentStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <h3 className="font-medium mb-4">Order Items</h3>
            <div className="space-y-4 mb-6">
              {orderDetails.items.map((item) => (
                <div key={item._id} className="flex items-center border-b border-gray-200 pb-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={item.productId.images?.[0]} 
                      alt={item.productId.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium">{item.productId.title}</h4>
                    <div className="flex justify-between mt-1">
                      <div className="text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(item.priceAtPurchase * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <h3 className="font-medium mb-4">Shipping Address</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-medium">{orderDetails.shippingAddress.label || 'Shipping Address'}</p>
              <p>{orderDetails.shippingAddress.line1}</p>
              <p>
                {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zip}
              </p>
              <p>{orderDetails.shippingAddress.country}</p>
            </div>

            {canCancelOrder(orderDetails) && (
              <div className="mb-6">
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => {
                    handleCancelOrder(orderDetails._id);
                    setShowOrderModal(false);
                  }}
                >
                  Cancel Order
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountOrders;
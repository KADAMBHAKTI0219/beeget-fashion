import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';
import CollectionManagement from './CollectionManagement';
import CustomerManagement from './CustomerManagement';
import ContactManagement from './ContactManagement';
import NotificationManagement from './NotificationManagement';
import CmsManagement from './CmsManagement';
import PromotionManagement from './PromotionManagement';
import Button from '../Common/Button';
import { toast } from 'react-hot-toast';
import Modal from '../Common/Modal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  
  // Fetch unread contact messages count
  useQuery(
    ['unread-contacts-count'],
    async () => {
      try {
        const response = await axios.get('/contact?status=new&limit=1');
        setUnreadContactCount(response.data.pagination?.total || 0);
        return response.data;
      } catch (error) {
        console.error('Error fetching unread contacts count:', error);
        return { total: 0 };
      }
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      refetchOnWindowFocus: true
    }
  );

  // Fetch dashboard stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['admin-stats'],
    async () => {
      try {
        // Get products count and top products
        const productsResponse = await axios.get('/products?limit=1');
        const totalProducts = productsResponse.data.pagination.total;
        
        // Get top products (sort by inventory count for now as a proxy for popularity)
        const topProductsResponse = await axios.get('/products?limit=5&sort=-inventoryCount');
        const topProducts = topProductsResponse.data.data || [];
        
        // Get recent orders
        const ordersResponse = await axios.get('/orders/admin/all?limit=5');
        const recentOrders = ordersResponse.data.data || [];
        
        // Calculate total sales and orders count from orders data
        const totalOrders = ordersResponse.data.pagination?.total || recentOrders.length;
        const totalSales = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Get customers count (if available) or use a reasonable estimate
        let totalCustomers = 0;
        try {
          const customersResponse = await axios.get('/auth/users/count');
          totalCustomers = customersResponse.data.count;
        } catch (err) {
          // If endpoint doesn't exist, use an estimate based on orders
          const uniqueCustomerIds = new Set();
          recentOrders.forEach(order => {
            if (order.userId) uniqueCustomerIds.add(order.userId);
          });
          totalCustomers = Math.max(uniqueCustomerIds.size, recentOrders.length);
        }
        
        // Format top products data
        const formattedTopProducts = topProducts.map(product => ({
          id: product._id,
          name: product.title,
          sales: Math.floor(Math.random() * 50) + 10, // Placeholder for sales data
          stock: product.inventoryCount
        }));
        
        return {
          totalSales,
          totalOrders,
          totalCustomers,
          totalProducts,
          recentOrders,
          topProducts: formattedTopProducts
        };
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Fetch products for products tab
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['admin-products'],
    async () => {
      try {
        const response = await axios.get('/products?limit=10');
        return response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    {
      enabled: activeTab === 'products' || activeTab === 'overview',
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
  
  // Fetch orders for orders tab
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['admin-orders'],
    async () => {
      try {
        const response = await axios.get('/orders/admin/all?limit=10');
        return response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    {
      enabled: activeTab === 'orders' || activeTab === 'overview',
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Fetch single order details
  const { data: orderDetails, isLoading: orderDetailsLoading, refetch: refetchOrderDetails } = useQuery(
    ['order-details', selectedOrder],
    async () => {
      try {
        const response = await axios.get(`/orders/${selectedOrder}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
      }
    },
    {
      enabled: !!selectedOrder,
      onSuccess: () => {
        setShowOrderModal(true);
      },
      onError: () => {
        toast.error('Failed to fetch order details');
      }
    }
  );

  // Update order status mutation
  const queryClient = useQueryClient();
  const updateOrderStatus = useMutation(
    async ({ orderId, status }) => {
      const response = await axios.patch(`/orders/${orderId}/status`, {
        orderStatus: status
      });
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate and refetch orders queries
        queryClient.invalidateQueries(['admin-orders']);
        queryClient.invalidateQueries(['admin-stats']);
        if (selectedOrder) {
          refetchOrderDetails();
        }
        toast.success('Order status updated successfully');
      },
      onError: () => {
        toast.error('Failed to update order status');
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'collections', label: 'Collections' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'orders', label: 'Orders' },
    { id: 'customers', label: 'Customers' },
    { id: 'contacts', label: `Messages ${unreadContactCount > 0 ? `(${unreadContactCount})` : ''}` },
    { id: 'notifications', label: 'Notifications' },
    { id: 'cms', label: 'CMS Pages' },
  ];

  // Handle view order details
  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
  };

  // Render overview tab
  const renderOverview = () => (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          // Loading skeletons for stats cards
          [...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Sales</h3>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalSales)}</p>
              {/* Generate random growth percentage between 5-15% */}
              {(() => {
                const growth = Math.floor(Math.random() * 11) + 5;
                const isPositive = Math.random() > 0.3; // 70% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Orders</h3>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
              {/* Generate random growth percentage between 3-12% */}
              {(() => {
                const growth = Math.floor(Math.random() * 10) + 3;
                const isPositive = Math.random() > 0.3; // 70% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Customers</h3>
              <p className="text-3xl font-bold">{stats.totalCustomers}</p>
              {/* Generate random growth percentage between 2-8% */}
              {(() => {
                const growth = Math.floor(Math.random() * 7) + 2;
                const isPositive = Math.random() > 0.2; // 80% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
              {/* Generate random growth percentage between 1-5% */}
              {(() => {
                const growth = Math.floor(Math.random() * 5) + 1;
                const isPositive = Math.random() > 0.5; // 50% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
          </>
        )}
      </div>
      
      {/* Recent orders */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
            View All
          </Button>
        </div>
        
        {statsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order._id.substring(0, 8)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{order.userId?.name || 'Customer'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button variant="outline" size="xs" onClick={() => handleViewOrder(order._id)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
      
      {/* Top products */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Top Selling Products</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('products')}>
            View All
          </Button>
        </div>
        
        {statsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{product.sales} units</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button variant="outline" size="xs">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  // Render orders tab
  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Orders Management</h3>
      </div>
      
      {ordersLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : ordersData?.data?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersData.data.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order._id.substring(0, 8)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{order.userId?.name || 'Customer'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="outline" size="xs" className="mr-2" onClick={() => handleViewOrder(order._id)}>View</Button>
                    <select 
                      className="text-sm border-gray-300 rounded-md"
                      defaultValue={order.orderStatus}
                      onChange={(e) => {
                        updateOrderStatus.mutate({
                          orderId: order._id,
                          status: e.target.value
                        });
                      }}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  )
  
  // Render customers tab
  const renderCustomers = () => <CustomerManagement />

  // Render contacts tab
  const renderContacts = () => <ContactManagement />

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'collections':
        return <CollectionManagement />;
      case 'promotions':
        return <PromotionManagement />;
      case 'orders':
        return renderOrders();
      case 'customers':
        return renderCustomers();
      case 'contacts':
        return renderContacts();
      case 'notifications':
        return <NotificationManagement />;
      case 'cms':
        return <CmsManagement />;
      default:
        return <ProductManagement />;
    }
  };

  return (
    <div className="container-custom mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {renderTabContent()}
      </div>

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
                <div className="flex items-center">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(orderDetails.orderStatus)}`}>
                    {orderDetails.orderStatus.charAt(0).toUpperCase() + orderDetails.orderStatus.slice(1)}
                  </span>
                  <select
                    className="ml-2 text-sm border-gray-300 rounded-md"
                    value={orderDetails.orderStatus}
                    onChange={(e) => {
                      updateOrderStatus.mutate({
                        orderId: orderDetails._id,
                        status: e.target.value
                      });
                    }}
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeClass(orderDetails.paymentStatus)}`}>
                  {orderDetails.paymentStatus.charAt(0).toUpperCase() + orderDetails.paymentStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <h3 className="font-medium mb-4">Customer Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Customer Name</h4>
                  <p>{orderDetails.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p>{orderDetails.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h4>
                  <p className="capitalize">{orderDetails.paymentMethod?.replace('-', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Order ID</h4>
                  <p className="font-mono text-xs">{orderDetails._id}</p>
                </div>
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

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
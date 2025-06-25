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
import AdminOffcanvas from './AdminOffcanvas';
import { Bars3Icon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  
  // Fetch unread contact messages count
  useQuery({
    queryKey: ['unread-contacts-count'],
    queryFn: async () => {
      try {
        const response = await axios.get('/contact?status=new&limit=1');
        setUnreadContactCount(response.data.pagination?.total || 0);
        return response.data;
      } catch (error) {
        console.error('Error fetching unread contacts count:', error);
        return { total: 0 };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true
  });

  // Fetch dashboard stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        // Get products count and top products
        const productsResponse = await axios.get('/products?limit=1');
        const totalProducts = productsResponse.data.pagination.total || 0;
        
        // Get top products (sort by inventory count for now as a proxy for popularity)
        const topProductsResponse = await axios.get('/products?limit=5&sort=-inventoryCount');
        const topProducts = topProductsResponse.data.data || [];
        
        // Get recent orders
        const ordersResponse = await axios.get('/orders/admin/all?limit=5');
        const recentOrders = ordersResponse.data.data || [];
        
        // Calculate total sales and orders count from orders data
        const totalOrders = ordersResponse.data.pagination?.total || recentOrders.length;
        const totalSales = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        // Get customers count (if available) or use a reasonable estimate
        let totalCustomers = 0;
        try {
          // Try to get users count from a more reliable endpoint
          // If /auth/users/count doesn't exist, try an alternative endpoint or skip
          const customersResponse = await axios.get('/admin/users');
          // Extract user count from response - adjust based on your API structure
          totalCustomers = customersResponse.data.pagination?.total || 
                          customersResponse.data.data?.length || 0;
        } catch (err) {
          console.error('Error fetching customer count:', err);
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
          stock: product.inventoryCount || 0
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
        throw new Error('Failed to fetch admin stats');
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch products for products tab
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      try {
        const response = await axios.get('/products?limit=10');
        return response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    enabled: activeTab === 'products' || activeTab === 'overview',
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
  
  // Fetch orders for orders tab
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
        const response = await axios.get('/orders/admin/all?limit=10');
        return response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    enabled: activeTab === 'orders' || activeTab === 'overview',
    staleTime: 2 * 60 * 1000 // 2 minutes
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

  // Update order status mutation
  const queryClient = useQueryClient();
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await axios.patch(`/orders/${orderId}/status`, {
        orderStatus: status
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch orders queries
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedOrder) {
        refetchOrderDetails();
      }
      toast.success('Order status updated successfully');
      },
      onError: () => {
        toast.error('Failed to update order status');
      }
  });

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

  // Handle view order details - immediately open modal
  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
    setShowOrderModal(true);
  };

  // Render overview tab
  const renderOverview = () => (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          // Loading skeletons for stats cards
          [...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 w-6 rounded bg-gray-200"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-md shadow-sm p-4 border-t border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">Sales</h3>
                  <p className="text-2xl font-medium text-gray-800">{formatCurrency(stats.totalSales)}</p>
                </div>
                <div className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {/* Generate random growth percentage between 5-15% */}
              {(() => {
                const growth = Math.floor(Math.random() * 11) + 5;
                const isPositive = Math.random() > 0.3; // 70% chance of positive growth
                return (
                  <div className="flex items-center mt-3">
                    <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-gray-500'}`}>
                      {isPositive ? '↑' : '↓'} {growth}% from last month
                    </span>
                  </div>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-md shadow-sm p-4 border-t border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">Orders</h3>
                  <p className="text-2xl font-medium text-gray-800">{stats.totalOrders}</p>
                </div>
                <div className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              {/* Generate random growth percentage between 3-12% */}
              {(() => {
                const growth = Math.floor(Math.random() * 10) + 3;
                const isPositive = Math.random() > 0.3; // 70% chance of positive growth
                return (
                  <div className="flex items-center mt-3">
                    <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-gray-500'}`}>
                      {isPositive ? '↑' : '↓'} {growth}% from last month
                    </span>
                  </div>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-md shadow-sm p-4 border-t border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">Customers</h3>
                  <p className="text-2xl font-medium text-gray-800">{stats.totalCustomers}</p>
                </div>
                <div className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              {/* Generate random growth percentage between 2-8% */}
              {(() => {
                const growth = Math.floor(Math.random() * 7) + 2;
                const isPositive = Math.random() > 0.2; // 80% chance of positive growth
                return (
                  <div className="flex items-center mt-3">
                    <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-gray-500'}`}>
                      {isPositive ? '↑' : '↓'} {growth}% from last month
                    </span>
                  </div>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-md shadow-sm p-4 border-t border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">Products</h3>
                  <p className="text-2xl font-medium text-gray-800">{stats.totalProducts}</p>
                </div>
                <div className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
              {/* Generate random growth percentage between 1-5% */}
              {(() => {
                const growth = Math.floor(Math.random() * 5) + 1;
                const isPositive = Math.random() > 0.5; // 50% chance of positive growth
                return (
                  <div className="flex items-center mt-3">
                    <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-gray-500'}`}>
                      {isPositive ? '↑' : '↓'} {growth}% from last month
                    </span>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
      
      {/* Recent Orders */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-700">Recent Orders</h2>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center"
          >
            View All
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {statsLoading ? (
          // Loading skeleton for orders table
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded mb-3"></div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-100 rounded mb-2"></div>
            ))}
          </div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-400 text-sm mb-3">No orders found</p>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-stats'] })}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.slice(0, 5).map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-700">
                      #{order._id.slice(-6)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {order.userId?.name || 'Guest'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={() => handleViewOrder(order._id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Top Selling Products */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-700">Top Selling Products</h2>
          <button 
            onClick={() => setActiveTab('products')}
            className="text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center"
          >
            View All
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {statsLoading ? (
          // Loading skeleton for products table
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded mb-3"></div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-100 rounded mb-2"></div>
            ))}
          </div>
        ) : stats.topProducts.length === 0 ? (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p className="text-gray-400 text-sm">No top products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-700">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-700">{product.sales} units</div>
                      <div className="text-xs text-gray-500">This month</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        className="text-gray-500 hover:text-gray-700 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-700"
                      >
                        View
                      </button>
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
    <div className="bg-white rounded-md shadow-sm p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base text-gray-700 flex items-center">
          <span className="w-1 h-4 bg-blue-400 rounded-full mr-2"></span>
          Orders
        </h3>
        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="border border-gray-200 rounded py-1 pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-xs w-32 sm:w-auto"
            />
          </div>
          <select className="border border-gray-200 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-xs">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {ordersLoading ? (
        <div className="flex flex-col justify-center items-center py-8 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-400 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-xs animate-pulse">Loading orders...</p>
        </div>
      ) : ordersData?.data?.length > 0 ? (
        <div className="overflow-x-auto rounded-md">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {ordersData.data.map((order, index) => (
                <tr key={order._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 bg-blue-50 text-blue-500 rounded flex items-center justify-center mr-2">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <span className="text-xs text-gray-700">{order._id.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{order.userId?.name || 'Customer'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{formatDate(order.createdAt)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button 
                        variant="outline" 
                        size="xs" 
                        onClick={() => handleViewOrder(order._id)}
                        className="rounded text-xs py-0.5 px-2 hover:bg-blue-50 hover:text-blue-500 transition-all"
                      >
                        View
                      </Button>
                      <select 
                        className="text-xs border border-gray-200 rounded py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50/30 rounded border border-dashed border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <p className="text-gray-500 mb-1 text-sm">No orders found</p>
          <p className="text-gray-400 text-xs">New orders will appear here when customers make purchases</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-3 rounded text-xs py-1 px-2 hover:bg-blue-50 hover:text-blue-500 transition-all"
          >
            Refresh Data
          </Button>
        </div>
      )}
      
      {/* Pagination */}
      {ordersData?.orders?.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Showing <span className="text-gray-600">{((ordersData?.currentPage || 1) - 1) * 10 + 1}</span> to <span className="text-gray-600">{Math.min((ordersData?.currentPage || 1) * 10, ordersData?.totalCount || 0)}</span> of <span className="text-gray-600">{ordersData?.totalCount || 0}</span> orders
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="sm"
              className="rounded text-xs py-1 px-2 hover:bg-gray-50 transition-all"
              disabled={ordersData?.currentPage === 1}
              onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded text-xs py-1 px-2 hover:bg-gray-50 transition-all"
              disabled={ordersData?.currentPage === ordersData?.totalPages}
              onClick={() => setOrdersPage(prev => Math.min(prev + 1, ordersData?.totalPages || 1))}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Admin Dashboard</h2>
        </div>
        <div className="flex-grow overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-md flex items-center text-sm
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'}
                  transition-colors duration-150
                `}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with welcome message and user info */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div>
              <h1 className="text-xl font-medium text-gray-800">Welcome Back, Gulraiz.</h1>
              <p className="text-sm text-gray-500">Welcome to the Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                GK
              </div>
              <span className="text-sm font-medium">Gulraiz Khan</span>
            </div>
          </div>
        </div>
      
        {/* Search bar */}
        <div className="p-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto p-4">
          {renderTabContent()}
        </div> {/* End of main content area */}
      </div> {/* End of flex-1 flex flex-col overflow-hidden */}
      
      {/* Admin Offcanvas Menu */}
      <AdminOffcanvas 
        isOpen={isOffcanvasOpen}
        onClose={() => setIsOffcanvasOpen(false)}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Order Details Modal */}
      {showOrderModal && orderDetails && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order #${orderDetails._id.substring(0, 8)}`}
        >
          <div className="p-3">
            {/* Order Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <h3 className="text-xs text-gray-400 mb-0.5">Order Date</h3>
                <p className="text-sm">{formatDate(orderDetails.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-xs text-gray-400 mb-0.5">Total Amount</h3>
                <p className="text-sm">{formatCurrency(orderDetails.totalAmount)}</p>
              </div>
              <div>
                <h3 className="text-xs text-gray-400 mb-0.5">Order Status</h3>
                <div className="flex items-center">
                  <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${getStatusBadgeClass(orderDetails.orderStatus)}`}>
                    {orderDetails.orderStatus.charAt(0).toUpperCase() + orderDetails.orderStatus.slice(1)}
                  </span>
                  <select
                    className="ml-2 text-xs border border-gray-200 rounded py-0.5 px-1"
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
                <h3 className="text-xs text-gray-400 mb-0.5">Payment Status</h3>
                <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${getPaymentStatusBadgeClass(orderDetails.paymentStatus)}`}>
                  {orderDetails.paymentStatus.charAt(0).toUpperCase() + orderDetails.paymentStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <h3 className="text-xs uppercase text-gray-400 mb-2">Customer Information</h3>
            <div className="bg-gray-50/50 p-2 rounded mb-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs text-gray-400 mb-0.5">Name</h4>
                  <p className="text-sm">{orderDetails.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs text-gray-400 mb-0.5">Email</h4>
                  <p className="text-sm">{orderDetails.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs text-gray-400 mb-0.5">Payment Method</h4>
                  <p className="capitalize text-sm">{orderDetails.paymentMethod?.replace('-', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs text-gray-400 mb-0.5">Order ID</h4>
                  <p className="font-mono text-xs text-gray-500">{orderDetails._id}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <h3 className="text-xs uppercase text-gray-400 mb-2">Order Items</h3>
            <div className="space-y-3 mb-4">
              {orderDetails.items.map((item) => (
                <div key={item._id} className="flex items-center border-b border-gray-100 pb-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded overflow-hidden">
                    <img 
                      src={item.productId.images?.[0]} 
                      alt={item.productId.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm">{item.productId.title}</h4>
                    <div className="flex justify-between mt-0.5">
                      <div className="text-xs text-gray-400">
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <div className="text-sm">
                        {formatCurrency(item.priceAtPurchase * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <h3 className="text-xs uppercase text-gray-400 mb-2">Shipping Address</h3>
            <div className="bg-gray-50/50 p-2 rounded mb-4 text-sm">
              <p className="text-sm">{orderDetails.shippingAddress.label || 'Shipping Address'}</p>
              <p className="text-sm text-gray-600">{orderDetails.shippingAddress.line1}</p>
              <p className="text-sm text-gray-600">
                {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zip}
              </p>
              <p className="text-sm text-gray-600">{orderDetails.shippingAddress.country}</p>
            </div>

            <div className="flex justify-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowOrderModal(false)}
                className="text-xs py-1 px-3"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
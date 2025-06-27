import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import { format, parseISO } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const NewDashboard = () => {
  // State for date range
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Jan 1 of current year
    endDate: new Date(),
  });

  // Fetch orders data with React Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/admin/orders');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch products data with React Query
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/products');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch users data with React Query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/admin/users');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Calculate dashboard stats from fetched data
  const [stats, setStats] = useState(null);

  useEffect(() => {
     if (ordersData && productsData && usersData) {
       // Calculate total revenue from all orders
       const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
       
       // Calculate average order value
       const avgOrderValue = ordersData.length > 0 ? Math.round(totalRevenue / ordersData.length) : 0;
       
       // Total shipments (orders that have been shipped)
       const totalShipment = ordersData.filter(order => 
         order.orderStatus === 'shipped' || order.orderStatus === 'delivered'
       ).length;

       // Get recent orders (last 5)
       const recentOrders = ordersData
         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
         .slice(0, 5)
         .map(order => ({
           id: `#${order._id.substring(order._id.length - 4)}`,
           customer: {
             name: order.userId?.name || 'Unknown Customer',
             email: order.userId?.email || 'unknown@email.com'
           },
           date: order.createdAt,
           status: order.paymentStatus === 'paid' ? 'Paid' : 
                  order.paymentStatus === 'refunded' ? 'Refunded' : 'Pending',
           purchase: order.items.length > 0 ? 
                    `${order.items.length} item${order.items.length > 1 ? 's' : ''}` : 
                    'No items'
         }));

       // Generate transaction data for the graph
       // Group orders by date and sum amounts
       const ordersByDate = ordersData.reduce((acc, order) => {
         const date = new Date(order.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD format
         if (!acc[date]) {
           acc[date] = 0;
         }
         acc[date] += order.totalAmount || 0;
         return acc;
       }, {});

       // Convert to array format for the chart
       const transactionData = Object.entries(ordersByDate)
         .map(([date, amount]) => ({ date, amount }))
         .sort((a, b) => new Date(a.date) - new Date(b.date))
         .slice(-16); // Last 16 data points for the graph

       // Process product categories for pie chart
       const categoryCount = {};
       productsData.forEach(product => {
         if (product.categories && product.categories.length > 0) {
           product.categories.forEach(category => {
             const categoryName = category.name || 'Uncategorized';
             categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
           });
         } else {
           categoryCount['Uncategorized'] = (categoryCount['Uncategorized'] || 0) + 1;
         }
       });

       // Convert to array format for the pie chart
       const categoryData = Object.entries(categoryCount)
         .map(([name, value]) => ({ name, value }))
         .sort((a, b) => b.value - a.value); // Sort by count descending

       // Process order status for bar chart
       const orderStatusCount = {};
       ordersData.forEach(order => {
         const status = order.orderStatus || 'processing';
         orderStatusCount[status] = (orderStatusCount[status] || 0) + 1;
       });

       // Convert to array format for the bar chart
       const orderStatusData = Object.entries(orderStatusCount)
         .map(([name, value]) => ({ name, value }));

       setStats({
         totalRevenue,
         avgOrderValue,
         totalShipment,
         recentOrders,
         transactionData,
         totalProducts: productsData.length,
         totalUsers: usersData.length,
         categoryData,
         orderStatusData
       });
     }
   }, [ordersData, productsData, usersData]);

  // Loading state
  const isLoading = ordersLoading || productsLoading || usersLoading;

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
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with welcome message */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Welcome Back, Gulraiz.</h1>
          <p className="text-sm text-gray-500">Welcome to the Dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2">
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="flex items-center">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profile" className="h-8 w-8 rounded-full mr-2" />
            <span className="text-sm font-medium">Gulraiz Khan</span>
            <span className="text-xs text-gray-500 ml-1">Admin</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <div></div>
          <div className="flex space-x-3">
            <button className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Data
            </button>
            <button className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium flex items-center hover:bg-blue-700">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Export
            </button>
          </div>
        </div>

      {/* Main content */}
      <div className="px-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Revenue</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-medium text-gray-800">{formatCurrency(stats?.totalRevenue || 0)}</p>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">+12%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">From Jan 01, 2024 - March 30, 2024</p>
          </div>

          {/* Avg. Order Value */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Avg. Order Value</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-medium text-gray-800">{formatCurrency(stats?.avgOrderValue || 0)}</p>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">-15%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">From Jan 01, 2024 - March 30, 2024</p>
          </div>

          {/* Total Shipment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Shipment</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-medium text-gray-800">{stats?.totalShipment || 0}</p>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">+12%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">From Jan 01, 2024 - March 30, 2024</p>
          </div>
        </div>

        {/* Additional Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Products</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-medium text-gray-800">{stats?.totalProducts || 0}</p>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">+8%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Total products in inventory</p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-medium text-gray-800">{stats?.totalUsers || 0}</p>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">+20%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Registered users</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Transaction Activity Graph */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-700 font-medium">Transaction Activity</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            
            {/* Transaction Activity Graph using Recharts */}
            <div className="h-64">
              {stats?.transactionData && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.transactionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value / 1000}k`}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                      labelFormatter={(date) => format(new Date(date), 'MMMM d, yyyy')}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                        fontSize: '0.75rem'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Product Categories Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-700 font-medium">Product Categories</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            
            {/* Product Categories Pie Chart using Recharts */}
            <div className="h-64">
              {stats?.categoryData && stats.categoryData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
                            '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
                          ][index % 8]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} products`, props.payload.name]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                        fontSize: '0.75rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-700 font-medium">Order Status Distribution</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          
          {/* Order Status Bar Chart using Recharts */}
          <div className="h-64">
            {stats?.orderStatusData && stats.orderStatusData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.orderStatusData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} orders`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-700 font-medium">Customer Details</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {order.customer.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${order.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.purchase}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-500 mr-2">Delete</button>
                      <button className="text-blue-600 hover:text-blue-700">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
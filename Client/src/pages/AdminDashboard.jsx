import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Button from '../components/Common/Button'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'products', 'orders', 'customers'
  
  // Fetch dashboard stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['admin-stats'],
    async () => {
      // In a real app, this would be an API call
      // For now, we'll simulate a delay and return mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock stats data
          const mockStats = {
            totalSales: 12589.99,
            totalOrders: 156,
            totalCustomers: 89,
            totalProducts: 48,
            recentOrders: [
              { id: 'ORD-12345', customer: 'John Doe', date: '2023-06-15', total: 129.99, status: 'delivered' },
              { id: 'ORD-12346', customer: 'Jane Smith', date: '2023-06-14', total: 89.99, status: 'processing' },
              { id: 'ORD-12347', customer: 'Robert Johnson', date: '2023-06-13', total: 49.99, status: 'cancelled' },
              { id: 'ORD-12348', customer: 'Emily Davis', date: '2023-06-12', total: 199.99, status: 'delivered' },
              { id: 'ORD-12349', customer: 'Michael Brown', date: '2023-06-11', total: 79.99, status: 'processing' },
            ],
            topProducts: [
              { id: 1, name: 'Classic White Tee', sales: 42, stock: 18 },
              { id: 2, name: 'Slim Fit Jeans', sales: 38, stock: 12 },
              { id: 3, name: 'Summer Dress', sales: 35, stock: 7 },
              { id: 4, name: 'Casual Shirt', sales: 31, stock: 15 },
              { id: 5, name: 'Leather Jacket', sales: 28, stock: 5 },
            ]
          }
          resolve(mockStats)
        }, 1000)
      })
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
  
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
  
  // Render overview tab
  const renderOverview = () => (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Sales</h3>
          <p className="text-3xl font-bold">{statsLoading ? '-' : formatCurrency(stats.totalSales)}</p>
          <p className="text-green-600 text-sm mt-2">↑ 12% from last month</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{statsLoading ? '-' : stats.totalOrders}</p>
          <p className="text-green-600 text-sm mt-2">↑ 8% from last month</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Customers</h3>
          <p className="text-3xl font-bold">{statsLoading ? '-' : stats.totalCustomers}</p>
          <p className="text-green-600 text-sm mt-2">↑ 5% from last month</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
          <p className="text-3xl font-bold">{statsLoading ? '-' : stats.totalProducts}</p>
          <p className="text-yellow-600 text-sm mt-2">↓ 3% from last month</p>
        </div>
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
        ) : (
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
                  <tr key={order.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{order.customer}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button variant="outline" size="xs">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  
  // Render placeholder for other tabs
  const renderPlaceholder = (tabName) => (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
      <h3 className="text-xl font-semibold mb-4">{tabName.charAt(0).toUpperCase() + tabName.slice(1)} Management</h3>
      <p className="text-gray-500 mb-6">This section is under development.</p>
      <Button onClick={() => setActiveTab('overview')}>Back to Overview</Button>
    </div>
  )
  
  return (
    <div className="bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-heading font-semibold mb-8">Admin Dashboard</h1>
        
        {/* Dashboard tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'overview' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'products' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'orders' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'customers' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'products' && renderPlaceholder('products')}
        {activeTab === 'orders' && renderPlaceholder('orders')}
        {activeTab === 'customers' && renderPlaceholder('customers')}
      </div>
    </div>
  )
}

export default AdminDashboard
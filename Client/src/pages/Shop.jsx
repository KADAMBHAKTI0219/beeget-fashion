import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from '../utils/api'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import useWishlist from '../hooks/useWishlist'
import Button from '../components/Common/Button'
import productImages from '../assets/product-images'
import { toast } from 'react-toastify'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const Shop = () => {
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '9', 10)
  })
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.category) params.set('category', filters.category)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.search) params.set('search', filters.search)
    params.set('page', filters.page.toString())
    params.set('limit', filters.limit.toString())
    
    setSearchParams(params)
  }, [filters, setSearchParams])
  
  // Fetch products with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        // Build query parameters for API call
        const params = new URLSearchParams()
        
        if (filters.category) params.set('category', filters.category)
        if (filters.minPrice) params.set('minPrice', filters.minPrice)
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
        if (filters.search) params.set('search', filters.search)
        params.set('page', filters.page.toString())
        params.set('limit', filters.limit.toString())
        
        // Set sorting parameter
        switch (filters.sort) {
          case 'price-asc':
            params.set('sort', 'price')
            params.set('order', 'asc')
            break
          case 'price-desc':
            params.set('sort', 'price')
            params.set('order', 'desc')
            break
          case 'name-asc':
            params.set('sort', 'title')
            params.set('order', 'asc')
            break
          case 'name-desc':
            params.set('sort', 'title')
            params.set('order', 'desc')
            break
          case 'newest':
          default:
            params.set('sort', 'createdAt')
            params.set('order', 'desc')
            break
        }
        
        // Make API call to get products
        const response = await axios.get(`/products?${params.toString()}`)
        return response.data || {}
      } catch (error) {
        console.error('Error fetching products:', error)
        throw error
      }
    },
    keepPreviousData: true
  })
  
  const products = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 }
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset to page 1 when filters change (except when changing page)
      ...(name !== 'page' && { page: 1 })
    }))
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return
    handleFilterChange('page', newPage)
  }
  
  // Handle search input
  const handleSearch = (e) => {
    e.preventDefault()
    const searchInput = e.target.elements.search.value
    handleFilterChange('search', searchInput)
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-4xl font-heading font-semibold mb-8 text-center">Shop Collection</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              defaultValue={filters.search}
              className="flex-grow px-4 py-2 rounded-l-md border-gray-300 focus:ring-teal focus:border-teal"
            />
            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </form>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4 bg-white p-6 rounded-lg shadow-sm h-fit">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            
            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={filters.category === ''}
                    onChange={() => handleFilterChange('category', '')}
                    className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value="women"
                    checked={filters.category === 'women'}
                    onChange={() => handleFilterChange('category', 'women')}
                    className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                  />
                  <span className="ml-2">Women</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value="men"
                    checked={filters.category === 'men'}
                    onChange={() => handleFilterChange('category', 'men')}
                    className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                  />
                  <span className="ml-2">Men</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value="accessories"
                    checked={filters.category === 'accessories'}
                    onChange={() => handleFilterChange('category', 'accessories')}
                    className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                  />
                  <span className="ml-2">Accessories</span>
                </label>
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Price Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="minPrice" className="block text-sm text-gray-600 mb-1">Min ($)</label>
                  <input
                    type="number"
                    id="minPrice"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="block text-sm text-gray-600 mb-1">Max ($)</label>
                  <input
                    type="number"
                    id="maxPrice"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
            
            {/* Sort Filter */}
            <div>
              <h3 className="text-lg font-medium mb-2">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
            
            {/* Reset Filters Button */}
            <div className="mt-8">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setFilters({
                    category: '',
                    sort: 'newest',
                    minPrice: '',
                    maxPrice: '',
                    search: ''
                  })
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          
          {/* Product Grid */}
          <div className="w-full lg:w-3/4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                    <div className="h-64 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                Error loading products. Please try again.
              </div>
            ) : products?.length === 0 ? (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search term.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilters({
                      category: '',
                      sort: 'newest',
                      minPrice: '',
                      maxPrice: '',
                      search: ''
                    })
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">
                    Showing <span className="font-medium">{products.length}</span> products
                    {pagination.total > 0 && (
                      <> of <span className="font-medium">{pagination.total}</span> total</>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <a href={`/product/${product.slug}`} className="block overflow-hidden">
                        <img 
                          src={product.images && product.images.length > 0 ? product.images[0] : productImages.tshirtWhite} 
                          alt={product.title || product.name} 
                          className="w-full h-64 object-cover transition-transform hover:scale-105 duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = productImages.tshirtWhite;
                          }}
                        />
                      </a>
                      <div className="p-4">
                        <a href={`/product/${product.slug}`} className="block">
                          <h3 className="text-lg font-medium text-charcoal hover:text-teal transition-colors">{product.title || product.name}</h3>
                        </a>
                        <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
                        <div className="mt-4">
                          <Button 
                            fullWidth
                            onClick={(e) => {
                              e.preventDefault()
                              // Navigate to product detail page
                              window.location.href = `/product/${product.slug}`
                            }}
                          >
                            View Details
                          </Button>
                          
                          {!isAuthenticated && (
                            <Button 
                              fullWidth
                              variant="secondary"
                              className="mt-2"
                              onClick={(e) => {
                                e.preventDefault();
                                // Get product ID (handle both id and _id)
                                const productId = product.id || product._id;
                                // Get product name (handle both title and name)
                                const productName = product.title || product.name;
                                
                                // Log for debugging
                                console.log('Handling wishlist action for product:', product);
                                console.log('Using productId:', productId);
                                
                                if (isInWishlist(productId)) {
                                  removeFromWishlist(productId);
                                  toast.info(`${productName} removed from wishlist!`, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                  });
                                } else {
                                  // Make sure product has all necessary fields
                                  const enhancedProduct = {
                                    ...product,
                                    id: productId,
                                    _id: productId,
                                    title: productName,
                                    name: productName
                                  };
                                  
                                  addToWishlist(enhancedProduct);
                                  toast.success(`${productName} added to wishlist!`, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                  });
                                }
                              }}
                            >
                              {isInWishlist(product.id || product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`p-2 rounded-md ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {/* Page Numbers */}
                      {[...Array(pagination.pages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show current page, first page, last page, and pages around current page
                        const showPageNum = pageNum === 1 || 
                                          pageNum === pagination.pages || 
                                          Math.abs(pageNum - pagination.page) <= 1;
                        
                        // Show ellipsis for page gaps
                        if (!showPageNum) {
                          // Show ellipsis only once between gaps
                          if (pageNum === 2 || pageNum === pagination.pages - 1) {
                            return (
                              <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-md ${pageNum === pagination.page ? 'bg-teal text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            aria-current={pageNum === pagination.page ? 'page' : undefined}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className={`p-2 rounded-md ${pagination.page === pagination.pages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        aria-label="Next page"
                      >
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shop
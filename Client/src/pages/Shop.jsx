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
    search: searchParams.get('search') || ''
  })
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.category) params.set('category', filters.category)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.search) params.set('search', filters.search)
    
    setSearchParams(params)
  }, [filters, setSearchParams])
  
  // Fetch products with React Query
  const { data: products, isLoading, error } = useQuery(
    ['products', filters],
    async () => {
      try {
        // Build query parameters for API call
        const params = new URLSearchParams()
        
        if (filters.category) params.set('category', filters.category)
        if (filters.minPrice) params.set('minPrice', filters.minPrice)
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
        if (filters.search) params.set('search', filters.search)
        
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
        return response.data.data || []
      } catch (error) {
        console.error('Error fetching products:', error)
        throw error
      }
    },
    {
      keepPreviousData: true
    }
  )
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
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
                          {isAuthenticated ? (
                            <Button 
                              fullWidth
                              onClick={(e) => {
                                e.preventDefault()
                                addToCart(product)
                              }}
                            >
                              Add to Cart
                            </Button>
                          ) : (
                            <Button 
                              fullWidth
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                if (isInWishlist(product.id)) {
                                  removeFromWishlist(product.id || product._id)
                                  toast.info(`${product.title || product.name} removed from wishlist!`, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                  })
                                } else {
                                  addToWishlist(product)
                                  toast.success(`${product.title || product.name} added to wishlist!`, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                  })
                                  toast.info(`Please login to add to cart.`, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                  })
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shop
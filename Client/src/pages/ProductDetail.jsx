import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import axios from '../utils/api'
import useCart from '../hooks/useCart'
import useAuth from '../hooks/useAuth'
import useWishlist from '../hooks/useWishlist'
import Button from '../components/Common/Button'
import productImages from '../assets/product-images'
import { toast } from 'react-toastify'

const ProductDetail = () => {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Fetch product details with React Query
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      try {
        // Make API call to get product by slug
        const response = await axios.get(`/products/${slug}`)
        return response.data.data || null
      } catch (error) {
        console.error('Error fetching product details:', error)
        throw error
      }
    },
    enabled: !!slug,
    refetchOnWindowFocus: false
  })
  
  // Fetch related products with React Query
  const { data: relatedProducts = [], isLoading: isRelatedLoading } = useQuery({
    queryKey: ['relatedProducts', product?.categories?.[0]?._id],
    queryFn: async () => {
      try {
        // Make API call to get related products
        const params = new URLSearchParams()
        params.set('category', product.categories[0]._id)
        params.set('limit', '4')
        // Exclude current product
        params.set('exclude', product._id)
        
        const response = await axios.get(`/products?${params.toString()}`)
        return response.data.data || []
      } catch (error) {
        console.error('Error fetching related products:', error)
        return []
      }
    },
    enabled: !!product?.categories?.[0]?._id,
    refetchOnWindowFocus: false
  })
  
  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value)
    if (value > 0) {
      setQuantity(value)
    }
  }
  
  // Increment quantity
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1)
  }
  
  // Decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    if (!selectedSize) {
      toast.warning('Please select a size', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    if (!selectedColor) {
      toast.warning('Please select a color', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    // Check if product is in stock
    if (product.inventoryCount <= 0) {
      toast.error('This product is out of stock', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    // Create product object with basic details
    const productToAdd = {
      id: product._id,
      name: product.title,
      price: product.salePrice || product.price,
      image: product.images[0]
    }
    
    // Call addToCart with separate parameters as expected by the function
    addToCart(productToAdd, quantity, selectedSize, selectedColor)
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }
  
  // Wishlist handler

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your wishlist', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id)
      toast.info(`${product.title} removed from wishlist!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } else {
      addToWishlist({
        id: product._id,
        name: product.title,
        price: product.price,
        image: product.images[0],
        slug: product.slug
      })
      toast.success(`${product.title} added to wishlist!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    }
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-200 animate-pulse h-[600px] rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full mt-8"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded w-full mt-8"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Error Loading Product</h2>
          <p>We couldn't load the product details. Please try again later.</p>
          <Link to="/shop" className="inline-block mt-4">
            <Button variant="secondary">Return to Shop</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // If product not found
  if (!product) {
    return (
      <div className="container-custom py-12">
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm">
          <Link to="/" className="text-gray-500 hover:text-teal">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link to="/shop" className="text-gray-500 hover:text-teal">Shop</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <img 
                src={product.images[selectedImageIndex]} 
                alt={product.title} 
                className="w-full h-auto rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`bg-white p-2 rounded-lg shadow-sm cursor-pointer ${selectedImageIndex === index ? 'ring-2 ring-teal' : 'hover:ring-2 hover:ring-teal'} transition-all`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`${product.title} view ${index + 1}`} 
                    className="w-full h-auto rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Product Info */}
          <div>
            <motion.h1 
              className="text-3xl font-heading font-semibold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {product.title}
            </motion.h1>
            
            <motion.div 
              className="flex items-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* If rating is available */}
              {product.rating && (
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  {product.rating % 1 > 0 && (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
              )}
              {product.rating && product.reviewCount && (
                <span className="text-gray-600 ml-2">{product.rating} ({product.reviewCount} reviews)</span>
              )}
            </motion.div>
            
            <motion.div 
              className="text-2xl font-semibold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ₹{product.price.toFixed(2)}
              {product.salePrice && product.salePrice < product.price && (
                <span className="ml-2 text-sm text-red-500 line-through">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </motion.div>
            
            <motion.p 
              className="text-gray-600 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {product.description}
            </motion.p>
            
            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {/* Hardcoded sizes until backend provides them */}
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-md ${selectedSize === size ? 'bg-teal text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Color</h3>
              <div className="flex flex-wrap gap-2">
                {/* Hardcoded colors until backend provides them */}
                {['White', 'Black', 'Gray', 'Navy', 'Red'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-md ${selectedColor === color ? 'bg-teal text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
              <div className="flex items-center">
                <button 
                  type="button" 
                  className="w-10 h-10 rounded-l-md bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  onClick={decrementQuantity}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={handleQuantityChange}
                  className="w-16 h-10 text-center border-x-0 border-gray-300 focus:ring-0 focus:border-gray-300"
                />
                <button 
                  type="button" 
                  className="w-10 h-10 rounded-r-md bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  onClick={incrementQuantity}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                fullWidth 
                onClick={handleAddToCart}
                disabled={!isAuthenticated || product.inventoryCount <= 0}
              >
                {product.inventoryCount <= 0 ? 'Out of Stock' : isAuthenticated ? 'Add to Cart' : 'Login to Add to Cart'}
              </Button>
              <Button 
                variant="secondary" 
                fullWidth
                onClick={handleWishlist}
                disabled={!isAuthenticated}
              >
                {isAuthenticated ? (isInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist') : 'Login to Add to Wishlist'}
              </Button>
            </div>
            
            {/* Product Features */}
            {product.features && product.features.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium mb-4">Features</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-medium mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-heading font-semibold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isRelatedLoading ? (
              // Loading skeletons for related products
              [...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md">
                  <div className="w-full h-64 bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
                  </div>
                </div>
              ))
            ) : relatedProducts.length > 0 ? (
              relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <Link to={`/product/${relatedProduct.slug}`} className="block overflow-hidden">
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.title} 
                      className="w-full h-64 object-cover transition-transform hover:scale-105 duration-300"
                    />
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${relatedProduct.slug}`} className="block">
                      <h3 className="text-lg font-medium text-charcoal hover:text-teal transition-colors">{relatedProduct.title}</h3>
                    </Link>
                    <p className="text-gray-600 mt-1">₹{relatedProduct.price.toFixed(2)}</p>
                    <div className="mt-4">
                      {isAuthenticated ? (
                        <Button 
                          fullWidth 
                          onClick={() => addToCart({
                            id: relatedProduct._id,
                            name: relatedProduct.title,
                            price: relatedProduct.price,
                            image: relatedProduct.images[0]
                          }, 1, '', '')}
                        >
                          Add to Cart
                        </Button>
                      ) : (
                        <Button 
                          variant="secondary"
                          fullWidth 
                          onClick={() => {
                            addToWishlist({
                              id: relatedProduct._id,
                              name: relatedProduct.title,
                              price: relatedProduct.price,
                              image: relatedProduct.images[0],
                              slug: relatedProduct.slug
                            })
                            toast.success(`${relatedProduct.title} added to wishlist!`, {
                              position: "top-right",
                              autoClose: 3000,
                              hideProgressBar: false,
                              closeOnClick: true,
                              pauseOnHover: true,
                              draggable: true
                            })
                          }}
                        >
                          Add to Wishlist
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No related products found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
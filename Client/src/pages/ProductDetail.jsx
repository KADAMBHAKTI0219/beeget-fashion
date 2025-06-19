import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
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
  
  // Fetch product details with React Query
  const { data: product, isLoading, error } = useQuery(
    ['product', slug],
    async () => {
      // In a real app, this would be an API call to get product by slug
      // For now, we'll simulate a delay and return mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock product data
          const mockProduct = {
            id: 1,
            name: 'Classic White Tee',
            slug: 'classic-white-tee',
            price: 29.99,
            discount: 0,
            description: 'A timeless classic white t-shirt made from premium cotton. Perfect for everyday wear, this versatile piece can be dressed up or down for any occasion.',
            features: [
              'Made from 100% organic cotton',
              'Breathable and lightweight fabric',
              'Reinforced stitching for durability',
              'Pre-shrunk to maintain shape after washing',
              'Ethically manufactured'
            ],
            sizes: ['XS', 'S', 'M', 'L', 'XL'],
            colors: ['White', 'Black', 'Gray', 'Navy'],
            images: [
              productImages.tshirtWhite,
              productImages.tshirtBlack,
              productImages.tshirtNavy,
              productImages.tshirtGray,
              productImages.productDetailView
            ],
            category: 'women',
            inStock: true,
            rating: 4.5,
            reviewCount: 128,
            relatedProducts: [
              {
                id: 2,
                name: 'Slim Fit Jeans',
                price: 59.99,
                image: 'https://via.placeholder.com/300x400?text=Related+1',
                slug: 'slim-fit-jeans'
              },
              {
                id: 3,
                name: 'Summer Dress',
                price: 49.99,
                image: 'https://via.placeholder.com/300x400?text=Related+2',
                slug: 'summer-dress'
              },
              {
                id: 4,
                name: 'Casual Shirt',
                price: 34.99,
                image: 'https://via.placeholder.com/300x400?text=Related+3',
                slug: 'casual-shirt'
              }
            ]
          }
          
          resolve(mockProduct)
        }, 800)
      })
    }
  )
  
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
    
    // Create product object with basic details
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]
    }
    
    // Call addToCart with separate parameters as expected by the function
    addToCart(productToAdd, quantity, selectedSize, selectedColor)
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }
  
  // Wishlist handler
  const handleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      toast.info(`${product.name} removed from wishlist!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        slug: slug
      })
      toast.success(`${product.name} added to wishlist!`, {
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
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-auto rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className="bg-white p-2 rounded-lg shadow-sm cursor-pointer hover:ring-2 hover:ring-teal transition-all"
                >
                  <img 
                    src={image} 
                    alt={`${product.name} view ${index + 1}`} 
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
              {product.name}
            </motion.h1>
            
            <motion.div 
              className="flex items-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
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
              <span className="text-gray-600 ml-2">{product.rating} ({product.reviewCount} reviews)</span>
            </motion.div>
            
            <motion.div 
              className="text-2xl font-semibold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ${product.price.toFixed(2)}
              {product.discount > 0 && (
                <span className="ml-2 text-sm text-red-500 line-through">
                  ${(product.price / (1 - product.discount / 100)).toFixed(2)}
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
                {product.sizes.map((size) => (
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
                {product.colors.map((color) => (
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
                disabled={!product.inStock || !isAuthenticated}
              >
                {!product.inStock ? 'Out of Stock' : isAuthenticated ? 'Add to Cart' : 'Login to Add to Cart'}
              </Button>
              <Button 
                variant="secondary" 
                fullWidth
                onClick={handleWishlist}
              >
                {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
            
            {/* Product Features */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4">Features</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-heading font-semibold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {product.relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <Link to={`/product/${relatedProduct.slug}`} className="block overflow-hidden">
                  <img 
                    src={relatedProduct.image} 
                    alt={relatedProduct.name} 
                    className="w-full h-64 object-cover transition-transform hover:scale-105 duration-300"
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/product/${relatedProduct.slug}`} className="block">
                    <h3 className="text-lg font-medium text-charcoal hover:text-teal transition-colors">{relatedProduct.name}</h3>
                  </Link>
                  <p className="text-gray-600 mt-1">${relatedProduct.price.toFixed(2)}</p>
                  <div className="mt-4">
                    {isAuthenticated ? (
                      <Button 
                        fullWidth 
                        onClick={() => addToCart({
                          ...relatedProduct,
                          quantity: 1
                        })}
                      >
                        Add to Cart
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary"
                        fullWidth 
                        onClick={() => {
                          addToWishlist({
                            id: relatedProduct.id,
                            name: relatedProduct.name,
                            price: relatedProduct.price,
                            image: relatedProduct.image,
                            slug: relatedProduct.slug
                          })
                          toast.success(`${relatedProduct.name} added to wishlist!`, {
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
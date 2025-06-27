import { createContext, useState, useEffect } from 'react'
import axios from '../utils/api'
import { toast } from 'react-toastify'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState(null)
  
  // Check if user is authenticated
  useEffect(() => {
    const tokens = localStorage.getItem('tokens')
    setIsAuthenticated(!!tokens)
  }, [])
  
  // First, try to load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('cart')
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart))
      } catch (error) {
        console.error('Error parsing stored cart data:', error)
        // Clear invalid data
        localStorage.removeItem('cart')
      }
    }
  }, []) // Run only once on component mount
  
  // Then, fetch cart from backend if user is authenticated
  useEffect(() => {
    const fetchCartFromBackend = async () => {
      console.log('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated')
      if (!isAuthenticated) {
        console.log('Not fetching cart because user is not authenticated')
        return
      }
      
      // Check if token exists in localStorage
      const tokens = localStorage.getItem('tokens')
      console.log('Tokens in localStorage:', tokens ? 'Present' : 'Not present')
      
      try {
        setLoading(true)
        console.log('Attempting to fetch cart from backend...')
        const response = await axios.get('/cart')
        console.log('Cart fetch successful:', response.data)
        if (response.data.success) {
          // Transform backend cart format to frontend format
          const backendCart = response.data.data.items.map(item => ({
            id: item.productId._id,
            _id: item._id, // Store the cart item ID for future operations
            name: item.productDetails?.title || item.productId.title,
            title: item.productDetails?.title || item.productId.title,
            price: item.productDetails?.price || item.productId.price,
            image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
            slug: item.productDetails?.slug || item.productId.slug,
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
            addedAt: new Date().toISOString()
          }))
          setCart(backendCart)
          // Update localStorage with backend cart
          localStorage.setItem('cart', JSON.stringify(backendCart))
        }
      } catch (err) {
        console.error('Error fetching cart from backend:', err)
        console.log('Error status:', err.response?.status)
        console.log('Error message:', err.response?.data)
        // We already loaded from localStorage, so no need to do it again here
      } finally {
        setLoading(false)
      }
    }
    
    fetchCartFromBackend()
  }, [isAuthenticated]) // Only run when authentication status changes
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart))
    }
  }, [cart])
  
  // Add to cart
  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    try {
      setLoading(true)
      setError(null)
      
      // Ensure quantity is a valid number
      const parsedQuantity = parseInt(quantity, 10)
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        quantity = 1 // Set to default valid quantity
      } else {
        quantity = parsedQuantity
      }
      
      // Check if the product is already in the cart with the same size and color
      const existingItemIndex = cart.findIndex(item => 
        (item.id === product.id || item._id === product._id) && 
        (size ? item.size === size : true) && 
        (color ? item.color === color : true)
      )
      
      if (existingItemIndex !== -1) {
        // If product exists, update quantity instead of adding new item
        const newQuantity = cart[existingItemIndex].quantity + quantity
        return updateQuantity(product.id || product._id, newQuantity, size, color)
      }
      
      // Prepare the product object with additional properties
      const productToAdd = {
        ...product,
        quantity,
        size,
        color,
        addedAt: new Date().toISOString()
      }
      
      if (isAuthenticated) {
        // For authenticated users, add to backend
        const response = await axios.post('/cart', {
          productId: product.id || product._id,
          quantity,
          size,
          color
        })
        
        if (response.data.success) {
          // Transform backend cart format to frontend format
          const backendCart = response.data.data.items.map(item => ({
            id: item.productId._id,
            _id: item._id, // Store the cart item ID for future operations
            name: item.productDetails?.title || item.productId.title,
            title: item.productDetails?.title || item.productId.title,
            price: item.productDetails?.price || item.productId.price,
            slug: item.productDetails?.slug || item.productId.slug,
            image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
            addedAt: new Date().toISOString()
          }))
          
          // Update state and localStorage in one place
          setCart(backendCart)
          localStorage.setItem('cart', JSON.stringify(backendCart))
        }
      } else {
        // For non-authenticated users, use localStorage only
        const newCart = [...cart, productToAdd]
        
        // Update state and localStorage in one place
        setCart(newCart)
        localStorage.setItem('cart', JSON.stringify(newCart))
      }
      
      toast.success('Added to cart!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      
      // Dispatch custom event to open cart sidebar
      const event = new CustomEvent('openCartSidebar')
      window.dispatchEvent(event)
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      setError(error.message || 'Failed to add to cart')
      toast.error('Failed to add to cart. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Remove from cart
  const removeFromCart = async (itemId, size = null, color = null) => {
    try {
      setLoading(true)
      setError(null)
      
      if (isAuthenticated) {
        // For authenticated users, remove from backend
        // First find the cart item that matches the criteria
        const cartItem = cart.find(item => 
          (item.id === itemId || item._id === itemId) && 
          (size ? item.size === size : true) && 
          (color ? item.color === color : true)
        )
        
        if (cartItem) {
          // For backend, we need the cart item ID, not the product ID
          const response = await axios.delete(`/cart/${cartItem._id}`)
          
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = response.data.data.items.map(item => ({
              id: item.productId._id,
              _id: item._id, // Store the cart item ID for future operations
              name: item.productId.title,
              title: item.productId.title,
              price: item.productId.price,
              image: item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null,
              quantity: item.quantity,
              size: item.size || null,
              color: item.color || null,
              addedAt: new Date().toISOString()
            }))
            
            // Update state and localStorage in one place
            setCart(backendCart)
            localStorage.setItem('cart', JSON.stringify(backendCart))
            
            toast.success('Item removed from cart!', {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true
            })
          }
        } else {
          throw new Error('Cart item not found')
        }
      } else {
        // For non-authenticated users, use localStorage only
        // Fix the filter logic to correctly remove items
        const filteredCart = cart.filter(item => 
          !((item.id === itemId || item._id === itemId) && 
            (!size || item.size === size) && 
            (!color || item.color === color))
        )
        
        // Update state and localStorage in one place
        setCart(filteredCart)
        localStorage.setItem('cart', JSON.stringify(filteredCart))
        
        toast.success('Item removed from cart!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      setError(error.message || 'Failed to remove item from cart')
      toast.error('Failed to remove item from cart. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Update quantity
  const updateQuantity = async (itemId, quantity, size = null, color = null) => {
    try {
      setLoading(true)
      setError(null)
      
      // Ensure quantity is a valid number
      const parsedQuantity = parseInt(quantity, 10)
      
      // If quantity is invalid, set to 1
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        // If quantity is 0 or less, remove the item
        if (parsedQuantity <= 0) {
          return removeFromCart(itemId, size, color)
        }
        // Otherwise set to minimum valid quantity
        quantity = 1
      } else {
        // Use the parsed quantity
        quantity = parsedQuantity
      }
      
      if (isAuthenticated) {
        // For authenticated users, update on backend
        // First find the cart item that matches the criteria
        const cartItem = cart.find(item => 
          (item.id === itemId || item._id === itemId) && 
          (size ? item.size === size : true) && 
          (color ? item.color === color : true)
        )
        
        if (cartItem) {
          // For backend, we need the cart item ID, not the product ID
          // cartItem._id should be the cart item ID from the backend
          const response = await axios.patch(`/cart/${cartItem._id}`, { quantity })
          
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = response.data.data.items.map(item => ({
              id: item.productId._id,
              _id: item._id, // Store the cart item ID for future operations
              name: item.productId.title,
              title: item.productId.title,
              price: item.productId.price,
              image: item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null,
              quantity: item.quantity,
              size: item.size || null,
              color: item.color || null,
              addedAt: new Date().toISOString()
            }))
            
            // Update state and localStorage in one place
            setCart(backendCart)
            localStorage.setItem('cart', JSON.stringify(backendCart))
            
            toast.success('Cart updated!', {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true
            })
          }
        } else {
          throw new Error('Cart item not found')
        }
      } else {
        // For non-authenticated users, use localStorage only
        const updatedCart = cart.map(item => {
          if ((item.id === itemId || item._id === itemId) && 
              (size ? item.size === size : true) && 
              (color ? item.color === color : true)) {
            return { ...item, quantity }
          }
          return item
        })
        
        // Update state and localStorage in one place
        setCart(updatedCart)
        localStorage.setItem('cart', JSON.stringify(updatedCart))
        
        toast.success('Cart updated!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      setError(error.message || 'Failed to update cart')
      toast.error('Failed to update cart. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Clear cart
  const clearCart = async () => {
    try {
          setError(null)
      
      if (isAuthenticated) {
        // For authenticated users, make a single API call to clear all items
        // This requires a backend endpoint that can clear the entire cart
        // If such endpoint doesn't exist, we can use a more efficient approach
        
        // Option 1: If there's a dedicated clear cart endpoint
        try {
          // Assuming there's an endpoint to clear the entire cart
          // If this endpoint doesn't exist, this will throw an error and we'll use Option 2
          const response = await axios.delete('/cart')
          if (response.data.success) {
            setCart([])
            localStorage.removeItem('cart')
          }
        } catch (clearError) {
          console.log('No clear cart endpoint, removing items individually')
          // Option 2: More efficient individual removal
          // Instead of awaiting each removal, we can use Promise.all to remove items in parallel
          const removalPromises = cart.map(item => 
            axios.delete(`/cart/${item._id}`).catch(e => console.error(`Failed to remove item ${item._id}:`, e))
          )
          
          // Wait for all removals to complete
          await Promise.all(removalPromises)
          setCart([])
          localStorage.removeItem('cart')
        }
      } else {
        // For non-authenticated users, simply clear localStorage
        localStorage.removeItem('cart')
        setCart([])
      }
      
      toast.success('Cart cleared!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } catch (error) {
      console.error('Error clearing cart:', error)
      setError(error.message || 'Failed to clear cart')
      toast.error('Failed to clear cart. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Get cart total
  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      // Ensure price is a number
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
      // Ensure quantity is a number
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
      return total + (price * quantity)
    }, 0)
    
    // Apply coupon discount if available
    return subtotal - couponDiscount
  }
  
  // Get cart subtotal (without discount)
  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      // Ensure price is a number
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
      // Ensure quantity is a number
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
      return total + (price * quantity)
    }, 0)
  }
  
  // Get cart item count
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }
  
  // Apply coupon code
  const applyCoupon = async (code) => {
    try {
      setCouponError(null)
      setLoading(true)
      
      if (!code) {
        setCouponError('Please enter a coupon code')
        return { success: false, error: 'Please enter a coupon code' }
      }
      
      // Verify coupon with backend
      const response = await axios.post('/promotions/verify-coupon', { couponCode: code })
      
      if (response.data.success) {
        const { discountType, discountValue, minimumPurchase } = response.data.data
        
        // Check minimum purchase requirement
        const subtotal = getCartSubtotal()
        if (minimumPurchase && subtotal < minimumPurchase) {
          setCouponError(`Minimum purchase of ₹${minimumPurchase.toFixed(2)} required for this coupon`)
          setCouponCode('')
          setCouponDiscount(0)
          return { 
            success: false, 
            error: `Minimum purchase of ₹${minimumPurchase.toFixed(2)} required for this coupon` 
          }
        }
        
        // Calculate discount
        let discount = 0
        if (discountType === 'percentage') {
          discount = (subtotal * discountValue) / 100
        } else { // fixed amount
          discount = discountValue
        }
        
        // Ensure discount doesn't exceed the total
        if (discount > subtotal) {
          discount = subtotal
        }
        
        setCouponCode(code)
        setCouponDiscount(discount)
        
        toast.success(`Coupon applied! You saved ₹${discount.toFixed(2)}`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })
        
        return { 
          success: true, 
          data: { 
            couponCode: code, 
            discount, 
            discountType, 
            discountValue 
          } 
        }
      } else {
        setCouponError(response.data.error || 'Invalid coupon code')
        setCouponCode('')
        setCouponDiscount(0)
        return { success: false, error: response.data.error || 'Invalid coupon code' }
      }
    } catch (err) {
      console.error('Error applying coupon:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to apply coupon'
      setCouponError(errorMessage)
      setCouponCode('')
      setCouponDiscount(0)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }
  
  // Remove coupon
  const removeCoupon = () => {
    setCouponCode('')
    setCouponDiscount(0)
    setCouponError(null)
    
    toast.info('Coupon removed', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    })
    
    return { success: true }
  }

  // Checkout function
  const checkout = async (orderData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if cart is empty
      if (cart.length === 0) {
        setError('Your cart is empty. Please add items to your cart before checkout.')
        toast.error('Your cart is empty. Please add items to your cart before checkout.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })
        return { success: false, error: 'Cart is empty' }
      }
      
      // Calculate subtotal and total
      const subtotal = getCartSubtotal()
      const total = getCartTotal()
      
      // Make a real API call to create an order
      const response = await axios.post('/orders', { 
        ...orderData, 
        items: cart.map(item => ({
          productId: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null
        })),
        couponCode: couponCode || null,
        subtotal,
        total
      })
      
      if (response.data.success) {
        // Clear cart after successful checkout
        await clearCart()
        
        toast.success('Order placed successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })
        
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.error || 'Failed to complete checkout')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to complete checkout. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartSubtotal,
        getCartItemCount,
        checkout,
        couponCode,
        couponDiscount,
        couponError,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartContext
import { createContext, useState, useEffect } from 'react'
import axios from '../utils/api'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Initialize cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('cart')
    if (storedCart) {
      setCart(JSON.parse(storedCart))
    }
  }, [])
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])
  
  // Add item to cart
  const addToCart = (product, quantity = 1, size = null, color = null) => {
    setCart(prevCart => {
      // Check if product already exists in cart
      const existingItemIndex = prevCart.findIndex(
        item => item.id === product.id && 
               (size ? item.size === size : true) && 
               (color ? item.color === color : true)
      )
      
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedCart = [...prevCart]
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        }
        return updatedCart
      } else {
        // Add new item to cart
        return [...prevCart, {
          ...product,
          quantity,
          size,
          color,
          addedAt: new Date().toISOString()
        }]
      }
    })
  }
  
  // Remove item from cart
  const removeFromCart = (itemId, size = null, color = null) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.id === itemId && 
          (size ? item.size === size : true) && 
          (color ? item.color === color : true))
      )
    )
  }
  
  // Update item quantity
  const updateQuantity = (itemId, quantity, size = null, color = null) => {
    if (quantity <= 0) {
      removeFromCart(itemId, size, color)
      return
    }
    
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === itemId && 
            (size ? item.size === size : true) && 
            (color ? item.color === color : true)) {
          return { ...item, quantity }
        }
        return item
      })
    })
  }
  
  // Clear cart
  const clearCart = () => {
    setCart([])
  }
  
  // Get cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  }
  
  // Get cart item count
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }
  
  // Checkout function
  const checkout = async (orderData) => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real app, this would be an API call
      // For now, we'll simulate a successful checkout with mock data
      // const response = await axios.post('/orders', { ...orderData, items: cart })
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock response data
      const mockResponse = {
        data: {
          orderId: `ORD-${Date.now()}`,
          status: 'confirmed',
          total: getCartTotal(),
          items: [...cart]
        }
      }
      
      // Clear cart after successful checkout
      clearCart()
      
      return { success: true, data: mockResponse.data }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.response?.data?.message || 'Failed to complete checkout. Please try again.')
      return { success: false, error: err.response?.data?.message || 'Failed to complete checkout' }
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
        getCartItemCount,
        checkout
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartContext
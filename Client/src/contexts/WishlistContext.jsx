import { createContext, useState, useEffect } from 'react'
import axios from '../utils/api'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Initialize wishlist from localStorage
  useEffect(() => {
    const storedWishlist = localStorage.getItem('wishlist')
    if (storedWishlist) {
      try {
        setWishlist(JSON.parse(storedWishlist))
      } catch (error) {
        console.error('Error parsing stored wishlist data:', error)
        // Clear invalid data
        localStorage.removeItem('wishlist')
      }
    }
  }, [])
  
  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist))
  }, [wishlist])
  
  // Add item to wishlist
  const addToWishlist = (product) => {
    setWishlist(prevWishlist => {
      // Use _id if available, otherwise use id
      const productId = product._id || product.id
      
      // Check if product already exists in wishlist
      const existingItemIndex = prevWishlist.findIndex(item => {
        const itemId = item._id || item.id
        return itemId === productId
      })
      
      if (existingItemIndex !== -1) {
        // Item already in wishlist, no need to add again
        return prevWishlist
      } else {
        // Add new item to wishlist
        return [...prevWishlist, {
          ...product,
          addedAt: new Date().toISOString()
        }]
      }
    })
  }
  
  // Remove item from wishlist
  const removeFromWishlist = (itemId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => {
      const id = item._id || item.id
      return id !== itemId
    }))
  }
  
  // Check if item is in wishlist
  const isInWishlist = (itemId) => {
    return wishlist.some(item => {
      const id = item._id || item.id
      return id === itemId
    })
  }
  
  // Clear wishlist
  const clearWishlist = () => {
    setWishlist([])
  }
  
  // Get wishlist item count
  const getWishlistItemCount = () => {
    return wishlist.length
  }
  
  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistItemCount
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export default WishlistContext
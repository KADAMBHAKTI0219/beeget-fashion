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
      setWishlist(JSON.parse(storedWishlist))
    }
  }, [])
  
  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist))
  }, [wishlist])
  
  // Add item to wishlist
  const addToWishlist = (product) => {
    setWishlist(prevWishlist => {
      // Check if product already exists in wishlist
      const existingItemIndex = prevWishlist.findIndex(item => item.id === product.id)
      
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
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== itemId))
  }
  
  // Check if item is in wishlist
  const isInWishlist = (itemId) => {
    return wishlist.some(item => item.id === itemId)
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
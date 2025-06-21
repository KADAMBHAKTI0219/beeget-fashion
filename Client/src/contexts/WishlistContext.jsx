import { createContext, useState, useEffect, useContext } from 'react'
import axios from '../utils/api'
import { AuthContext } from './AuthContext'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const { isAuthenticated } = useContext(AuthContext)
  
  // Fetch wishlist from API if authenticated, otherwise from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist()
    } else {
      // Initialize from localStorage when not authenticated
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
    }
  }, [isAuthenticated])
  
  // Save wishlist to localStorage whenever it changes (for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
    }
  }, [wishlist, isAuthenticated])

  // Auto-retry mechanism for network errors
  useEffect(() => {
    // Only retry if there's an error and we're authenticated
    if (error && isAuthenticated && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Retrying wishlist operation (attempt ${retryCount + 1})...`)
        // Reset error before retry
        setError(null)
        // Increment retry count
        setRetryCount(prev => prev + 1)
        // Retry fetch
        fetchWishlist(true) // true indicates this is a retry
      }, 2000 * (retryCount + 1)) // Exponential backoff
      
      return () => clearTimeout(retryTimer)
    }
  }, [error, isAuthenticated, retryCount])
  
  // Fetch wishlist from API
  const fetchWishlist = async (isRetry = false) => {
    if (!isAuthenticated) return
    
    if (!isRetry) {
      setRetryCount(0) // Reset retry count for new operations
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.time('fetchWishlist')
      const response = await axios.get('/wishlist')
      console.timeEnd('fetchWishlist')
      
      if (response.data.success) {
        setWishlist(response.data.data)
        
        // Also update localStorage for offline access
        localStorage.setItem('wishlist', JSON.stringify(response.data.data))
        console.log('Updated localStorage with latest wishlist data from server')
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err)
      
      // Provide more specific error messages based on error type
      if (err.code === 'ERR_NETWORK') {
        setError('Network connection error. Please check your internet connection and server status.')
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server is taking too long to respond.')
      } else if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`)
      } else {
        setError('Failed to fetch wishlist')
      }
      
      // Fallback to local storage if available and this is a network error
      if ((err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') && localStorage.getItem('wishlist')) {
        try {
          console.log('Using cached wishlist from localStorage due to network error')
          const cachedWishlist = JSON.parse(localStorage.getItem('wishlist'))
          setWishlist(cachedWishlist)
        } catch (cacheErr) {
          console.error('Error using cached wishlist:', cacheErr)
        }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Add item to wishlist
  const addToWishlist = async (product) => {
    // Use _id if available, otherwise use id
    const productId = product._id || product.id;
    
    // Log the product and productId for debugging
    console.log('Adding to wishlist, product:', product);
    console.log('Using productId:', productId);
    
    // Check if product already exists in wishlist
    if (isInWishlist(productId)) {
      console.log('Product already in wishlist, skipping');
      return; // Already in wishlist
    }
    
    if (isAuthenticated) {
      // Add to API if authenticated
      setLoading(true);
      setError(null);
      setRetryCount(0); // Reset retry count for new operations
      
      try {
        console.time('addToWishlist');
        const response = await axios.post('/wishlist', { productId });
        console.timeEnd('addToWishlist');
        
        if (response.data.success) {
          setWishlist(response.data.data);
          
          // Also update localStorage for offline access
          localStorage.setItem('wishlist', JSON.stringify(response.data.data));
          console.log('Updated localStorage with latest wishlist data from server');
        }
      } catch (err) {
        console.error('Error adding to wishlist:', err);
        
        // Provide more specific error messages based on error type
        if (err.code === 'ERR_NETWORK') {
          setError('Network connection error. Please check your internet connection and server status.');
          
          // Add to local storage as fallback
          setWishlist(prevWishlist => {
            const newWishlist = [...prevWishlist, {
              ...product,
              productId: productId, // Ensure productId is set correctly for MongoDB format
              addedAt: new Date().toISOString()
            }];
            localStorage.setItem('wishlist', JSON.stringify(newWishlist));
            console.log('Added to localStorage wishlist as fallback');
            return newWishlist;
          });
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timed out. The server is taking too long to respond.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
        } else {
          setError('Failed to add item to wishlist');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Add to local storage if not authenticated
      setWishlist(prevWishlist => {
        const newWishlist = [...prevWishlist, {
          ...product,
          productId: productId, // Ensure productId is set correctly for MongoDB format
          addedAt: new Date().toISOString()
        }];
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        console.log('Added to localStorage wishlist (unauthenticated)');
        return newWishlist;
      });
    }
  };
  
  // Remove item from wishlist
  const removeFromWishlist = async (itemId) => {
    if (isAuthenticated) {
      // Remove from API if authenticated
      setLoading(true)
      setError(null)
      setRetryCount(0) // Reset retry count for new operations
      
      try {
        console.time('removeFromWishlist')
        const response = await axios.delete(`/wishlist/${itemId}`)
        console.timeEnd('removeFromWishlist')
        
        if (response.data.success) {
          // Update wishlist with the response data (which should only contain the remaining items)
          setWishlist(response.data.data)
          
          // Also update localStorage for offline access
          localStorage.setItem('wishlist', JSON.stringify(response.data.data))
          console.log('Updated localStorage with latest wishlist data from server')
        }
      } catch (err) {
        console.error('Error removing from wishlist:', err)
        
        // Provide more specific error messages based on error type
        if (err.code === 'ERR_NETWORK') {
          setError('Network connection error. Please check your internet connection and server status.')
          
          // Remove from local state anyway to improve UX
          setWishlist(prevWishlist => {
            const newWishlist = prevWishlist.filter(item => {
              // Check all possible ID formats
              const id = item._id || item.id || (item.productId && (item.productId._id || item.productId))
              return id !== itemId
            })
            localStorage.setItem('wishlist', JSON.stringify(newWishlist))
            console.log('Removed from localStorage wishlist as fallback')
            return newWishlist
          })
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timed out. The server is taking too long to respond.')
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`)
        } else {
          setError('Failed to remove item from wishlist')
        }
      } finally {
        setLoading(false)
      }
    } else {
      // Remove from local storage if not authenticated
      setWishlist(prevWishlist => {
        const newWishlist = prevWishlist.filter(item => {
          // Check all possible ID formats
          const id = item._id || item.id || (item.productId && (item.productId._id || item.productId))
          return id !== itemId
        })
        localStorage.setItem('wishlist', JSON.stringify(newWishlist))
        console.log('Removed from localStorage wishlist (unauthenticated)')
        return newWishlist
      })
    }
  }
  
  // Check if item is in wishlist
  const isInWishlist = (itemId) => {
    return wishlist.some(item => {
      // Check all possible ID formats
      const id = item._id || item.id || (item.productId && (item.productId._id || item.productId))
      return id === itemId
    })
  }
  
  // Clear wishlist
  const clearWishlist = async () => {
    if (isAuthenticated) {
      // Clear from API if authenticated
      setLoading(true)
      setError(null)
      setRetryCount(0) // Reset retry count for new operations
      
      try {
        console.time('clearWishlist')
        const response = await axios.delete('/wishlist')
        console.timeEnd('clearWishlist')
        
        if (response.data.success) {
          setWishlist([])
          
          // Also update localStorage for offline access
          localStorage.setItem('wishlist', JSON.stringify([]))
          console.log('Cleared wishlist in localStorage')
        }
      } catch (err) {
        console.error('Error clearing wishlist:', err)
        
        // Provide more specific error messages based on error type
        if (err.code === 'ERR_NETWORK') {
          setError('Network connection error. Please check your internet connection and server status.')
          
          // Clear local state anyway to improve UX
          setWishlist([])
          localStorage.setItem('wishlist', JSON.stringify([]))
          console.log('Cleared wishlist in localStorage as fallback')
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timed out. The server is taking too long to respond.')
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`)
        } else {
          setError('Failed to clear wishlist')
        }
      } finally {
        setLoading(false)
      }
    } else {
      // Clear local storage if not authenticated
      setWishlist([])
      localStorage.setItem('wishlist', JSON.stringify([]))
      console.log('Cleared wishlist in localStorage (unauthenticated)')
    }
  }
  
  // Retry the last failed operation
  const retryOperation = () => {
    if (error) {
      setError(null)
      fetchWishlist(true)
    }
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
        getWishlistItemCount,
        retryOperation
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export default WishlistContext
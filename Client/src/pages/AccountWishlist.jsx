import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import useWishlist from '../hooks/useWishlist'
import useCart from '../hooks/useCart'
import Button from '../components/Common/Button'

const AccountWishlist = () => {
  const { wishlist, loading, error, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [isClearing, setIsClearing] = useState(false)

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }, [error])

  // Add to cart handler
  const handleAddToCart = (item) => {
    const productToAdd = {
      id: item.productId._id || item.productId,
      name: item.productId.title,
      price: item.productId.salePrice || item.productId.price,
      image: item.productId.images?.[0] || ''
    }
    
    addToCart(productToAdd, 1)
    toast.success(`${item.productId.title} added to cart!`, {
      position: "top-right",
      autoClose: 3000,
    })
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }

  // Remove from wishlist handler
  const handleRemove = (itemId) => {
    console.log('Removing item from wishlist with ID:', itemId)
    removeFromWishlist(itemId)
  }

  // Clear wishlist handler
  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      setIsClearing(true)
      clearWishlist()
      setIsClearing(false)
      toast.info('Wishlist cleared!', {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-semibold">My Wishlist</h2>
          {wishlist.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearWishlist}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Clear Wishlist'}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">Your wishlist is empty</h3>
            <p className="mt-2 text-gray-500">Browse our collection and add items to your wishlist</p>
            <Link to="/shop">
              <Button className="mt-6">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <Link to={`/product/${item.productId.slug}`} className="block h-48 overflow-hidden">
                  <img 
                    src={item.productId.images?.[0] || '/placeholder-product.jpg'} 
                    alt={item.productId.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </Link>
                
                {/* Product Info */}
                <div className="p-4">
                  <Link to={`/product/${item.productId.slug}`} className="block">
                    <h3 className="text-lg font-medium text-gray-800 hover:text-teal-600 transition-colors">
                      {item.productId.title}
                    </h3>
                  </Link>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div>
                      {item.productId.salePrice ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-teal-600">
                            ₹{item.productId.salePrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.productId.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-semibold text-gray-800">
                          ₹{item.productId.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.productId.stock || item.productId.stock <= 0}
                    >
                      {!item.productId.stock || item.productId.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-none"
                      onClick={() => handleRemove(item.productId._id || (typeof item.productId === 'object' ? item.productId._id : item.productId))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default AccountWishlist
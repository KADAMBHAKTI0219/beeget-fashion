import { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBagIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline'
import AuthContext from '../../contexts/AuthContext'
import CartContext from '../../contexts/CartContext'
import logoImage from '../../assets/WhatsApp_Image_2025-06-18_at_4.21.26_PM-removebg-preview.png'
import CartOffcanvas from '../Cart/CartOffcanvas'
import NavbarOffcanvas from './NavbarOffcanvas'

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { isAuthenticated, isAdmin, user, logout } = useContext(AuthContext)
  const { cart, getCartItemCount } = useContext(CartContext)
  const navigate = useNavigate()
  
  // Toggle navbar offcanvas
  const toggleNavbar = () => {
    setNavbarOpen(!navbarOpen)
  }
  
  // Close navbar offcanvas
  const closeNavbar = () => {
    setNavbarOpen(false)
  }
  
  // Toggle cart sidebar
  const toggleCart = () => {
    setCartOpen(!cartOpen)
  }
  
  // Close cart sidebar
  const closeCart = () => {
    setCartOpen(false)
  }
  
  // Listen for custom openCart event
  useEffect(() => {
    const handleOpenCart = () => {
      setCartOpen(true)
    }
    
    document.addEventListener('openCart', handleOpenCart)
    return () => document.removeEventListener('openCart', handleOpenCart)
  }, [])
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="grid grid-cols-3 items-center">
          {/* Menu Button (Left) */}
          <div className="flex justify-start">
            <button 
              className="p-2" 
              onClick={toggleNavbar}
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6 text-java-800" />
            </button>
          </div>
          
          {/* Logo (Center) */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center">
              <img src={logoImage} alt="Beeget Fashion" className="h-10" />
            </Link>
          </div>
          
          {/* User Actions (Right) */}
          <div className="flex items-center justify-end space-x-4">
            {/* Cart Icon with Item Count */}
            <button 
              onClick={toggleCart} 
              className="relative p-2 text-java-800 hover:text-java-400 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-java-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
            
            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 p-2"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                >
                  <UserIcon className="h-6 w-6 text-java-800 hover:text-java-400 transition-colors" />
                  <span className="hidden lg:inline text-sm">
                    {user?.firstName || 'Account'}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ${dropdownOpen ? 'block' : 'hidden'}`}>
                  <Link 
                    to="/account" 
                    className="block px-4 py-2 text-sm text-java-800 hover:bg-java-50"
                  >
                    My Profile
                  </Link>                
                  {isAdmin && (
                    <Link 
                      to="/admin/dashboard" 
                      className="block px-4 py-2 text-sm text-java-800 hover:bg-java-50"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={logout} 
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-java-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-java-800 hover:text-java-400 transition-colors"
              >
                <UserIcon className="h-6 w-6" />
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Cart Offcanvas */}
      <CartOffcanvas isOpen={cartOpen} onClose={closeCart} />
      
      {/* Navbar Offcanvas */}
      <NavbarOffcanvas isOpen={navbarOpen} onClose={closeNavbar} />
    </header>
  )
}

export default Header
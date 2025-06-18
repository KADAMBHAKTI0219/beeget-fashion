import { useState, useContext } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingBagIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import AuthContext from '../../contexts/AuthContext'
import CartContext from '../../contexts/CartContext'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, user, logout } = useContext(AuthContext)
  const { cart } = useContext(CartContext)
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }
  
  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
            <span className="font-logo text-2xl text-teal">Beeget</span>
            <span className="font-heading text-xl ml-1">Fashion</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
              }
            >
              Home
            </NavLink>
            <NavLink 
              to="/shop" 
              className={({ isActive }) => 
                isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
              }
            >
              Shop
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
              }
            >
              About
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
              }
            >
              Contact
            </NavLink>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon with Item Count */}
            <Link to="/cart" className="relative p-2">
              <ShoppingBagIcon className="h-6 w-6 text-charcoal hover:text-teal transition-colors" />
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.totalItems}
                </span>
              )}
            </Link>
            
            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-1 p-2">
                  <UserIcon className="h-6 w-6 text-charcoal hover:text-teal transition-colors" />
                  <span className="hidden lg:inline text-sm">
                    {user?.firstName || 'Account'}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <Link 
                    to="/account/profile" 
                    className="block px-4 py-2 text-sm text-charcoal hover:bg-gray-100"
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/account/orders" 
                    className="block px-4 py-2 text-sm text-charcoal hover:bg-gray-100"
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin/dashboard" 
                      className="block px-4 py-2 text-sm text-charcoal hover:bg-gray-100"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={logout} 
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden md:block text-charcoal hover:text-teal transition-colors"
              >
                Login / Register
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-charcoal" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-charcoal" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                }
                onClick={closeMobileMenu}
              >
                Home
              </NavLink>
              <NavLink 
                to="/shop" 
                className={({ isActive }) => 
                  isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                }
                onClick={closeMobileMenu}
              >
                Shop
              </NavLink>
              <NavLink 
                to="/about" 
                className={({ isActive }) => 
                  isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                }
                onClick={closeMobileMenu}
              >
                About
              </NavLink>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => 
                  isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                }
                onClick={closeMobileMenu}
              >
                Contact
              </NavLink>
              
              {!isAuthenticated && (
                <NavLink 
                  to="/login" 
                  className={({ isActive }) => 
                    isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                  }
                  onClick={closeMobileMenu}
                >
                  Login / Register
                </NavLink>
              )}
              
              {isAuthenticated && (
                <>
                  <NavLink 
                    to="/account/profile" 
                    className={({ isActive }) => 
                      isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                    }
                    onClick={closeMobileMenu}
                  >
                    My Profile
                  </NavLink>
                  <NavLink 
                    to="/account/orders" 
                    className={({ isActive }) => 
                      isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                    }
                    onClick={closeMobileMenu}
                  >
                    My Orders
                  </NavLink>
                  {isAdmin && (
                    <NavLink 
                      to="/admin/dashboard" 
                      className={({ isActive }) => 
                        isActive ? 'text-teal font-medium' : 'text-charcoal hover:text-teal transition-colors'
                      }
                      onClick={closeMobileMenu}
                    >
                      Admin Dashboard
                    </NavLink>
                  )}
                  <button 
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }} 
                    className="text-left text-red-600 hover:text-red-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
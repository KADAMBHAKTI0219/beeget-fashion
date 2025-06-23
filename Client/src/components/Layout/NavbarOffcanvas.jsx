import { useEffect, useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { XMarkIcon, HomeIcon, ShoppingBagIcon, UserIcon, InformationCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import AuthContext from '../../contexts/AuthContext'

const NavbarOffcanvas = ({ isOpen, onClose }) => {
  const { isAuthenticated, isAdmin, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  
  // Close navbar when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])
  
  // Prevent scrolling when navbar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])
  
  // Handle logout
  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Navbar panel */}
          <motion.div
            className="fixed top-0 left-0 h-full w-full sm:w-80 bg-white shadow-lg z-50 flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between p-4 border-b border-gray-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h2 
                className="text-xl font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Menu
              </motion.h2>
              <motion.button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <XMarkIcon className="h-6 w-6" />
              </motion.button>
            </motion.div>
            
            {/* Navigation Links */}
            <motion.div className="flex-grow overflow-y-auto py-4 px-4">
              <motion.nav 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.3
                    }
                  }
                }}
              >
                {/* Main Navigation */}
                <motion.div 
                  className="space-y-2"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <HomeIcon className="h-5 w-5 mr-3" />
                      Home
                    </NavLink>
                  </motion.div>
                  
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/shop" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <ShoppingBagIcon className="h-5 w-5 mr-3" />
                      Shop
                    </NavLink>
                  </motion.div>
                  
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/about" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <InformationCircleIcon className="h-5 w-5 mr-3" />
                      About
                    </NavLink>
                  </motion.div>
                  
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/contact" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <EnvelopeIcon className="h-5 w-5 mr-3" />
                      Contact
                    </NavLink>
                  </motion.div>
                </motion.div>
                
                {/* User Account Section */}
                <motion.div 
                  className="pt-4 mt-4 border-t border-gray-200"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { delay: 0.2 } }
                  }}
                >
                  <motion.h3 
                    className="text-sm font-medium text-gray-500 mb-2"
                    variants={{
                      hidden: { y: 10, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    Your Account
                  </motion.h3>
                  
                  {!isAuthenticated ? (
                    <motion.div
                      variants={{
                        hidden: { x: -20, opacity: 0 },
                        visible: { x: 0, opacity: 1 }
                      }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <NavLink 
                        to="/login" 
                        className={({ isActive }) => 
                          `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                        }
                        onClick={onClose}
                      >
                        <UserIcon className="h-5 w-5 mr-3" />
                        Login / Register
                      </NavLink>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="space-y-2"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                    >
                      {/* User Info */}
                      <motion.div 
                        className="p-3 bg-java-50 rounded-lg mb-2"
                        variants={{
                          hidden: { y: 10, opacity: 0 },
                          visible: { y: 0, opacity: 1 }
                        }}
                      >
                        <motion.p 
                          className="font-medium"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                          }}
                        >
                          {user?.firstName} {user?.lastName}
                        </motion.p>
                        <motion.p 
                          className="text-sm text-gray-600"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { delay: 0.1 } }
                          }}
                        >
                          {user?.email}
                        </motion.p>
                      </motion.div>
                      
                      {/* Account Links */}
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/account/profile" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <UserIcon className="h-5 w-5 mr-3" />
                          My Profile
                        </NavLink>
                      </motion.div>
                      
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/account/orders" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <ShoppingBagIcon className="h-5 w-5 mr-3" />
                          My Orders
                        </NavLink>
                      </motion.div>
                      
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/account/wishlist" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <ShoppingBagIcon className="h-5 w-5 mr-3" />
                          My Wishlist
                        </NavLink>
                      </motion.div>
                      
                      {/* Admin Dashboard Link */}
                      {isAdmin && (
                        <motion.div
                          variants={{
                            hidden: { x: -20, opacity: 0 },
                            visible: { x: 0, opacity: 1 }
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <NavLink 
                            to="/admin/dashboard" 
                            className={({ isActive }) => 
                              `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                            }
                            onClick={onClose}
                          >
                            <UserIcon className="h-5 w-5 mr-3" />
                            Admin Dashboard
                          </NavLink>
                        </motion.div>
                      )}
                      
                      {/* Logout Button */}
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <button 
                          onClick={handleLogout}
                          className="flex items-center p-2 rounded-lg w-full text-left text-red-600 hover:bg-gray-100"
                        >
                          <XMarkIcon className="h-5 w-5 mr-3" />
                          Logout
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.nav>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NavbarOffcanvas
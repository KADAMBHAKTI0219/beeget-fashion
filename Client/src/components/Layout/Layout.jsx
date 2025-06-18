import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import NotificationBar from './NotificationBar'

const Layout = () => {
  const [notification, setNotification] = useState(null)
  
  // Example notification - in a real app, this would come from a context or prop
  useEffect(() => {
    // Show a welcome notification when the component mounts
    setNotification({
      type: 'info',
      message: 'Welcome to Beeget Fashion! Free shipping on orders over $50.',
      duration: 5000 // Auto-dismiss after 5 seconds
    })
    
    // Auto-dismiss notification after duration
    if (notification?.duration) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, notification.duration)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  // Function to dismiss notification manually
  const dismissNotification = () => {
    setNotification(null)
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Notification bar */}
      {notification && (
        <NotificationBar 
          type={notification.type} 
          message={notification.message} 
          onDismiss={dismissNotification} 
        />
      )}
      
      {/* Header */}
      <Header />
      
      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Layout
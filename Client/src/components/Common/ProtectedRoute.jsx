import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // If admin route but user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }
  
  // Render child routes
  return <Outlet />
}

export default ProtectedRoute
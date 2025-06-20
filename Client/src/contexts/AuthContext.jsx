import { createContext, useState, useEffect } from 'react'
import axios from '../utils/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedTokens = localStorage.getItem('tokens')
    
    if (storedUser && storedTokens) {
      try {
        const parsedUser = JSON.parse(storedUser)
        const parsedTokens = JSON.parse(storedTokens)
        
        setUser(parsedUser)
        setTokens(parsedTokens)
        
        // Set authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.accessToken}`
      } catch (error) {
        console.error('Error parsing stored auth data:', error)
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('tokens')
      }
    }
    
    setLoading(false)
  }, [])

  // Login function
  const login = async (email, password, autoLoginData = null) => {
    try {
      setLoading(true)
      setError(null)
      
      // अगर autoLoginData है तो API कॉल को बायपास करें
      if (autoLoginData) {
        const { tokens: tokensData, userData } = autoLoginData;
        
        // Save to state
        setUser(userData);
        setTokens(tokensData);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tokens', JSON.stringify(tokensData));
        
        // Set authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokensData.accessToken}`;
        
        return { success: true, message: 'Login successful' };
      }
      
      // Make real API call to backend
      const response = await axios.post('/auth/login', { email, password })
      
      // Extract data from response
      const { accessToken, refreshToken, message } = response.data
      
      // Get user data
      const userResponse = await axios.get('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      const userData = userResponse.data
      
      // Create tokens object
      const tokensData = {
        accessToken,
        refreshToken
      }
      
      // Save to state
      setUser(userData)
      setTokens(tokensData)
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('tokens', JSON.stringify(tokensData))
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      return { success: true, message }
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.message || 'Failed to login. Please check your credentials.'
      setError(errorMessage)
      return { 
        success: false, 
        error: errorMessage,
        needsVerification: err.response?.data?.needsVerification || false,
        email: err.response?.data?.email
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Register function
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Format the data according to backend requirements
      const formattedData = {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password
      }
      
      // Make real API call to backend
      const response = await axios.post('/auth/register', formattedData)
      
      // For registration, we don't automatically log in the user
      // since email verification is required
      
      return { 
        success: true, 
        message: response.data.message,
        emailStatus: response.data.emailStatus
      }
    } catch (err) {
      console.error('Registration error:', err)
      const errorMessage = err.response?.data?.message || 'Failed to register. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }
  
  // Logout function
  const logout = async () => {
    try {
      // Get refresh token from state or localStorage
      const refreshToken = tokens?.refreshToken || JSON.parse(localStorage.getItem('tokens'))?.refreshToken
      
      if (refreshToken) {
        // Call the logout API to invalidate the refresh token on the server
        await axios.post('/auth/logout', { refreshToken })
      }
      
      // Clear state
      setUser(null)
      setTokens(null)
      
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('tokens')
      
      // Clear authorization header
      delete axios.defaults.headers.common['Authorization']
      
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      
      // Even if the API call fails, we still want to clear the local state
      setUser(null)
      setTokens(null)
      localStorage.removeItem('user')
      localStorage.removeItem('tokens')
      delete axios.defaults.headers.common['Authorization']
      
      return { success: true } // Return success anyway since the user is effectively logged out
    }
  }
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true)
      setError('')
      
      // Call the API to update profile
      const response = await api.patch('/auth/profile', userData)
      
      // Update user data in state and localStorage
      const updatedUser = response.data.user
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      return { 
        success: true, 
        message: response.data.message || 'Profile updated successfully' 
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile'
      setError(errorMessage)
      console.error('Update profile error:', error)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }
  
  // Check if user is authenticated
  const isAuthenticated = !!user
  
  // Check if user is admin
  const isAdmin = user?.isAdmin || false
  
  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      setLoading(true)
      setError(null)
      
      // Make real API call to backend
      const response = await axios.post('/auth/forgot-password', { email })
      
      return { 
        success: true, 
        message: response.data.message,
        emailStatus: response.data.emailStatus 
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      const errorMessage = err.response?.data?.message || 'Failed to process request. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        forgotPassword,
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
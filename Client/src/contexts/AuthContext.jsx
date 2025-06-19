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
      setUser(JSON.parse(storedUser))
      setTokens(JSON.parse(storedTokens))
      
      // Set authorization header for all future requests
      const parsedTokens = JSON.parse(storedTokens)
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.accessToken}`
    }
    
    setLoading(false)
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real app, this would be an API call
      // For now, we'll simulate a successful login with mock data
      // const response = await axios.post('/auth/login', { email, password })
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock response data
      const mockResponse = {
        data: {
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: email,
            isAdmin: email === 'admin@example.com'
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        }
      }
      
      const { user: userData, tokens: tokensData } = mockResponse.data
      
      // Save to state
      setUser(userData)
      setTokens(tokensData)
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('tokens', JSON.stringify(tokensData))
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokensData.accessToken}`
      
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.')
      return { success: false, error: err.response?.data?.message || 'Failed to login' }
    } finally {
      setLoading(false)
    }
  }
  
  // Register function
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real app, this would be an API call
      // For now, we'll simulate a successful registration with mock data
      // const response = await axios.post('/auth/register', userData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock response data
      const mockResponse = {
        data: {
          user: {
            id: 1,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            isAdmin: false
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        }
      }
      
      const { user: newUser, tokens: tokensData } = mockResponse.data
      
      // Save to state
      setUser(newUser)
      setTokens(tokensData)
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('tokens', JSON.stringify(tokensData))
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokensData.accessToken}`
      
      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.message || 'Failed to register. Please try again.')
      return { success: false, error: err.response?.data?.message || 'Failed to register' }
    } finally {
      setLoading(false)
    }
  }
  
  // Logout function
  const logout = () => {
    // Clear state
    setUser(null)
    setTokens(null)
    
    // Clear localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('tokens')
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization']
  }
  
  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real app, this would be an API call
      // For now, we'll simulate a successful profile update with mock data
      // const response = await axios.put('/auth/profile', userData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update user data
      const updatedUser = { ...user, ...userData }
      
      // Save to state
      setUser(updatedUser)
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      return { success: true }
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
      return { success: false, error: err.response?.data?.message || 'Failed to update profile' }
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
      
      // In a real app, this would be an API call
      // For now, we'll simulate a successful password reset request with mock data
      // const response = await axios.post('/auth/forgot-password', { email })
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError(err.response?.data?.message || 'Failed to process request. Please try again.')
      return { success: false, error: err.response?.data?.message || 'Failed to process request' }
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
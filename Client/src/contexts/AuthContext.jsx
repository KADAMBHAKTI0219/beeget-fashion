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
    console.log('Initializing auth state from localStorage')
    const storedUser = localStorage.getItem('user')
    const storedTokens = localStorage.getItem('tokens')
    
    console.log('Stored user in localStorage:', storedUser ? 'Present' : 'Not present')
    console.log('Stored tokens in localStorage:', storedTokens ? 'Present' : 'Not present')
    
    if (storedUser && storedTokens) {
      try {
        const parsedUser = JSON.parse(storedUser)
        const parsedTokens = JSON.parse(storedTokens)
        
        console.log('Parsed user:', parsedUser)
        console.log('Parsed tokens:', {
          accessToken: parsedTokens.accessToken ? `${parsedTokens.accessToken.substring(0, 10)}...` : 'Missing',
          refreshToken: parsedTokens.refreshToken ? 'Present' : 'Missing'
        })
        
        setUser(parsedUser)
        setTokens(parsedTokens)
        
        // Set authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.accessToken}`
        console.log('Set Authorization header for future requests')
      } catch (error) {
        console.error('Error parsing stored auth data:', error)
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('tokens')
      }
    } else {
      console.log('No stored auth data found, user is not authenticated')
    }
    
    setLoading(false)
  }, [])

  // Login function
  const login = async (email, password, autoLoginData = null) => {
    try {
      console.log('Login function called')
      setLoading(true)
      setError(null)
      
      // अगर autoLoginData है तो API कॉल को बायपास करें
      if (autoLoginData) {
        console.log('Using autoLoginData for login')
        const { tokens: tokensData, userData } = autoLoginData;
        
        // Save to state
        setUser(userData);
        setTokens(tokensData);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tokens', JSON.stringify(tokensData));
        console.log('Saved autoLoginData to localStorage')
        
        // Set authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokensData.accessToken}`;
        console.log('Set Authorization header for future requests')
        
        return { success: true, message: 'Login successful' };
      }
      
      console.log('Making API call to login endpoint')
      // Make real API call to backend
      const response = await axios.post('/auth/login', { email, password })
      console.log('Login API response:', response.data)
      
      // Check if user is banned
      if (response.data.isBanned) {
        console.log('User is banned')
        return { 
          success: false, 
          isBanned: true,
          banReason: response.data.banReason || null
        }
      }
      
      // Extract data from response
      const { accessToken, refreshToken, message } = response.data
      console.log('Extracted tokens:', { 
        accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'Missing', 
        refreshToken: refreshToken ? 'Present' : 'Missing' 
      })
      
      console.log('Getting user profile data')
      // Get user data
      const userResponse = await axios.get('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      console.log('User profile response:', userResponse.data)
      
      const userData = userResponse.data
      
      // Create tokens object
      const tokensData = {
        accessToken,
        refreshToken
      }
      
      // Save to state
      setUser(userData)
      setTokens(tokensData)
      console.log('Saved user and tokens to state')
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('tokens', JSON.stringify(tokensData))
      console.log('Saved user and tokens to localStorage')
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      console.log('Set Authorization header for future requests')
      
      return { success: true, message }
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.message || 'Failed to login. Please check your credentials.'
      setError(errorMessage)
      return { 
        success: false, 
        error: errorMessage,
        needsVerification: err.response?.data?.needsVerification || false,
        email: err.response?.data?.email,
        isBanned: err.response?.data?.isBanned || false,
        banReason: err.response?.data?.banReason
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
      // Use the correct endpoint that matches with the backend
      const response = await axios.patch('/user/profile', userData)
      
      // Update user data in state and localStorage
      const updatedUser = response.data.user || response.data.data
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
  const isAdmin = user?.role === 'admin' || false
  
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
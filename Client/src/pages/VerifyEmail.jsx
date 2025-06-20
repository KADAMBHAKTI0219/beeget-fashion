import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'
import api from '../utils/api'

// Validation schema for resend form
const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
}).required()

const VerifyEmail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  // States
  const [verificationStatus, setVerificationStatus] = useState({
    loading: false,
    success: false,
    error: '',
    message: ''
  })
  const [resendStatus, setResendStatus] = useState({
    loading: false,
    success: false,
    error: '',
    message: ''
  })

  // Get email and message from location state (if redirected from login/register)
  const locationState = location.state || {}
  const emailFromState = locationState.email || ''
  const messageFromState = locationState.message || ''
  
  // Get token from URL query params
  const queryParams = new URLSearchParams(location.search)
  const token = queryParams.get('token')

  // Form for resending verification email
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: emailFromState
    }
  })

  // Verify email token when component mounts and token is present
  useEffect(() => {
    if (token) {
      verifyEmailToken(token)
    } else if (messageFromState) {
      setVerificationStatus(prev => ({
        ...prev,
        message: messageFromState
      }))
    }
  }, [token, messageFromState])

  // Function to verify email token
  const verifyEmailToken = async (token) => {
    setVerificationStatus(prev => ({ ...prev, loading: true, error: '' }))
    
    try {
      const response = await api.post('/auth/verify-email', { token })
      
      setVerificationStatus({
        loading: false,
        success: true,
        error: '',
        message: response.data.message || 'Email verified successfully!'
      })
      
      // If tokens are returned, log the user in automatically
      if (response.data.accessToken && response.data.refreshToken) {
        // Wait a moment before redirecting to ensure user sees success message
        setTimeout(() => {
          // Auto-login with the returned data
          login(null, null, {
            tokens: {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken
            },
            userData: response.data.user
          });
          
          // Navigate to home page
          navigate('/', { replace: true });
        }, 2000);
      }
    } catch (error) {
      setVerificationStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Verification failed. Please try again.',
        message: ''
      })
    }
  }

  // Function to resend verification email
  const onResendSubmit = async (data) => {
    setResendStatus(prev => ({ ...prev, loading: true, error: '', success: false }))
    
    try {
      const response = await api.post('/auth/resend-verification-email', { email: data.email })
      
      setResendStatus({
        loading: false,
        success: true,
        error: '',
        message: response.data.message || 'Verification email sent successfully!'
      })
    } catch (error) {
      setResendStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Failed to resend verification email. Please try again.',
        message: ''
      })
    }
  }

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
      
      {/* Verification Status */}
      {verificationStatus.loading && (
        <div className="text-center mb-4">
          <p>Verifying your email...</p>
        </div>
      )}
      
      {verificationStatus.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{verificationStatus.message}</p>
        </div>
      )}
      
      {verificationStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{verificationStatus.error}</p>
        </div>
      )}
      
      {verificationStatus.message && !verificationStatus.success && !verificationStatus.error && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>{verificationStatus.message}</p>
        </div>
      )}
      
      {/* Resend Verification Email Form */}
      {!verificationStatus.success && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Resend Verification Email</h2>
          
          {resendStatus.success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>{resendStatus.message}</p>
            </div>
          )}
          
          {resendStatus.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{resendStatus.error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onResendSubmit)}>
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Button
              type="submit"
              className="w-full mt-4"
              loading={resendStatus.loading}
            >
              Resend Verification Email
            </Button>
          </form>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link to="/login" className="text-blue-600 hover:text-blue-800">
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmail
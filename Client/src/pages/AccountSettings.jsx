import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'

// Validation schema for profile update
const profileSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string().nullable(),
}).required()

// Validation schema for password change
const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
}).required()

const AccountSettings = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    success: false,
    error: ''
  })
  
  // Profile form
  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || user?.name?.split(' ')[0] || '',
      lastName: user?.lastName || user?.name?.split(' ')[1] || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }
  })
  
  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })
  
  // Handle profile update
  const handleProfileUpdate = async (data) => {
    setUpdateStatus({ loading: true, success: false, error: '' })
    
    try {
      const result = await updateProfile(data)
      
      if (result.success) {
        setUpdateStatus({
          loading: false,
          success: true,
          error: ''
        })
        
        // Reset form with new values
        profileForm.reset({
          firstName: user?.firstName || user?.name?.split(' ')[0] || '',
          lastName: user?.lastName || user?.name?.split(' ')[1] || '',
          email: user?.email || '',
          phone: user?.phone || '',
        })
        
        // Invalidate user profile query to refresh data
        queryClient.invalidateQueries(['user-profile'])
        
        // Show success message briefly
        setTimeout(() => {
          // Redirect to profile page and clear success message
          setUpdateStatus(prev => ({ ...prev, success: false }))
          navigate('/account')
        }, 1500)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || 'Failed to update profile'
        })
      }
    } catch (error) {
      setUpdateStatus({
        loading: false,
        success: false,
        error: 'An unexpected error occurred'
      })
      console.error('Profile update error:', error)
    }
  }
  
  // Handle password change
  const handlePasswordChange = async (data) => {
    setUpdateStatus({ loading: true, success: false, error: '' })
    
    try {
      // Use the changePassword function from AuthContext
      const result = await changePassword(data.currentPassword, data.newPassword)
      
      if (result.success) {
        setUpdateStatus({
          loading: false,
          success: true,
          error: ''
        })
        
        // Reset password form
        passwordForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Show success message briefly
        setTimeout(() => {
          // Redirect to profile page and clear success message
          setUpdateStatus(prev => ({ ...prev, success: false }))
          navigate('/account')
        }, 1500)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || 'Failed to update password'
        })
      }
    } catch (error) {
      setUpdateStatus({
        loading: false,
        success: false,
        error: 'An unexpected error occurred'
      })
      console.error('Password update error:', error)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 font-medium text-sm ${activeTab === 'profile' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-4 font-medium text-sm ${activeTab === 'password' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Change Password
          </button>
        </nav>
      </div>
      
      {/* Status Messages */}
      {updateStatus.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{activeTab === 'profile' ? 'Profile updated successfully!' : 'Password changed successfully!'}</p>
        </div>
      )}
      
      {updateStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{updateStatus.error}</p>
        </div>
      )}
      
      {/* Profile Information Form */}
      {activeTab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6 max-w-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Your first name"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName')}
            />
            
            <Input
              label="Last Name"
              placeholder="Your last name"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName')}
            />
          </div>
          
          <Input
            label="Email Address"
            type="email"
            placeholder="Your email address"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email')}
          />
          
          <Input
            label="Phone Number (Optional)"
            placeholder="Your phone number"
            error={profileForm.formState.errors.phone?.message}
            {...profileForm.register('phone')}
          />
          
          <Button
            type="submit"
            loading={updateStatus.loading}
          >
            Update Profile
          </Button>
        </form>
      )}
      
      {/* Change Password Form */}
      {activeTab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6 max-w-md">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword')}
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
          
          <Button
            type="submit"
            loading={updateStatus.loading}
          >
            Change Password
          </Button>
        </form>
      )}
    </div>
  )
}

export default AccountSettings
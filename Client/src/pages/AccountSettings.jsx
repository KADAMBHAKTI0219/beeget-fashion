import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'

// Validation schema for profile update
const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
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
  const { user, updateProfile } = useAuth()
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
      name: user?.name || '',
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
          name: user?.name || '',
        })
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUpdateStatus(prev => ({ ...prev, success: false }))
        }, 3000)
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
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...passwordData } = data
      
      const result = await updateProfile(passwordData)
      
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
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUpdateStatus(prev => ({ ...prev, success: false }))
        }, 3000)
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
          <Input
            label="Name"
            placeholder="Your full name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name')}
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
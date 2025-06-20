import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../utils/api';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import useAuth from '../hooks/useAuth';

// Validation schema for address form
const addressSchema = yup.object().shape({
  label: yup.string().required('Address label is required'),
  line1: yup.string().required('Address line is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  zip: yup.string().required('ZIP code is required'),
  country: yup.string().required('Country is required')
});

const AccountAddresses = () => {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(addressSchema),
    defaultValues: {
      label: '',
      line1: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });

  // Fetch addresses when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/addresses');
      setAddresses(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for adding/editing address
  const onSubmit = async (data) => {
    try {
      setStatusMessage({ type: '', message: '' });
      
      if (editingAddress) {
        // Update existing address
        const response = await api.put(`/user/addresses/${editingAddress._id}`, data);
        setStatusMessage({ type: 'success', message: 'Address updated successfully' });
        
        // Update addresses list
        setAddresses(addresses.map(addr => 
          addr._id === editingAddress._id ? response.data.data : addr
        ));
      } else {
        // Add new address
        const response = await api.post('/user/addresses', data);
        setStatusMessage({ type: 'success', message: 'Address added successfully' });
        
        // Add new address to list
        setAddresses([...addresses, response.data.data]);
      }
      
      // Reset form and state
      reset();
      setShowForm(false);
      setEditingAddress(null);
    } catch (err) {
      console.error('Error saving address:', err);
      setStatusMessage({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to save address. Please try again.'
      });
    }
  };

  // Handle edit address
  const handleEdit = (address) => {
    setEditingAddress(address);
    reset({
      label: address.label,
      line1: address.line1,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country
    });
    setShowForm(true);
  };

  // Handle delete address
  const handleDelete = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await api.delete(`/user/addresses/${addressId}`);
        setStatusMessage({ type: 'success', message: 'Address deleted successfully' });
        
        // Remove address from list
        setAddresses(addresses.filter(addr => addr._id !== addressId));
      } catch (err) {
        console.error('Error deleting address:', err);
        setStatusMessage({ 
          type: 'error', 
          message: err.response?.data?.message || 'Failed to delete address. Please try again.'
        });
      }
    }
  };

  // Handle add new address button
  const handleAddNew = () => {
    setEditingAddress(null);
    reset();
    setShowForm(true);
  };

  // Handle cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
    reset();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Addresses</h2>
        {!showForm && (
          <Button 
            onClick={handleAddNew}
            className="flex items-center gap-2"
          >
            <FaPlus /> Add New Address
          </Button>
        )}
      </div>

      {/* Status message */}
      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {/* Loading and error states */}
      {loading ? (
        <div className="text-center py-8">Loading addresses...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : (
        <>
          {/* Address form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-medium mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Address Label (e.g. Home, Office)"
                      {...register('label')}
                      error={errors.label?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Address Line"
                      {...register('line1')}
                      error={errors.line1?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="City"
                      {...register('city')}
                      error={errors.city?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="State/Province"
                      {...register('state')}
                      error={errors.state?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="ZIP/Postal Code"
                      {...register('zip')}
                      error={errors.zip?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Country"
                      {...register('country')}
                      error={errors.country?.message}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses list */}
          {addresses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">You don't have any saved addresses yet.</p>
              {!showForm && (
                <Button 
                  onClick={handleAddNew} 
                  className="mt-4"
                  variant="outline"
                >
                  Add Your First Address
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div key={address._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-lg">{address.label}</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(address)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(address._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-600">
                    <p>{address.line1}</p>
                    <p>{address.city}, {address.state} {address.zip}</p>
                    <p>{address.country}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountAddresses;
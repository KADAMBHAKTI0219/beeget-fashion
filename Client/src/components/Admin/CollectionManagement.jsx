import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const CollectionManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    active: true,
    order: 0,
    startDate: '',
    endDate: ''
  });
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      active: true,
      order: 0,
      startDate: '',
      endDate: ''
    });
    setCurrentCollection(null);
  };
  
  // Open edit modal with collection data
  const handleEditClick = (collection) => {
    setCurrentCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      image: collection.image || '',
      active: collection.active !== false, // Default to true if not specified
      order: collection.order || 0,
      startDate: formatDateForInput(collection.startDate),
      endDate: formatDateForInput(collection.endDate)
    });
    setShowEditModal(true);
  };
  
  const queryClient = useQueryClient();
  
  // Fetch collections
  const { data: collectionsData, isLoading: collectionsLoading, error: collectionsError } = useQuery(
    ['admin-collections'],
    async () => {
      try {
        const response = await axios.get('/collections');
        console.log('Collections API response:', response);
        return response.data;
      } catch (error) {
        console.error('Fetch collections error:', error);
        toast.error(`Failed to fetch collections: ${error.message}`);
        throw error;
      }
    },
    {
      staleTime: 60 * 1000, // 1 minute
      retry: 2,
      refetchOnWindowFocus: false
    }
  );
  
  // Delete collection mutation
  const deleteCollectionMutation = useMutation(
    async (id) => {
      try {
        console.log(`Deleting collection with id: ${id}`);
        const response = await axios.delete(`/collections/${id}`);
        console.log('Delete collection response:', response);
        return response.data;
      } catch (error) {
        console.error('Delete collection error:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-collections']);
        queryClient.invalidateQueries(['collections']); // Invalidate public collections query
        setShowDeleteModal(false);
        setCurrentCollection(null);
        toast.success('Collection deleted successfully');
      },
      onError: (error) => {
        console.error('Delete collection error:', error);
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete collection');
      }
    }
  );
  
  // Create collection mutation
  const createCollectionMutation = useMutation(
    async (collectionData) => {
      try {
        console.log('Creating collection with data:', collectionData);
        const response = await axios.post('/collections', collectionData);
        console.log('Create collection response:', response);
        return response.data;
      } catch (error) {
        console.error('Create collection error:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-collections']);
        queryClient.invalidateQueries(['collections']); // Invalidate public collections query
        setShowAddModal(false);
        resetForm();
        toast.success('Collection created successfully');
      },
      onError: (error) => {
        console.error('Create collection error:', error);
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create collection');
      }
    }
  );
  
  // Update collection mutation
  const updateCollectionMutation = useMutation(
    async ({ id, data }) => {
      try {
        console.log(`Updating collection ${id} with data:`, data);
        const response = await axios.put(`/collections/${id}`, data);
        console.log('Update collection response:', response);
        return response.data;
      } catch (error) {
        console.error('Update collection error:', error);
        console.error('Error details:', error.response?.data);
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-collections']);
        queryClient.invalidateQueries(['collections']); // Invalidate public collections query
        setShowEditModal(false);
        resetForm();
        toast.success('Collection updated successfully');
      },
      onError: (error) => {
        console.error('Update collection error:', error);
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update collection');
      }
    }
  );
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission for creating/updating collection
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Validate image URL if provided
    if (formData.image && !isValidUrl(formData.image)) {
      toast.error('Please enter a valid image URL');
      return;
    }
    
    // Validate dates if both are provided
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        toast.error('End date must be after start date');
        return;
      }
    }
    
    // Prepare data for API
    const collectionData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      order: formData.order ? Number(formData.order) : 0,
      active: Boolean(formData.active),
      // Ensure dates are properly formatted
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined
    };
    
    // Remove empty fields to avoid validation errors
    Object.keys(collectionData).forEach(key => {
      if (collectionData[key] === '' || collectionData[key] === null) {
        delete collectionData[key];
      }
    });
    
    console.log('Submitting collection data:', collectionData);
    
    try {
      if (currentCollection) {
        // Update existing collection
        updateCollectionMutation.mutate({ id: currentCollection._id, data: collectionData });
      } else {
        // Create new collection
        createCollectionMutation.mutate(collectionData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while submitting the form');
    }
  };
  
  // Helper function to validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Invalid date
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  
  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Open delete confirmation modal
  const handleDeleteClick = (collection) => {
    setCurrentCollection(collection);
    setShowDeleteModal(true);
  };
  
  // Check if collection is active based on dates
  const isCollectionActive = (collection) => {
    if (!collection.active) return false;
    
    const now = new Date();
    const startDate = collection.startDate ? new Date(collection.startDate) : null;
    const endDate = collection.endDate ? new Date(collection.endDate) : null;
    
    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;
    
    return true;
  };
  
  // Render collection list
  const renderCollectionList = () => {
    if (collectionsLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (collectionsError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading collections. Please try again.</p>
        </div>
      );
    }
    
    if (!collectionsData?.data?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No collections found</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {collectionsData.data.map((collection) => {
              const isActive = isCollectionActive(collection);
              return (
                <tr key={collection._id}>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center">
                      {collection.image && (
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          <img className="h-10 w-10 rounded-md object-cover" src={collection.image} alt={collection.name} />
                        </div>
                      )}
                      <div className="font-medium text-gray-900">{collection.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {collection.description ? (
                      <div className="truncate max-w-xs">{collection.description}</div>
                    ) : (
                      <span className="text-gray-400">No description</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div>Start: {formatDateForDisplay(collection.startDate)}</div>
                      <div>End: {formatDateForDisplay(collection.endDate)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {collection.order || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="outline" size="xs" className="mr-2" onClick={() => handleEditClick(collection)}>Edit</Button>
                    <Button variant="danger" size="xs" onClick={() => handleDeleteClick(collection)}>Delete</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render collection form (for add/edit modals)
  const renderCollectionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        ></textarea>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <Input
          type="text"
          name="image"
          value={formData.image}
          onChange={handleInputChange}
          placeholder="https://example.com/image.jpg"
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <Input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <Input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <Input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleInputChange}
            min="0"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={formData.active}
            onChange={handleInputChange}
            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            setShowAddModal(false);
            setShowEditModal(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createCollectionMutation.isLoading || updateCollectionMutation.isLoading}>
          {createCollectionMutation.isLoading || updateCollectionMutation.isLoading ? 'Saving...' : currentCollection ? 'Update Collection' : 'Add Collection'}
        </Button>
      </div>
    </form>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Collections Management</h3>
        <Button onClick={() => setShowAddModal(true)}>Add New Collection</Button>
      </div>
      
      {renderCollectionList()}
      
      {/* Add Collection Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Collection"
      >
        {renderCollectionForm()}
      </Modal>
      
      {/* Edit Collection Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Collection"
      >
        {renderCollectionForm()}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentCollection(null);
        }}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="mb-4">Are you sure you want to delete the collection "{currentCollection?.name}"?</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteCollectionMutation.mutate(currentCollection._id)}
              disabled={deleteCollectionMutation.isLoading}
            >
              {deleteCollectionMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CollectionManagement;
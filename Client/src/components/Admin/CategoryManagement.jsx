import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const CategoryManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    active: true,
    order: 0,
    parent: ''
  });
  
  const queryClient = useQueryClient();
  
  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await axios.get('/categories');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  }
  );
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const response = await axios.post('/categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // Invalidate public categories query
      setShowAddModal(false);
      resetForm();
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create category');
    }
  }
  );
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // Invalidate public categories query
      setShowEditModal(false);
      resetForm();
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update category');
    }
  }
  );
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // Invalidate public categories query
      setShowDeleteModal(false);
      setCurrentCategory(null);
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete category');
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
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      active: true,
      order: 0,
      parent: ''
    });
  };
  
  // Open edit modal with category data
  const handleEditClick = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      active: category.active !== false, // Default to true if not specified
      order: category.order || 0,
      parent: category.parent || ''
    });
    setShowEditModal(true);
  };
  
  // Open delete confirmation modal
  const handleDeleteClick = (category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };
  
  // Handle form submission for creating/updating category
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }
    
    // Prepare data for API
    const categoryData = {
      ...formData,
      order: Number(formData.order),
      parent: formData.parent || null
    };
    
    if (currentCategory) {
      // Update existing category
      updateCategoryMutation.mutate({ id: currentCategory._id, data: categoryData });
    } else {
      // Create new category
      createCategoryMutation.mutate(categoryData);
    }
  };
  
  // Render category list
  const renderCategoryList = () => {
    if (categoriesLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (categoriesError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading categories. Please try again.</p>
        </div>
      );
    }
    
    if (!categoriesData?.data?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No categories found</p>
        </div>
      );
    }
    
    // Flatten category tree for display
    const flatCategories = [];
    if (Array.isArray(categoriesData.data)) {
      categoriesData.data.forEach(category => {
        flatCategories.push(category);
        if (category.children && Array.isArray(category.children)) {
          category.children.forEach(child => {
            flatCategories.push({
              ...child,
              isChild: true,
              parentName: category.name
            });
          });
        }
      });
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flatCategories.map((category) => (
              <tr key={category._id}>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center">
                    {category.image && (
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        <img className="h-10 w-10 rounded-md object-cover" src={category.image} alt={category.name} />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {category.isChild && <span className="text-gray-400 mr-1">↳</span>}
                        {category.name}
                      </div>
                      {category.isChild && (
                        <div className="text-gray-500 text-xs">Parent: {category.parentName}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {category.description ? (
                    <div className="truncate max-w-xs">{category.description}</div>
                  ) : (
                    <span className="text-gray-400">No description</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {category.order || 0}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                  <Button variant="outline" size="xs" className="mr-2" onClick={() => handleEditClick(category)}>Edit</Button>
                  <Button variant="danger" size="xs" onClick={() => handleDeleteClick(category)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render category form (for add/edit modals)
  const renderCategoryForm = () => (
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
        <Input
          type="text"
          name="image"
          value={formData.image}
          onChange={handleInputChange}
          placeholder="https://example.com/image.jpg"
        />
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
          <select
            name="parent"
            value={formData.parent}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">None (Top Level)</option>
            {categoriesData?.data?.map(category => (
              // Don't allow setting itself as parent
              currentCategory?._id !== category._id && (
                <option key={category._id} value={category._id}>{category.name}</option>
              )
            ))}
          </select>
        </div>
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
        <Button type="submit" disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}>
          {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? 'Saving...' : currentCategory ? 'Update Category' : 'Add Category'}
        </Button>
      </div>
    </form>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Categories Management</h3>
        <Button onClick={() => setShowAddModal(true)}>Add New Category</Button>
      </div>
      
      {renderCategoryList()}
      
      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Category"
      >
        {renderCategoryForm()}
      </Modal>
      
      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCurrentCategory(null);
          resetForm();
        }}
        title="Edit Category"
      >
        {renderCategoryForm()}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentCategory(null);
        }}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="mb-4">Are you sure you want to delete the category "{currentCategory?.name}"?</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteCategoryMutation.mutate(currentCategory._id)}
              disabled={deleteCategoryMutation.isLoading}
            >
              {deleteCategoryMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
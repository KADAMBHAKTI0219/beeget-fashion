import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const ProductManagement = () => {
  // Product modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // Category modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Collection modals
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
  const [showDeleteCollectionModal, setShowDeleteCollectionModal] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  
  // Product form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    salePrice: '',
    inventoryCount: '',
    images: [],
    categories: [],
    collections: [],
    tags: []
  });
  
  // Category form data
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    parentId: ''
  });
  
  // Collection form data
  const [collectionFormData, setCollectionFormData] = useState({
    name: '',
    description: ''
  });
  
  const queryClient = useQueryClient();
  
  // Fetch products
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await axios.get('/products?limit=50');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/categories');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Flatten category tree for dropdown
  const flattenedCategories = [];
  if (categoriesData?.data) {
    // Function to flatten the category tree
    const flattenCategories = (categories) => {
      categories.forEach(category => {
        flattenedCategories.push(category);
        if (category.children && Array.isArray(category.children)) {
          flattenCategories(category.children);
        }
      });
    };
    
    flattenCategories(categoriesData.data);
  }
  
  // Fetch collections for dropdown
  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await axios.get('/collections');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData) => {
      const response = await axios.post('/products', productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create product');
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowEditModal(false);
      resetForm();
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update product');
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowDeleteModal(false);
      setCurrentProduct(null);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  });
  
  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const response = await axios.post('/categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowAddCategoryModal(false);
      resetCategoryForm();
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create category');
    }
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowEditCategoryModal(false);
      resetCategoryForm();
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update category');
    }
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowDeleteCategoryModal(false);
      setCurrentCategory(null);
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    }
  });
  
  // Collection mutations
  const createCollectionMutation = useMutation({
    mutationFn: async (collectionData) => {
      const response = await axios.post('/collections', collectionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setShowAddCollectionModal(false);
      resetCollectionForm();
      toast.success('Collection created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create collection');
    }
  });
  
  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`/collections/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setShowEditCollectionModal(false);
      resetCollectionForm();
      toast.success('Collection updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update collection');
    }
  });
  
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/collections/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setShowDeleteCollectionModal(false);
      setCurrentCollection(null);
      toast.success('Collection deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete collection');
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle multi-select changes (categories, collections)
  const handleMultiSelectChange = (e, fieldName) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      [fieldName]: selectedValues
    }));
  };
  
  // Handle image URLs input (comma-separated)
  const handleImagesChange = (e) => {
    const imagesString = e.target.value;
    const imagesArray = imagesString.split(',').map(url => url.trim()).filter(url => url);
    setFormData(prev => ({
      ...prev,
      images: imagesArray
    }));
  };
  
  // Handle tags input (comma-separated)
  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      salePrice: '',
      inventoryCount: '',
      images: [],
      categories: [],
      collections: [],
      tags: []
    });
  };
  
  // Open edit modal with product data - immediately open modal
  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || '',
      inventoryCount: product.inventoryCount,
      images: product.images || [],
      categories: product.categories?.map(cat => cat._id || cat) || [],
      collections: product.collections?.map(col => col._id || col) || [],
      tags: product.tags || []
    });
    setShowEditModal(true);
  };
  
  // Open delete confirmation modal - immediately open modal
  const handleDeleteClick = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };
  
  // Handle form submission for creating/updating product
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title || !formData.description || !formData.price || !formData.inventoryCount) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Prepare data for API
    const productData = {
      ...formData,
      price: Number(formData.price),
      salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      inventoryCount: Number(formData.inventoryCount)
    };
    
    if (currentProduct) {
      // Update existing product
      updateProductMutation.mutate({ id: currentProduct._id, data: productData });
    } else {
      // Create new product
      createProductMutation.mutate(productData);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  // Render product list
  const renderProductList = () => {
    if (productsLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (productsError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading products. Please try again.</p>
        </div>
      );
    }
    
    if (!productsData?.data?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productsData.data.map((product) => (
              <tr key={product._id}>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 mr-3">
                      <img className="h-10 w-10 rounded-md object-cover" src={product.images[0]} alt={product.title} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {product.salePrice ? (
                    <div>
                      <span className="font-medium">{formatCurrency(product.salePrice)}</span>
                      <span className="text-gray-500 line-through ml-2">{formatCurrency(product.price)}</span>
                    </div>
                  ) : (
                    formatCurrency(product.price)
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.inventoryCount < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {product.inventoryCount} in stock
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {product.categories?.map(cat => cat.name).join(', ') || 'Uncategorized'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                  <Button variant="outline" size="xs" className="mr-2" onClick={() => handleEditClick(product)}>Edit</Button>
                  <Button variant="danger" size="xs" onClick={() => handleDeleteClick(product)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render product form (for add/edit modals)
  const renderProductForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        ></textarea>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
          <Input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
          <Input
            type="number"
            name="salePrice"
            value={formData.salePrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Count *</label>
        <Input
          type="number"
          name="inventoryCount"
          value={formData.inventoryCount}
          onChange={handleInputChange}
          min="0"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Images (comma-separated URLs) *</label>
        <Input
          type="text"
          value={formData.images.join(', ')}
          onChange={handleImagesChange}
          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
          <select
            multiple
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            onChange={(e) => handleMultiSelectChange(e, 'categories')}
            value={formData.categories}
          >
            {flattenedCategories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Select option</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collections</label>
          <select
            multiple
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            onChange={(e) => handleMultiSelectChange(e, 'collections')}
            value={formData.collections}
          >
            {collectionsData?.data?.map(collection => (
              <option key={collection._id} value={collection._id}>{collection.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Select option</p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <Input
          type="text"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="tag1, tag2, tag3"
        />
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
        <Button type="submit" disabled={createProductMutation.isLoading || updateProductMutation.isLoading}>
          {createProductMutation.isLoading || updateProductMutation.isLoading ? 'Saving...' : currentProduct ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Products Management</h3>
        <Button onClick={() => setShowAddModal(true)}>Add New Product</Button>
      </div>
      
      {renderProductList()}
      
      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Product"
      >
        {renderProductForm()}
      </Modal>
      
      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCurrentProduct(null);
          resetForm();
        }}
        title="Edit Product"
      >
        {renderProductForm()}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentProduct(null);
        }}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="mb-4">Are you sure you want to delete the product "{currentProduct?.title}"?</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteProductMutation.mutate(currentProduct._id)}
              disabled={deleteProductMutation.isLoading}
            >
              {deleteProductMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement;
import { XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import Button from '../Common/Button'

const FilterSidebar = ({ isOpen, onClose, filters, handleFilterChange }) => {
  // Close sidebar when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])
  
  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])
  
  // Reset all filters
  const resetFilters = () => {
    handleFilterChange('category', '')
    handleFilterChange('sort', 'newest')
    handleFilterChange('minPrice', '')
    handleFilterChange('maxPrice', '')
    handleFilterChange('search', '')
    handleFilterChange('page', 1)
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sidebar panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-lg z-60 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between p-4 border-b border-gray-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <h2 className="text-xl font-medium">Filters</h2>
              </motion.div>
              <motion.button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close filters"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <XMarkIcon className="h-6 w-6" />
              </motion.button>
            </motion.div>
            
            {/* Filters Content */}
            <motion.div 
              className="flex-grow overflow-y-auto py-4 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={filters.category === ''}
                      onChange={() => handleFilterChange('category', '')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <span className="ml-2">All</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="women"
                      checked={filters.category === 'women'}
                      onChange={() => handleFilterChange('category', 'women')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <span className="ml-2">Women</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="men"
                      checked={filters.category === 'men'}
                      onChange={() => handleFilterChange('category', 'men')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <span className="ml-2">Men</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="accessories"
                      checked={filters.category === 'accessories'}
                      onChange={() => handleFilterChange('category', 'accessories')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <span className="ml-2">Accessories</span>
                  </label>
                </div>
              </div>
              
              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Price Range</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="minPrice" className="block text-sm text-gray-600 mb-1">Min ($)</label>
                    <input
                      type="number"
                      id="minPrice"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxPrice" className="block text-sm text-gray-600 mb-1">Max ($)</label>
                    <input
                      type="number"
                      id="maxPrice"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sort Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Sort By</h3>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
              
              {/* Reset Filters Button */}
              <div className="mt-8">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default FilterSidebar
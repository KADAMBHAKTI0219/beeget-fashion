const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateProduct } = require('../validations/product.validation');
const {
    createProduct,
    getProducts,
    getProductBySlug,
    updateProduct,
    deleteProduct
} = require('../controllers/product.controller');

// Public routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Protected routes (admin only)
router.post('/', auth('admin'), validateProduct, createProduct);
router.put('/:id', auth('admin'), validateProduct, updateProduct);
router.delete('/:id', auth('admin'), deleteProduct);

module.exports = router;
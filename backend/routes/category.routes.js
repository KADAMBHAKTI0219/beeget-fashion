const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCategory } = require('../validations/category.validation');
const {
    createCategory,
    getCategories,
    getCategoryBySlug,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Protected routes (admin only)
router.post('/', auth('admin'), validateCategory, createCategory);
router.put('/:id', auth('admin'), validateCategory, updateCategory);
router.delete('/:id', auth('admin'), deleteCategory);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCollection } = require('../validations/collection.validation');
const {
    createCollection,
    getCollections,
    getCollectionBySlug,
    updateCollection,
    deleteCollection
} = require('../controllers/collection.controller');

// Public routes
router.get('/', getCollections);
router.get('/:slug', getCollectionBySlug);

// Protected routes (admin only)
router.post('/', auth('admin'), validateCollection, createCollection);
router.put('/:id', auth('admin'), validateCollection, updateCollection);
router.delete('/:id', auth('admin'), deleteCollection);

module.exports = router;
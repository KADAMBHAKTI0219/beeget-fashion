const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const wishlistController = require('../controllers/wishlist.controller');

// Get user's wishlist
// GET /api/wishlist
router.get('/', auth(), wishlistController.getWishlist);

// Add item to wishlist
// POST /api/wishlist
router.post('/', auth(), wishlistController.addToWishlist);

// Remove item from wishlist
// DELETE /api/wishlist/:productId
router.delete('/:productId', auth(), wishlistController.removeFromWishlist);

// Clear wishlist
// DELETE /api/wishlist
router.delete('/', auth(), wishlistController.clearWishlist);

module.exports = router;
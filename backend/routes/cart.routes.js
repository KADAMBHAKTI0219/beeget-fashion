const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
} = require('../controllers/cart.controller');

// Protected routes (user only)
router.use(auth());
router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);

module.exports = router;
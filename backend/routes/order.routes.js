const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder,
    getAllOrders
} = require('../controllers/order.controller');

// Protected routes (user only)
router.use(auth());
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder); // This now supports both MongoDB ID and orderNumber

// Admin only routes
router.get('/admin/all', auth('admin'), getAllOrders); // Supports filtering by orderNumber
router.patch('/:id/status', auth('admin'), updateOrderStatus); // Supports both MongoDB ID and orderNumber
router.patch('/:id/cancel', cancelOrder); // Supports both MongoDB ID and orderNumber

module.exports = router;
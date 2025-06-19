const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder
} = require('../controllers/order.controller');

// Protected routes (user only)
router.use(auth());
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

// Admin only routes
router.patch('/:id/status', auth('admin'), updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} = require('../controllers/notification.controller');

// Protected routes (user only)
router.use(auth());
router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

// Admin only routes
router.post('/', auth('admin'), createNotification);
router.delete('/:id', auth('admin'), deleteNotification);

module.exports = router;
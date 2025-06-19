const Notification = require('../models/notification.model');
const { validateObjectId } = require('../middleware/validate');

// Create new notification
exports.createNotification = async (req, res) => {
    try {
        const notification = new Notification({
            ...req.body,
            createdBy: req.user._id
        });

        await notification.save();

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all notifications (with filters)
exports.getNotifications = async (req, res) => {
    try {
        const { type, isRead, limit = 10, page = 1 } = req.query;
        const query = { isActive: true };

        // Add filters if provided
        if (type) query.type = type;
        if (isRead !== undefined) query.isRead = isRead;

        // Add user filter for non-admin users
        if (req.user.role !== 'admin') {
            query.$or = [
                { userId: req.user._id },
                { userId: null }
            ];
        }

        const notifications = await Notification.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('createdBy', 'name');

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            _id: id,
            $or: [
                { userId: req.user._id },
                { userId: null }
            ]
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const query = {
            isRead: false,
            $or: [
                { userId: req.user._id },
                { userId: null }
            ]
        };

        await Notification.updateMany(query, { isRead: true });

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete notification (admin only)
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const query = {
            isRead: false,
            isActive: true,
            $or: [
                { userId: req.user._id },
                { userId: null }
            ]
        };

        const count = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
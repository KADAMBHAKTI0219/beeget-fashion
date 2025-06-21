const Notification = require('../models/notification.model');
const { validateObjectId } = require('../middleware/validate');

// Create new notification
exports.createNotification = async (req, res) => {
    try {
        const notification = new Notification({
            ...req.body,
            createdBy: req.user.userId // Changed from req.user._id to req.user.userId
        });

        await notification.save();

        // Get all users to send email notifications
        const User = require('../models/user.model');
        
        // First check if there are any users in the database
        const userCount = await User.countDocuments({ role: 'user', isBanned: false });
        
        // If no users exist, create a test user for demonstration
        if (userCount === 0) {
            console.log('No users found. Creating a test user for email demonstration.');
            // Create a test user if needed for demonstration
            const testUser = new User({
                name: 'Test User',
                email: process.env.SMTP_USER, // Send to the same email as the sender for testing
                password: 'password123', // This is just for testing
                role: 'user',
                isEmailVerified: true
            });
            await testUser.save();
            console.log('Test user created successfully.');
        }
        
        // Get all users again (including any newly created test user)
        const users = await User.find({ role: 'user', isBanned: false }).select('email name');

        // Configure nodemailer transporter
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Send email to all users
        const emailPromises = users.map(user => {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">${notification.title}</h2>
                    <p style="color: #666; line-height: 1.5;">${notification.message}</p>
                    ${notification.link ? `<p><a href="${notification.link}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Details</a></p>` : ''}
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated message from Beeget Fashion. Please do not reply to this email.</p>
                </div>
            `;

            console.log(`Attempting to send email to: ${user.email}`);
            
            return transporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: user.email,
                subject: notification.title,
                html: emailHtml
            }).then(info => {
                console.log(`Email sent successfully to ${user.email}: ${info.messageId}`);
                return info;
            }).catch(err => {
                console.error(`Failed to send email to ${user.email}:`, err);
                return null; // Continue with other emails even if one fails
            });
        });

        // Wait for all emails to be sent (or fail) without blocking the response
        Promise.allSettled(emailPromises).then(results => {
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Notification emails sent: ${successCount}/${users.length}`);
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: `Notification created and email sending to ${users.length} users has been initiated.`
        });
    } catch (error) {
        console.error('Error creating notification:', error);
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
                { userId: req.user.userId }, // Changed from req.user._id to req.user.userId
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
                { userId: req.user.userId }, // Changed from req.user._id to req.user.userId
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
                { userId: req.user.userId }, // Changed from req.user._id to req.user.userId
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
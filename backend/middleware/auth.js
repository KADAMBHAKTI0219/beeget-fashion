const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = (requiredRole) => async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned',
                reason: user.banReason || 'Contact administrator for more information',
                isBanned: true
            });
        }

        // Set user ID and role in request object
        // Make sure we include both userId and id for backward compatibility
        req.user = { 
            userId: decoded.userId, 
            id: decoded.userId, // Add id for backward compatibility
            _id: decoded.userId, // Add _id for backward compatibility with existing code
            role: user.role 
        };

        if (requiredRole && user.role !== requiredRole) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Insufficient privileges.'
            });
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = auth;
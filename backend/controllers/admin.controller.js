const User = require('../models/user.model');

/**
 * Get all users (for admin)
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    // Support pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Support search by name or email
    const searchQuery = {};
    if (req.query.search) {
      searchQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get users with pagination, excluding sensitive fields
    const users = await User.find(searchQuery)
      .select('-password -refreshToken -resetToken -resetTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get user by ID (for admin)
 * @route GET /api/admin/users/:userId
 * @access Private (Admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -refreshToken -resetToken -resetTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update user (for admin)
 * @route PUT /api/admin/users/:userId
 * @access Private (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email;
    }
    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user without sensitive fields
    const updatedUser = await User.findById(userId)
      .select('-password -refreshToken -resetToken -resetTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete user (for admin)
 * @route DELETE /api/admin/users/:userId
 * @access Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Ban a user (for admin)
 * @route PUT /api/admin/users/:userId/ban
 * @access Private (Admin only)
 */
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Cannot ban admin users
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Cannot ban admin users' 
      });
    }
    
    // Update user status
    user.isBanned = true;
    user.banReason = reason || 'Banned by administrator';
    user.refreshToken = null; // Invalidate any existing sessions
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Unban a user (for admin)
 * @route PUT /api/admin/users/:userId/unban
 * @access Private (Admin only)
 */
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user status
    user.isBanned = false;
    user.banReason = null;
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser
};
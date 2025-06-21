const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth');

// All routes require admin authentication

// Get all users
// GET /api/admin/users
router.get('/users', auth('admin'), adminController.getAllUsers);

// Get user by ID
// GET /api/admin/users/:userId
router.get('/users/:userId', auth('admin'), adminController.getUserById);

// Update user
// PUT /api/admin/users/:userId
router.put('/users/:userId', auth('admin'), adminController.updateUser);

// Delete user
// DELETE /api/admin/users/:userId
router.delete('/users/:userId', auth('admin'), adminController.deleteUser);

// Ban user
// PUT /api/admin/users/:userId/ban
router.put('/users/:userId/ban', auth('admin'), adminController.banUser);

// Unban user
// PUT /api/admin/users/:userId/unban
router.put('/users/:userId/unban', auth('admin'), adminController.unbanUser);

module.exports = router;
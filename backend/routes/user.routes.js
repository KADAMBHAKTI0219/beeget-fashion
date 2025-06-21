const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const { addressValidation } = require('../validations/user.validation');

// Get user profile
// GET /api/user/profile
router.get('/profile', auth(), userController.getUserProfile);

// Get default address
// GET /api/user/default-address
router.get('/default-address', auth(), userController.getDefaultAddress);

// Get all addresses
// GET /api/user/addresses
router.get('/addresses', auth(), userController.getAddresses);

// Add a new address
// POST /api/user/addresses
router.post(
  '/addresses',
  [auth(), addressValidation],
  userController.addAddress
);

// Update an address
// PUT /api/user/addresses/:addressId
router.put(
  '/addresses/:addressId',
  [auth(), addressValidation],
  userController.updateAddress
);

// Delete an address
// DELETE /api/user/addresses/:addressId
router.delete('/addresses/:addressId', auth(), userController.deleteAddress);

module.exports = router;
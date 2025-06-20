const User = require('../models/user.model');
const { validationResult } = require('express-validator');

/**
 * Get user addresses
 * @route GET /api/user/addresses
 * @access Private
 */
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Add a new address
 * @route POST /api/user/addresses
 * @access Private
 */
const addAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { label, line1, city, state, zip, country } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create new address object
    const newAddress = {
      label,
      line1,
      city,
      state,
      zip,
      country
    };
    
    // Add to addresses array
    user.addresses.push(newAddress);
    
    // Save user
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update an address
 * @route PUT /api/user/addresses/:addressId
 * @access Private
 */
const updateAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { addressId } = req.params;
    const { label, line1, city, state, zip, country } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the address index
    const addressIndex = user.addresses.findIndex(
      address => address._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // Update the address
    user.addresses[addressIndex] = {
      _id: user.addresses[addressIndex]._id, // Preserve the original ID
      label,
      line1,
      city,
      state,
      zip,
      country
    };
    
    // Save user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete an address
 * @route DELETE /api/user/addresses/:addressId
 * @access Private
 */
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the address index
    const addressIndex = user.addresses.findIndex(
      address => address._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // Remove the address
    user.addresses.splice(addressIndex, 1);
    
    // Save user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
};
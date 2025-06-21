const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true // Add index for faster queries
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
        index: true // Add index for faster queries
    },
    items: [wishlistItemSchema]
}, {
    timestamps: true
});

// Add compound index for faster lookups
wishlistSchema.index({ userId: 1, 'items.productId': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
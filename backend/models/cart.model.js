const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    size: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: null
    },
    // Additional product details for better cart display
    productDetails: {
        title: {
            type: String,
            default: null
        },
        price: {
            type: Number,
            default: null
        },
        image: {
            type: String,
            default: null
        },
        slug: {
            type: String,
            default: null
        }
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add index for userId
cartSchema.index({ userId: 1 });

module.exports = mongoose.model('Cart', cartSchema);
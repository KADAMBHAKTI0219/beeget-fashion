const mongoose = require('mongoose');

// No counter schema needed anymore

const orderItemSchema = new mongoose.Schema({
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
    priceAtPurchase: {
        type: Number,
        required: [true, 'Price at purchase is required'],
        min: [0, 'Price cannot be negative']
    }
});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    items: [orderItemSchema],
    shippingAddress: {
        label: String,
        line1: {
            type: String,
            required: [true, 'Shipping address line 1 is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        zip: {
            type: String,
            required: [true, 'ZIP code is required']
        },
        country: {
            type: String,
            required: [true, 'Country is required']
        }
    },
    paymentMethod: {
        type: String,
        enum: ['credit-card', 'paypal'],
        required: [true, 'Payment method is required']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    }
}, {
    timestamps: true
});

// Add indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Using MongoDB's default _id instead of custom orderNumber

// No custom order number generation needed - using MongoDB's default _id

module.exports = mongoose.model('Order', orderSchema);
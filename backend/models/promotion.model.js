const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    couponCode: {
        type: String,
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

const promotionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Promotion name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    image: {
        type: String,
        required: [true, 'Promotion image is required']
    },
    // Promotion type: 'general' for regular promotions, 'coupon' for user-specific coupon codes
    promotionType: {
        type: String,
        enum: ['general', 'coupon'],
        default: 'general'
    },
    // For general promotions
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'Discount type is required']
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: [0, 'Discount value cannot be negative'],
        validate: {
            validator: function(value) {
                if (this.discountType === 'percentage') {
                    return value <= 100;
                }
                return true;
            },
            message: 'Percentage discount cannot exceed 100%'
        }
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    minimumPurchase: {
        type: Number,
        min: [0, 'Minimum purchase amount cannot be negative'],
        default: 0
    },
    // For general promotions
    usageLimit: {
        type: Number,
        min: [0, 'Usage limit cannot be negative']
    },
    usageCount: {
        type: Number,
        default: 0
    },
    // For coupon promotions
    couponPrefix: {
        type: String,
        trim: true,
        maxlength: [10, 'Coupon prefix cannot exceed 10 characters']
    },
    couponLength: {
        type: Number,
        default: 8,
        min: [4, 'Coupon length must be at least 4 characters'],
        max: [16, 'Coupon length cannot exceed 16 characters']
    },
    couponExpireDays: {
        type: Number,
        default: 30,
        min: [1, 'Coupon expiry must be at least 1 day']
    },
    // Store user-specific coupons
    userCoupons: [userCouponSchema]
}, {
    timestamps: true
});

// Generate slug when only slug is missing or name is modified
promotionSchema.pre('validate', function(next) {
    // If slug is already set manually, respect it
    if (this.slug && this.isModified('slug')) {
        return next();
    }
    
    // If name is modified or slug is missing, generate a slug
    if ((this.isModified('name') || !this.slug) && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    }
    next();
});

// Add indexes
promotionSchema.index({ slug: 1 }, { unique: true });
promotionSchema.index({ active: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
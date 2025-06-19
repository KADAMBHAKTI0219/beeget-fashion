const mongoose = require('mongoose');

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
    usageLimit: {
        type: Number,
        min: [0, 'Usage limit cannot be negative']
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Create slug from name before saving
promotionSchema.pre('save', function(next) {
    if (!this.isModified('name')) return next();
    this.slug = this.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    next();
});

// Also generate slug when only slug is missing
promotionSchema.pre('validate', function(next) {
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    }
    next();
});

// Create slug from name before saving
promotionSchema.pre('save', function(next) {
    if (!this.isModified('name')) return next();
    this.slug = this.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    next();
});

// Add indexes
promotionSchema.index({ slug: 1 }, { unique: true });
promotionSchema.index({ active: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
        minlength: [2, 'Title must be at least 2 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    images: [{
        type: String,
        required: [true, 'Product image is required']
    }],
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    salePrice: {
        type: Number,
        min: [0, 'Sale price cannot be negative'],
        validate: {
            validator: function(value) {
                if (!value) return true;
                const salePrice = Number(value);
                const regularPrice = Number(this.price);
                if (isNaN(salePrice) || isNaN(regularPrice)) return false;
                return salePrice <= regularPrice;
            },
            message: 'Sale price must be less than or equal to regular price'
        }
    },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    collections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection'
    }],
    tags: [{
        type: String,
        trim: true
    }],
    inventoryCount: {
        type: Number,
        required: [true, 'Inventory count is required'],
        min: [0, 'Inventory count cannot be negative'],
        default: 0
    }
}, {
    timestamps: true
});

// Create slug from title before saving
productSchema.pre('save', function(next) {
    if (!this.isModified('title')) return next();
    this.slug = this.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    next();
});

// Also generate slug when only slug is missing
productSchema.pre('validate', function(next) {
    if (!this.slug && this.title) {
        this.slug = this.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    }
    next();
});

// Ensure price validation works for updates
productSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    const salePrice = update.$set?.salePrice || update.salePrice;
    const newPrice = update.$set?.price || update.price;

    if (salePrice !== undefined) {
        const doc = await this.model.findOne(this.getQuery());
        if (!doc) {
            next(new Error('Product not found'));
            return;
        }

        const salePriceNum = Number(salePrice);
        const regularPrice = Number(newPrice !== undefined ? newPrice : doc.price);

        if (isNaN(salePriceNum) || isNaN(regularPrice)) {
            next(new Error('Invalid price values'));
            return;
        }

        if (salePriceNum > regularPrice) {
            next(new Error('Sale price must be less than or equal to regular price'));
            return;
        }
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
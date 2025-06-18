const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Collection name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Create slug from name before saving
collectionSchema.pre('save', function(next) {
    if (!this.isModified('name')) return next();
    this.slug = this.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
    next();
});

module.exports = mongoose.model('Collection', collectionSchema);
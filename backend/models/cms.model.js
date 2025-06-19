const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'html', 'carousel'],
        required: [true, 'Content block type is required']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Content block data is required']
    },
    order: {
        type: Number,
        default: 0
    }
});

const cmsPageSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: [true, 'Page slug is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Page title is required'],
        trim: true,
        minlength: [2, 'Title must be at least 2 characters long'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    metaDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    contentBlocks: [contentBlockSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    publishDate: {
        type: Date
    },
    isHomePage: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure only one homepage exists
cmsPageSchema.pre('save', async function(next) {
    if (this.isHomePage) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isHomePage: false } }
        );
    }
    next();
});

// Add indexes
cmsPageSchema.index({ slug: 1 }, { unique: true });
cmsPageSchema.index({ status: 1 });
cmsPageSchema.index({ publishDate: -1 });

module.exports = mongoose.model('CmsPage', cmsPageSchema);
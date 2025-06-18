const Collection = require('../models/collection.model');
const { validateObjectId } = require('../middleware/validate');

// Create new collection
exports.createCollection = async (req, res) => {
    try {
        const collection = new Collection(req.body);
        await collection.save();
        res.status(201).json({
            success: true,
            data: collection
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all collections
exports.getCollections = async (req, res) => {
    try {
        const collections = await Collection.find({ 
            active: true,
            $or: [
                { endDate: { $gt: new Date() } },
                { endDate: null }
            ]
        })
        .select('name slug description image order startDate endDate')
        .sort('order name');

        res.json({
            success: true,
            data: collections
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get collection by slug
exports.getCollectionBySlug = async (req, res) => {
    try {
        const collection = await Collection.findOne({ 
            slug: req.params.slug,
            active: true,
            $or: [
                { endDate: { $gt: new Date() } },
                { endDate: null }
            ]
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found'
            });
        }

        res.json({
            success: true,
            data: collection
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update collection
exports.updateCollection = async (req, res) => {
    try {
        if (!validateObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid collection ID'
            });
        }

        const collection = await Collection.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found'
            });
        }

        res.json({
            success: true,
            data: collection
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete collection
exports.deleteCollection = async (req, res) => {
    try {
        if (!validateObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid collection ID'
            });
        }

        const collection = await Collection.findByIdAndDelete(req.params.id);

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found'
            });
        }

        res.json({
            success: true,
            message: 'Collection deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
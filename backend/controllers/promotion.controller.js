const Promotion = require('../models/promotion.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

// Create new promotion
exports.createPromotion = async (req, res) => {
    try {
        // Validate dates
        if (new Date(req.body.endDate) <= new Date(req.body.startDate)) {
            return res.status(400).json({
                success: false,
                error: 'End date must be after start date'
            });
        }

        // Validate products and categories if provided
        if (req.body.applicableProducts) {
            const products = await Product.find({
                _id: { $in: req.body.applicableProducts }
            });
            if (products.length !== req.body.applicableProducts.length) {
                return res.status(400).json({
                    success: false,
                    error: 'One or more product IDs are invalid'
                });
            }
        }

        if (req.body.applicableCategories) {
            const categories = await Category.find({
                _id: { $in: req.body.applicableCategories }
            });
            if (categories.length !== req.body.applicableCategories.length) {
                return res.status(400).json({
                    success: false,
                    error: 'One or more category IDs are invalid'
                });
            }
        }

        const promotion = new Promotion(req.body);
        await promotion.save();

        res.status(201).json({
            success: true,
            data: promotion
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all promotions
exports.getPromotions = async (req, res) => {
    try {
        const { active, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        // Build query
        const query = {};
        if (active !== undefined) {
            query.active = active === 'true';
        }

        // Add date filtering for active promotions
        if (active === 'true') {
            const now = new Date();
            query.startDate = { $lte: now };
            query.endDate = { $gte: now };
        }

        // Count total documents
        const total = await Promotion.countDocuments(query);

        // Execute query with pagination and sorting
        const promotions = await Promotion.find(query)
            .populate('applicableProducts', 'title price')
            .populate('applicableCategories', 'name')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: promotions,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get single promotion
exports.getPromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id)
            .populate('applicableProducts', 'title price')
            .populate('applicableCategories', 'name');

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        res.json({
            success: true,
            data: promotion
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
    try {
        // Validate dates if provided
        if (req.body.startDate && req.body.endDate) {
            if (new Date(req.body.endDate) <= new Date(req.body.startDate)) {
                return res.status(400).json({
                    success: false,
                    error: 'End date must be after start date'
                });
            }
        }

        // Validate products and categories if provided
        if (req.body.applicableProducts) {
            const products = await Product.find({
                _id: { $in: req.body.applicableProducts }
            });
            if (products.length !== req.body.applicableProducts.length) {
                return res.status(400).json({
                    success: false,
                    error: 'One or more product IDs are invalid'
                });
            }
        }

        if (req.body.applicableCategories) {
            const categories = await Category.find({
                _id: { $in: req.body.applicableCategories }
            });
            if (categories.length !== req.body.applicableCategories.length) {
                return res.status(400).json({
                    success: false,
                    error: 'One or more category IDs are invalid'
                });
            }
        }

        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('applicableProducts', 'title price')
         .populate('applicableCategories', 'name');

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        res.json({
            success: true,
            data: promotion
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        res.json({
            success: true,
            message: 'Promotion deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

const mongoose = require('mongoose');

// Get active promotions for a product
exports.getProductPromotions = async (req, res) => {
    try {
        const now = new Date();
        
        // Validate productId format
        if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const promotions = await Promotion.find({
            active: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
                { applicableProducts: product._id },
                { applicableCategories: product.category }
            ]
        }).sort('discountValue');

        res.json({
            success: true,
            data: promotions
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
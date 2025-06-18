const mongoose = require('mongoose');
const Product = require('../models/product.model');
const { validateObjectId } = require('../middleware/validate');

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const { categories, collections } = req.body;

        // Convert to valid ObjectIds or handle error gracefully
        const validCategories = categories?.map(id => {
            try {
                return new mongoose.Types.ObjectId(id.toString().trim());
            } catch (err) {
                return null;
            }
        }).filter(id => id);

        const validCollections = collections?.map(id => {
            try {
                return new mongoose.Types.ObjectId(id.toString().trim());
            } catch (err) {
                return null;
            }
        }).filter(id => id);

        // Update request body with valid IDs
        req.body.categories = validCategories;
        req.body.collections = validCollections;

        const product = new Product(req.body);
        await product.save();
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all products with filtering, sorting and pagination
exports.getProducts = async (req, res) => {
    try {
        const { 
            category, collection, minPrice, maxPrice, 
            search, sort, page = 1, limit = 10 
        } = req.query;

        // Build query
        const query = {};

        // Filter by category
        if (category) {
            query.categories = category;
        }

        // Filter by collection
        if (collection) {
            query.collections = collection;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Search by title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Count total documents
        const total = await Product.countDocuments(query);

        // Execute query with pagination and sorting
        const products = await Product.find(query)
            .populate('categories', 'name')
            .populate('collections', 'name')
            .sort(sort || '-createdAt')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: products,
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

// Get single product by slug
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('categories', 'name slug')
            .populate('collections', 'name slug');

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        if (!validateObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }

        // Prepare update data
        const updateData = { ...req.body };



        // Handle categories
        if (updateData.categories) {
            const validCategories = updateData.categories.map(id => {
                try {
                    return new mongoose.Types.ObjectId(id.toString().trim());
                } catch (err) {
                    return null;
                }
            }).filter(id => id);
            updateData.categories = validCategories;
        }

        // Handle collections
        if (updateData.collections) {
            const validCollections = updateData.collections.map(id => {
                try {
                    return new mongoose.Types.ObjectId(id.toString().trim());
                } catch (err) {
                    return null;
                }
            }).filter(id => id);
            updateData.collections = validCollections;
        }

        // Handle images - remove backticks and trim spaces
        if (updateData.images) {
            updateData.images = updateData.images.map(img => 
                img.replace(/`/g, '').trim()
            );
        }

        // Update slug if title is changed
        if (updateData.title) {
            updateData.slug = updateData.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s]+/g, '-');
        }

        // Find the product first
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Update the product fields
        Object.keys(updateData).forEach(key => {
            product[key] = updateData[key];
        });

        // Save with validation
        await product.save();

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        if (!validateObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
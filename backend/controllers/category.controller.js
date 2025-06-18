const Category = require('../models/category.model');
const {validateObjectId} = require('../middleware/validate')

// Create new category
exports.createCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ active: true })
            .select('name slug description image order')
            .sort('order name');

        // Build category tree
        const categoryTree = categories.reduce((tree, category) => {
            if (!category.parent) {
                tree.push({
                    ...category.toObject(),
                    children: categories
                        .filter(child => child.parent && child.parent.toString() === category._id.toString())
                        .map(child => child.toObject())
                });
            }
            return tree;
        }, []);

        res.json({
            success: true,
            data: categoryTree
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get category by slug
exports.getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ 
            slug: req.params.slug,
            active: true
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        if (!validateObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID'
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        if (!validateObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID'
            });
        }

        // Check if category has child categories
        const hasChildren = await Category.exists({ parent: req.params.id });
        if (hasChildren) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete category with subcategories. Please delete subcategories first.'
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
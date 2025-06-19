const CmsPage = require('../models/cms.model');

// Create new CMS page
exports.createPage = async (req, res) => {
    try {
        // Check if trying to create another homepage when one already exists
        if (req.body.isHomePage) {
            const existingHomePage = await CmsPage.findOne({ isHomePage: true });
            if (existingHomePage) {
                return res.status(400).json({
                    success: false,
                    error: 'A homepage already exists. Please update the existing homepage instead.'
                });
            }
        }

        const page = new CmsPage({
            ...req.body,
            author: req.user._id,
            publishDate: req.body.status === 'published' ? Date.now() : null
        });

        await page.save();

        res.status(201).json({
            success: true,
            data: page
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all CMS pages (with filtering)
exports.getPages = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;

        // For public access, only show published pages
        if (!req.user || !req.user.role.includes('admin')) {
            query.status = 'published';
        }

        // Count total documents
        const total = await CmsPage.countDocuments(query);

        // Execute query with pagination and sorting
        const pages = await CmsPage.find(query)
            .populate('author', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: pages,
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

// Get single CMS page by slug
exports.getPage = async (req, res) => {
    try {
        const query = { slug: req.params.slug };

        // For public access, only show published pages
        if (!req.user || !req.user.role.includes('admin')) {
            query.status = 'published';
        }

        const page = await CmsPage.findOne(query)
            .populate('author', 'name email');

        if (!page) {
            return res.status(404).json({
                success: false,
                error: 'Page not found'
            });
        }

        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get homepage
exports.getHomePage = async (req, res) => {
    try {
        const query = { isHomePage: true };

        // For public access, only show published homepage
        if (!req.user || !req.user.role.includes('admin')) {
            query.status = 'published';
        }

        const page = await CmsPage.findOne(query)
            .populate('author', 'name email');

        if (!page) {
            return res.status(404).json({
                success: false,
                error: 'Homepage not found'
            });
        }

        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update CMS page
exports.updatePage = async (req, res) => {
    try {
        // Check if trying to create another homepage when one already exists
        if (req.body.isHomePage) {
            const existingHomePage = await CmsPage.findOne({
                isHomePage: true,
                _id: { $ne: req.params.id }
            });
            if (existingHomePage) {
                return res.status(400).json({
                    success: false,
                    error: 'A homepage already exists. Please update the existing homepage instead.'
                });
            }
        }

        // Update publish date if status is changing to published
        const page = await CmsPage.findById(req.params.id);
        if (!page) {
            return res.status(404).json({
                success: false,
                error: 'Page not found'
            });
        }

        if (req.body.status === 'published' && page.status !== 'published') {
            req.body.publishDate = Date.now();
        }

        const updatedPage = await CmsPage.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('author', 'name email');

        res.json({
            success: true,
            data: updatedPage
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete CMS page
exports.deletePage = async (req, res) => {
    try {
        const page = await CmsPage.findById(req.params.id);

        if (!page) {
            return res.status(404).json({
                success: false,
                error: 'Page not found'
            });
        }

        // Prevent deletion of homepage
        if (page.isHomePage) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete homepage. Create a new homepage first.'
            });
        }

        await page.remove();

        res.json({
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
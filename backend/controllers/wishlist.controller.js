const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');
const { validateObjectId } = require('../middleware/validate');

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private
 */
exports.getWishlist = async (req, res) => {
    try {
        console.time('getWishlist'); // Add performance timing
        
        // Add cache control headers
        res.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
        
        // Use lean() and projection for faster query execution with timeout
        let wishlist = await Promise.race([
            Wishlist.findOne(
                { userId: req.user.userId },
                { userId: 1, items: 1, _id: 1 } // Only select needed fields
            )
                .populate({
                    path: 'items.productId',
                    select: 'title price salePrice images slug stock', // Only select needed fields
                    options: { lean: true }
                })
                .lean()
                .maxTimeMS(25000), // Set maximum execution time for this query
            
            // Add a timeout promise
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 25000)
            )
        ]);

        if (!wishlist) {
            // Create new wishlist if it doesn't exist
            const newWishlist = new Wishlist({ userId: req.user.userId, items: [] });
            await newWishlist.save();
            wishlist = newWishlist.toObject();
        }

        console.timeEnd('getWishlist'); // Log performance timing
        
        res.status(200).json({
            success: true,
            data: wishlist.items
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        
        // More specific error message based on error type
        let errorMessage = 'Server error';
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            errorMessage = 'Database error, please try again later';
        } else if (error.message === 'Database query timeout') {
            errorMessage = 'Request timed out, please try again later';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
};

/**
 * Add item to wishlist
 * @route POST /api/wishlist
 * @access Private
 */
exports.addToWishlist = async (req, res) => {
    try {
        console.time('addToWishlist'); // Add performance timing
        
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }

        // Log the received productId for debugging
        console.log('Received productId:', productId);
        
        // Validate if product exists with timeout
        const productExists = await Promise.race([
            Product.findById(productId, { _id: 1 }).lean().maxTimeMS(10000),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Product lookup timeout')), 10000)
            )
        ]);

        if (!productExists) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Use findOneAndUpdate with upsert for atomic operation with timeout
        const result = await Promise.race([
            Wishlist.findOneAndUpdate(
                { userId: req.user.userId },
                { 
                    $addToSet: { 
                        items: { 
                            productId, 
                            addedAt: new Date() 
                        } 
                    } 
                },
                { 
                    new: true, 
                    upsert: true,
                    projection: { userId: 1, items: 1, _id: 1 } // Only return needed fields
                }
            )
            .populate({
                path: 'items.productId',
                select: 'title price salePrice images slug stock', // Only select needed fields
                options: { lean: true }
            })
            .lean()
            .maxTimeMS(15000),
            
            // Add a timeout promise
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database update timeout')), 15000)
            )
        ]);

        console.timeEnd('addToWishlist'); // Log performance timing
        
        res.status(200).json({
            success: true,
            message: 'Product added to wishlist',
            data: result.items
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        
        // More specific error message based on error type
        let errorMessage = 'Server error';
        let statusCode = 500;
        
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            errorMessage = 'Database error, please try again later';
        } else if (error.message === 'Product lookup timeout' || error.message === 'Database update timeout') {
            errorMessage = 'Request timed out, please try again later';
        } else if (error.name === 'CastError') {
            errorMessage = 'Invalid product ID format';
            statusCode = 400;
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
};

/**
 * Remove item from wishlist
 * @route DELETE /api/wishlist/:productId
 * @access Private
 */
exports.removeFromWishlist = async (req, res) => {
    try {
        console.time('removeFromWishlist'); // Add performance timing
        const { productId } = req.params;

        // Validate productId
        if (!productId || !validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }

        // First check if wishlist exists
        let wishlist = await Wishlist.findOne({ userId: req.user.userId });
        
        if (!wishlist) {
            // Create new empty wishlist if it doesn't exist
            wishlist = new Wishlist({ userId: req.user.userId, items: [] });
            await wishlist.save();
            
            return res.status(200).json({
                success: true,
                message: 'Wishlist is empty',
                data: []
            });
        }
        
        // Check if product is in wishlist
        const productExists = wishlist.items.some(item => 
            item.productId.toString() === productId
        );
        
        if (!productExists) {
            return res.status(200).json({
                success: true,
                message: 'Product not in wishlist',
                data: wishlist.items
            });
        }

        // Use findOneAndUpdate for atomic operation with timeout
        const result = await Promise.race([
            Wishlist.findOneAndUpdate(
                { 
                    userId: req.user.userId,
                    'items.productId': productId // Only update if product is in wishlist
                },
                { 
                    $pull: { items: { productId: productId } }
                },
                { 
                    new: true
                }
            )
            .populate({
                path: 'items.productId',
                select: 'title price salePrice images slug stock', // Only select needed fields
                options: { lean: true }
            })
            .lean()
            .maxTimeMS(15000),
            
            // Add a timeout promise
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database update timeout')), 15000)
            )
        ]);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Wishlist not found'
            });
        }

        console.timeEnd('removeFromWishlist'); // Log performance timing

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist',
            data: result.items
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        
        // More specific error message based on error type
        let errorMessage = 'Server error';
        let statusCode = 500;
        
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            errorMessage = 'Database error, please try again later';
        } else if (error.message === 'Database update timeout') {
            errorMessage = 'Request timed out, please try again later';
        } else if (error.name === 'CastError') {
            errorMessage = 'Invalid product ID format';
            statusCode = 400;
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
};

/**
 * Clear wishlist
 * @route DELETE /api/wishlist
 * @access Private
 */
exports.clearWishlist = async (req, res) => {
    try {
        console.time('clearWishlist'); // Add performance timing

        // First check if wishlist exists
        let wishlist = await Wishlist.findOne({ userId: req.user.userId });
        
        if (!wishlist) {
            // Create new empty wishlist if it doesn't exist
            wishlist = new Wishlist({ userId: req.user.userId, items: [] });
            await wishlist.save();
            
            return res.status(200).json({
                success: true,
                message: 'Wishlist is already empty',
                data: []
            });
        }

        // Use findOneAndUpdate for atomic operation with timeout
        const result = await Promise.race([
            Wishlist.findOneAndUpdate(
                { userId: req.user.userId },
                { $set: { items: [] } },
                { new: true }
            )
            .lean()
            .maxTimeMS(15000),
            
            // Add a timeout promise
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database update timeout')), 15000)
            )
        ]);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Wishlist not found'
            });
        }

        console.timeEnd('clearWishlist'); // Log performance timing

        res.status(200).json({
            success: true,
            message: 'Wishlist cleared',
            data: []
        });
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        
        // More specific error message based on error type
        let errorMessage = 'Server error';
        let statusCode = 500;
        
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            errorMessage = 'Database error, please try again later';
        } else if (error.message === 'Database update timeout') {
            errorMessage = 'Request timed out, please try again later';
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
};
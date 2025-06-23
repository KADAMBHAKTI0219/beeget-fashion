const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { validateObjectId } = require('../middleware/validate');

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.userId })
            .populate('items.productId', 'title price images stock inventoryCount slug');

        if (!cart) {
            cart = await Cart.create({ userId: req.user.userId, items: [] });
        }

        // Update product details in cart items if they're missing or outdated
        if (cart.items && cart.items.length > 0) {
            let hasChanges = false;
            
            for (const item of cart.items) {
                if (item.productId) {
                    // Check if product details need to be updated
                    if (!item.productDetails || 
                        item.productDetails.title !== item.productId.title || 
                        item.productDetails.price !== (item.productId.salePrice || item.productId.price) ||
                        !item.productDetails.slug) {
                        
                        item.productDetails = {
                            title: item.productId.title,
                            price: item.productId.salePrice || item.productId.price,
                            image: item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null,
                            slug: item.productId.slug
                        };
                        hasChanges = true;
                    }
                }
            }
            
            if (hasChanges) {
                await cart.save();
            }
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity, size, color } = req.body;

        // Validate product exists and has sufficient stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (product.inventoryCount < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient stock'
            });
        }

        // Prepare product details to store in cart
        const productDetails = {
            title: product.title,
            price: product.salePrice || product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            slug: product.slug
        };

        // Find or create cart
        let cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) {
            cart = await Cart.create({
                userId: req.user.userId,
                items: [{ productId, quantity, size, color, productDetails }]
            });
        } else {
            // Check if product already exists in cart with the same size and color
            const existingItem = cart.items.find(item => 
                item.productId.toString() === productId && 
                (size ? item.size === size : !item.size) && 
                (color ? item.color === color : !item.color)
            );

            if (existingItem) {
                existingItem.quantity += quantity;
                // Update product details in case they've changed
                existingItem.productDetails = productDetails;
            } else {
                cart.items.push({ productId, quantity, size, color, productDetails });
            }

            await cart.save();
        }

        // Populate product details
        await cart.populate('items.productId', 'title price images stock inventoryCount');

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity, size, color } = req.body;

        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const cartItem = cart.items.id(itemId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }

        // Validate product has sufficient stock
        const product = await Product.findById(cartItem.productId);
        if (product.inventoryCount < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient stock'
            });
        }

        // Update quantity
        cartItem.quantity = quantity;
        
        // Update size and color if provided
        if (size) cartItem.size = size;
        if (color) cartItem.color = color;
        
        // Update product details in case they've changed
        cartItem.productDetails = {
            title: product.title,
            price: product.salePrice || product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            slug: product.slug
        };
        
        await cart.save();
        await cart.populate('items.productId', 'title price images stock inventoryCount');

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { size, color } = req.body;

        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        // If size and color are provided, remove only the item with matching size and color
        if (size || color) {
            const cartItem = cart.items.find(item => 
                item._id.toString() === itemId && 
                (size ? item.size === size : true) && 
                (color ? item.color === color : true)
            );

            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart item not found with the specified size and color'
                });
            }

            cart.items = cart.items.filter(item => 
                !(item._id.toString() === itemId && 
                (size ? item.size === size : true) && 
                (color ? item.color === color : true))
            );
        } else {
            // If no size and color are provided, remove by ID only
            cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        }

        await cart.save();
        await cart.populate('items.productId', 'title price images stock inventoryCount slug');

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
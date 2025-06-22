const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const Promotion = require('../models/promotion.model');
const axios = require('axios');
const { validateObjectId } = require('../middleware/validate');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        console.log('Order payload received:', JSON.stringify(req.body, null, 2));
        
        let { shippingAddress, paymentMethod, items, subtotal, total, couponCode } = req.body;
        let discountAmount = 0;
        let appliedCoupon = null;
        
        // If shipping address is not provided, try to get the default address
        if (!shippingAddress || Object.keys(shippingAddress).length === 0) {
            try {
                const User = require('../models/user.model');
                const user = await User.findById(req.user.userId).select('addresses');
                
                if (user && user.addresses && user.addresses.length > 0) {
                    shippingAddress = user.addresses[0];
                    console.log('Using default address:', shippingAddress);
                }
            } catch (addressErr) {
                console.error('Error fetching default address:', addressErr);
                // Continue with the order process even if getting default address fails
            }
        }

        // Validate required shipping address fields
        const requiredFields = ['line1', 'city', 'state', 'zip', 'country'];
        const missingFields = requiredFields.filter(field => !shippingAddress?.[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required shipping fields: ${missingFields.join(', ')}`
            });
        }

        // Validate items from request
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Order items are required'
            });
        }

        // Validate stock and prepare order items
        const orderItems = [];
        let totalAmount = 0;

        // Process items from the request payload
        for (const item of items) {
            console.log('Processing item:', item);
            
            // Ensure all required fields are present and properly formatted
            const productId = item.productId;
            const quantity = parseInt(item.quantity) || 1;
            const price = parseFloat(item.price) || 0;
            
            // Validate product ID
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Product ID is required for all items'
                });
            }

            try {
                // Get product from database
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(400).json({
                        success: false,
                        error: `Product not found: ${productId}`
                    });
                }

                // Check stock (if product has stock field)
                if (product.stock !== undefined && product.stock < quantity) {
                    return res.status(400).json({
                        success: false,
                        error: `Insufficient stock for ${product.title}`
                    });
                }

                // Add to order items
                orderItems.push({
                    productId: product._id,
                    quantity: quantity,
                    priceAtPurchase: price || product.price
                });

                // Update total amount
                totalAmount += (price || product.price) * quantity;

                // Update product stock if it has stock field
                if (product.stock !== undefined) {
                    product.stock -= quantity;
                    await product.save();
                }
            } catch (err) {
                console.error(`Error processing product ${productId}:`, err);
                return res.status(400).json({
                    success: false,
                    error: `Error processing product ${productId}: ${err.message}`
                });
            }
        }

        console.log('Creating order with items:', orderItems);
        
        // If coupon code is provided, verify and apply it
        if (couponCode) {
            try {
                // Verify the coupon internally instead of making an HTTP request
                const promotion = await Promotion.findOne({
                    'userCoupons.couponCode': couponCode,
                    active: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() }
                });

                if (!promotion) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid or expired coupon code'
                    });
                }

                // Find the specific coupon in the userCoupons array
                const userCoupon = promotion.userCoupons.find(coupon => 
                    coupon.couponCode === couponCode && 
                    coupon.userId.toString() === req.user.userId.toString() && 
                    !coupon.isUsed
                );

                if (!userCoupon) {
                    return res.status(400).json({
                        success: false,
                        error: 'Coupon is not valid for this user or has already been used'
                    });
                }

                // Check minimum purchase if applicable
                if (promotion.minimumPurchase && totalAmount < promotion.minimumPurchase) {
                    return res.status(400).json({
                        success: false,
                        error: `Minimum purchase of $${promotion.minimumPurchase} required for this coupon`
                    });
                }

                // Calculate discount
                if (promotion.discountType === 'percentage') {
                    discountAmount = (totalAmount * promotion.discountValue) / 100;
                } else { // fixed amount
                    discountAmount = promotion.discountValue;
                }

                // Ensure discount doesn't exceed the total
                if (discountAmount > totalAmount) {
                    discountAmount = totalAmount;
                }

                // Update total amount after discount
                totalAmount = totalAmount - discountAmount;
                
                // Save the applied coupon for later use
                appliedCoupon = {
                    promotionId: promotion._id,
                    couponCode: couponCode,
                    userCouponId: userCoupon._id
                };
            } catch (couponError) {
                console.error('Error verifying coupon:', couponError);
                return res.status(500).json({
                    success: false,
                    error: 'Error verifying coupon: ' + couponError.message
                });
            }
        }

        // Create order
        const order = await Order.create({
            userId: req.user.userId,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            couponCode: couponCode || null,
            discountAmount: discountAmount,
            subtotalAmount: subtotal || totalAmount + discountAmount,
            totalAmount: total || totalAmount,
            paymentStatus: 'pending',
            orderStatus: 'processing'
        });

        // If a coupon was applied, mark it as used
        if (appliedCoupon) {
            try {
                await Promotion.updateOne(
                    { 
                        _id: appliedCoupon.promotionId,
                        'userCoupons._id': appliedCoupon.userCouponId 
                    },
                    { 
                        $set: { 
                            'userCoupons.$.isUsed': true,
                            'userCoupons.$.usedAt': new Date()
                        },
                        $inc: { usageCount: 1 }
                    }
                );
            } catch (couponUpdateErr) {
                console.error('Error marking coupon as used:', couponUpdateErr);
                // Don't fail the order if coupon update fails
            }
        }

        // Clear cart if order was successful
        try {
            const cart = await Cart.findOne({ userId: req.user.userId });
            if (cart) {
                cart.items = [];
                await cart.save();
            }
        } catch (cartErr) {
            console.error('Error clearing cart:', cartErr);
            // Don't fail the order if cart clearing fails
        }

        // Populate order details
        try {
            await order.populate('items.productId', 'title price images');
        } catch (populateErr) {
            console.error('Error populating order details:', populateErr);
            // Continue even if population fails
        }

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while creating the order'
        });
    }
};

// Get user's orders
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .populate('items.productId', 'title price images')
            .sort('-createdAt');

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get a single order
exports.getOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the id is a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (!isValidObjectId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }
        
        // Find by MongoDB _id
        const order = await Order.findOne({
            _id: id,
            userId: req.user.userId
        }).populate('items.productId', 'title price images');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
    try {
        // Initialize empty query object
        const query = {};
        
        // Support pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find(query)
            .populate('items.productId', 'title price images')
            .populate('userId', 'name email')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);
            
        // Get total count for pagination
        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus, paymentStatus } = req.body;

        // Check if the id is a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (!isValidObjectId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }
        
        // Find by MongoDB _id
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save();
        await order.populate('items.productId', 'title price images');

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the id is a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (!isValidObjectId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }
        
        // Find by MongoDB _id
        const order = await Order.findOne({
            _id: id,
            userId: req.user.userId,
            orderStatus: { $nin: ['delivered', 'cancelled'] }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or cannot be cancelled'
            });
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        order.orderStatus = 'cancelled';
        await order.save();
        await order.populate('items.productId', 'title price images');

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
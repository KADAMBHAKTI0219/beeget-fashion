const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { validateObjectId } = require('../middleware/validate');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;

        // Validate required shipping address fields
        const requiredFields = ['line1', 'city', 'state', 'zip', 'country'];
        const missingFields = requiredFields.filter(field => !shippingAddress?.[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required shipping fields: ${missingFields.join(', ')}`
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Validate stock and prepare order items
        const orderItems = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = item.productId;

            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for ${product.title}`
                });
            }

            // Add to order items
            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                priceAtPurchase: product.price
            });

            // Update total amount
            totalAmount += product.price * item.quantity;

            // Update product stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Create order
        const order = await Order.create({
            userId: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            totalAmount,
            paymentStatus: 'pending',
            orderStatus: 'processing'
        });

        // Clear cart
        cart.items = [];
        await cart.save();

        // Populate order details
        await order.populate('items.productId', 'title price images');

        res.status(201).json({
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

// Get user's orders
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
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

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            userId: req.user._id
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

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus, paymentStatus } = req.body;

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

        const order = await Order.findOne({
            _id: id,
            userId: req.user._id,
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
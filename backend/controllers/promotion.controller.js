const Promotion = require('../models/promotion.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const User = require('../models/user.model');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer with the correct environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

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
        
        // Generate a custom slug if needed
        if (req.body.name) {
            const baseName = req.body.name;
            const baseSlug = baseName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s]+/g, '-');
            
            // Check if a promotion with this slug already exists
            const existingPromotion = await Promotion.findOne({ slug: baseSlug });
            
            if (existingPromotion) {
                // Add a timestamp to make the slug unique
                const timestamp = Date.now().toString().slice(-4);
                req.body.slug = `${baseSlug}-${timestamp}`;
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

// Get user's coupons
exports.getUserCoupons = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Find all promotions with coupons for this user
        const promotions = await Promotion.find({
            'userCoupons.userId': userId,
            active: true,
            endDate: { $gte: new Date() }
        });

        // Extract coupon information
        const coupons = [];
        promotions.forEach(promotion => {
            promotion.userCoupons.forEach(coupon => {
                if (coupon.userId.toString() === userId) {
                    coupons.push({
                        promotionId: promotion._id,
                        promotionName: promotion.name,
                        promotionDescription: promotion.description,
                        discountType: promotion.discountType,
                        discountValue: promotion.discountValue,
                        couponCode: coupon.couponCode,
                        isUsed: coupon.isUsed,
                        usedAt: coupon.usedAt,
                        expiresAt: coupon.expiresAt,
                        isExpired: new Date() > coupon.expiresAt,
                        image: promotion.image
                    });
                }
            });
        });

        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Generate and send coupons to users
exports.generateUserCoupons = async (req, res) => {
    try {
        const { promotionId, userIds } = req.body;

        if (!promotionId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Promotion ID and at least one user ID are required'
            });
        }

        // Find the promotion
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        // Check if it's a coupon type promotion
        if (promotion.promotionType !== 'coupon') {
            return res.status(400).json({
                success: false,
                error: 'This promotion is not configured for individual coupon codes'
            });
        }

        // Find users
        const users = await User.find({ _id: { $in: userIds } });
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No valid users found'
            });
        }

        const results = [];
        const errors = [];
        const couponsToAdd = [];

        // Generate and prepare coupons for each user
        for (const user of users) {
            try {
                // Check if user already has a coupon for this promotion
                const existingCoupon = promotion.userCoupons.find(
                    coupon => coupon.userId.toString() === user._id.toString() && !coupon.isUsed
                );

                if (existingCoupon) {
                    results.push({
                        userId: user._id,
                        email: user.email,
                        status: 'skipped',
                        message: 'User already has an active coupon for this promotion'
                    });
                    continue;
                }

                // Generate a unique coupon code
                const couponCode = generateCouponCode(promotion.couponPrefix, promotion.couponLength);
                
                // Calculate expiry date
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + promotion.couponExpireDays);

                // Prepare coupon data
                const couponData = {
                    userId: user._id,
                    email: user.email,
                    couponCode,
                    expiresAt: expiryDate
                };

                // Add to list of coupons to add to promotion
                couponsToAdd.push(couponData);

                try {
                    // Try to send email
                    await sendCouponEmail(user.email, couponCode, promotion, expiryDate);
                    
                    results.push({
                        ...couponData,
                        status: 'success'
                    });
                } catch (emailError) {
                    // If email fails, still add the coupon but record the error
                    results.push({
                        ...couponData,
                        status: 'partial',
                        message: 'Coupon created but email failed to send'
                    });
                    
                    errors.push({
                        userId: user._id,
                        email: user.email,
                        error: emailError.message
                    });
                }
            } catch (error) {
                errors.push({
                    userId: user._id,
                    email: user.email,
                    error: error.message
                });
            }
        }

        // Add all coupons to the promotion
        promotion.userCoupons.push(...couponsToAdd);
        
        // Save the updated promotion
        await promotion.save();

        res.json({
            success: true,
            data: {
                results,
                errors,
                successCount: results.filter(r => r.status === 'success').length,
                partialCount: results.filter(r => r.status === 'partial').length,
                skippedCount: results.filter(r => r.status === 'skipped').length,
                errorCount: errors.length
            }
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

// Helper function to generate a unique coupon code
const generateCouponCode = (prefix = '', length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix ? prefix + '-' : '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Helper function to send coupon email
const sendCouponEmail = async (email, couponCode, promotion, expiryDate) => {
    // Verify SMTP configuration is available
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.FROM_EMAIL) {
        console.error('Email configuration missing. Check environment variables.');
        throw new Error('Email configuration missing. Please check server settings.');
    }

    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: `Your Exclusive Coupon: ${promotion.name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your Exclusive Coupon Code</h2>
                <p>Dear Customer,</p>
                <p>Thank you for shopping with us! Here's your exclusive coupon code for the promotion: <strong>${promotion.name}</strong></p>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
                    <h3 style="margin: 0; color: #e63946; font-size: 24px;">${couponCode}</h3>
                </div>
                <p><strong>Discount:</strong> ${promotion.discountType === 'percentage' ? promotion.discountValue + '%' : '$' + promotion.discountValue}</p>
                <p><strong>Expires on:</strong> ${expiryDate.toLocaleDateString()}</p>
                <p>${promotion.description || ''}</p>
                <p>This coupon is for one-time use only and is exclusive to your account.</p>
                <p>Happy Shopping!</p>
                <p>The Beeget Fashion Team</p>
            </div>
        `
    };

    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Verify and validate a user coupon
exports.verifyCoupon = async (req, res) => {
    try {
        const { couponCode, userId } = req.body;

        if (!couponCode || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Coupon code and user ID are required'
            });
        }

        // Find promotion with this coupon code
        const promotion = await Promotion.findOne({
            'userCoupons.couponCode': couponCode,
            'userCoupons.userId': userId,
            active: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired coupon'
            });
        }

        // Find the specific coupon
        const coupon = promotion.userCoupons.find(
            c => c.couponCode === couponCode && c.userId.toString() === userId
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        // Check if coupon is already used
        if (coupon.isUsed) {
            return res.status(400).json({
                success: false,
                error: 'This coupon has already been used'
            });
        }

        // Check if coupon is expired
        if (new Date() > coupon.expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'This coupon has expired'
            });
        }

        // Return coupon details
        res.json({
            success: true,
            data: {
                promotionId: promotion._id,
                promotionName: promotion.name,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                couponCode: coupon.couponCode,
                expiresAt: coupon.expiresAt
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Redeem a user coupon
exports.redeemCoupon = async (req, res) => {
    try {
        const { couponCode, userId, orderId } = req.body;

        if (!couponCode || !userId || !orderId) {
            return res.status(400).json({
                success: false,
                error: 'Coupon code, user ID, and order ID are required'
            });
        }

        // Find promotion with this coupon code
        const promotion = await Promotion.findOne({
            'userCoupons.couponCode': couponCode,
            'userCoupons.userId': userId,
            active: true
        });

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Invalid coupon'
            });
        }

        // Find the specific coupon
        const couponIndex = promotion.userCoupons.findIndex(
            c => c.couponCode === couponCode && c.userId.toString() === userId
        );

        if (couponIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        const coupon = promotion.userCoupons[couponIndex];

        // Check if coupon is already used
        if (coupon.isUsed) {
            return res.status(400).json({
                success: false,
                error: 'This coupon has already been used'
            });
        }

        // Check if coupon is expired
        if (new Date() > coupon.expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'This coupon has expired'
            });
        }

        // Mark coupon as used
        promotion.userCoupons[couponIndex].isUsed = true;
        promotion.userCoupons[couponIndex].usedAt = new Date();
        
        // Increment usage count
        promotion.usageCount = (promotion.usageCount || 0) + 1;

        await promotion.save();

        res.json({
            success: true,
            message: 'Coupon redeemed successfully',
            data: {
                promotionId: promotion._id,
                promotionName: promotion.name,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                couponCode: coupon.couponCode,
                redeemedAt: new Date()
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

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
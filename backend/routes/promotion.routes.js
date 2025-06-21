const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createPromotion,
    getPromotions,
    getPromotion,
    updatePromotion,
    deletePromotion,
    getProductPromotions,
    generateUserCoupons,
    verifyCoupon,
    redeemCoupon,
    getUserCoupons
} = require('../controllers/promotion.controller');

// Public routes
router.get('/product/:productId', getProductPromotions);

// User routes (requires authentication)
router.get('/user/:userId', auth(), getUserCoupons);
router.post('/verify-coupon', auth(), verifyCoupon);
router.post('/redeem-coupon', auth(), redeemCoupon);

// Admin only routes
router.use(auth('admin'));
router.route('/')
    .post(createPromotion)
    .get(getPromotions);

router.route('/:id')
    .get(getPromotion)
    .put(updatePromotion)
    .delete(deletePromotion);
    
// Generate and send coupons to users (admin only)
router.post('/generate-coupons', generateUserCoupons);

module.exports = router;
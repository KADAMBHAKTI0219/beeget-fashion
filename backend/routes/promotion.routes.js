const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createPromotion,
    getPromotions,
    getPromotion,
    updatePromotion,
    deletePromotion,
    getProductPromotions
} = require('../controllers/promotion.controller');

// Public routes
router.get('/product/:productId', getProductPromotions);

// Admin only routes
router.use(auth('admin'));
router.route('/')
    .post(createPromotion)
    .get(getPromotions);

router.route('/:id')
    .get(getPromotion)
    .put(updatePromotion)
    .delete(deletePromotion);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { validateRequest } = require('../middleware/validate');
const auth = require('../middleware/auth');
const { 
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    resendVerificationSchema
} = require('./auth.validation');   

// Auth routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification-email', validateRequest(resendVerificationSchema), authController.resendVerificationEmail);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

// Profile routes (protected)
router.get('/profile', auth(), authController.getProfile);
router.patch('/profile', auth(), authController.updateProfile);

module.exports = router;
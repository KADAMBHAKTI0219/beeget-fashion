const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/user.model');

// Helper function to generate access token
const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

// Helper function to generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Helper function to generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper function to send email
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: verificationTokenExpiry
        });

        await user.save();

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const emailSent = await sendEmail(
            email,
            'Verify Your Email - Beeget Fashion',
            `<h1>Welcome to Beeget Fashion, ${name}!</h1>
            <p>Thank you for registering with us. Please verify your email by clicking the link below:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>`
        );

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            emailStatus: emailSent ? 'Verification email sent successfully' : 'Email sending failed'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in',
                needsVerification: true,
                email: user.email
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);

        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Set the access token in Authorization header
        res.setHeader('Authorization', `Bearer ${accessToken}`);

        res.json({
            message: 'Login successful',
            isEmailVerified: user.isEmailVerified,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Generate new access token
        const accessToken = generateAccessToken(user._id);

        // Set the new access token in Authorization header
        res.setHeader('Authorization', `Bearer ${accessToken}`);

        res.json({
            message: 'Token refreshed successfully',
            accessToken
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        // Find user and remove refresh token
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if email is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new verification token
        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpiry = verificationTokenExpiry;
        await user.save();

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const emailSent = await sendEmail(
            email,
            'Verify Your Email - Beeget Fashion',
            `<h1>Welcome to Beeget Fashion!</h1>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>`
        );

        res.json({
            message: 'Verification email resent successfully',
            emailStatus: emailSent ? 'Verification email sent successfully' : 'Email sending failed'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        // Find user with the verification token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired verification token',
                needsVerification: true,
                email: user ? user.email : null
            });
        }

        // Update user verification status
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpiry = null;

        // Generate tokens for auto-login after verification
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;

        await user.save();

        // Set the access token in Authorization header
        res.setHeader('Authorization', `Bearer ${accessToken}`);

        res.json({
            message: 'Email verified successfully',
            isEmailVerified: true,
            accessToken,
            refreshToken,
            user: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.RESET_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        // Save reset token
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        const emailSent = await sendEmail(
            email,
            'Password Reset Request',
            `<h1>Password Reset Request</h1>
            <p>You requested a password reset for your Beeget Fashion account.</p>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>`
        );

        res.json({
            message: 'Password reset email sent',
            emailStatus: emailSent ? 'Email sent successfully' : 'Email sending failed'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        const user = await User.findOne({
            resetToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        // Send confirmation email
        const emailSent = await sendEmail(
            user.email,
            'Password Reset Successful',
            `<h1>Password Reset Successful</h1>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>`
        );

        res.json({
            message: 'Password reset successful',
            emailStatus: emailSent ? 'Confirmation email sent' : 'Confirmation email failed'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword
};
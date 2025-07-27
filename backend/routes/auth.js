import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import OTP from '../models/Otp.js';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';

dotenv.config();

const router = express.Router();
router.use(cookieParser());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper function to validate institutional email
const validateInstitutionalEmail = (email) => {
  const institutionalDomains = [
    'srmist.edu.in',
    'srmtrichy.edu.in',
    'eswari.edu.in',
    'trp.edu.in'
  ];
  const domain = email.split('@')[1];
  return institutionalDomains.includes(domain);
};

// Login Route
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email,
        college: user.college || null,
        category: user.category || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return user data and token (for frontend localStorage if needed)
    const userData = user.toObject();
    delete userData.password;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }
});

// Token Verification Route
router.get('/verify-token', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    // Accept token from either cookie or Authorization header
    let token = req.cookies.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Forgot Password Route
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { email } = req.body;

  try {
    if (!validateInstitutionalEmail(email)) {
      return res.status(403).json({
        success: false,
        message: 'Only institutional emails are allowed'
      });
    }

    // Check if user exists (but don't reveal if they don't)
    const userExists = await User.exists({ email });
    if (!userExists) {
      return res.json({
        success: true,
        message: 'If an account exists, an OTP has been sent'
      });
    }

    // Create and save OTP
    const otpDoc = await OTP.createOTP(email);
    const otp = otpDoc.otp;

    // Send email with OTP
    const mailOptions = {
      from: `"ScholarSync" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: 'OTP sent to your email'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

// Verify OTP Route (does NOT mark OTP as used)
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { email, otp } = req.body;

  try {
    await OTP.verifyOTP(email, otp);

    return res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'OTP verification failed'
    });
  }
});

// Reset Password Route (ONLY one! - does OTP consume + password update)
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { email, otp, newPassword } = req.body;

  try {
    // 1. Mark OTP as used if valid
    await OTP.consumeOTP(email, otp);

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 3. Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // 4. Hash and update password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    // 5. Delete all OTPs for this email
    await OTP.deleteMany({ email });

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

export default router;
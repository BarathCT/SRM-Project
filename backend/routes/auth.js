import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // keep as 'bcrypt' since that's what you use elsewhere
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
    'eec.srmrmp.edu.in',
    'trp.srmtrichy.edu.in'
  ];
  const domain = email.split('@')[1];
  return institutionalDomains.includes(domain);
};

// ------------------------- LOGIN -------------------------
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
    // Find active user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

const token = jwt.sign(
  {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    facultyId: user.facultyId,
    college: user.college || null,
    institute: user.institute || null,
    department: user.department || null,
    category: user.category || null
  },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

    // Optional cookie (you can keep it and also return token in body)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',              // if you need cross-site cookie between ports, consider 'lax'
      maxAge: 24 * 60 * 60 * 1000
    });

    // Return safe user object + token
    const userData = user.toObject();
    delete userData.password;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        ...userData,
        facultyId: user.facultyId     // ensure frontend gets it too
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }
});

// -------------------- VERIFY TOKEN --------------------
router.get('/verify-token', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    // Accept token from cookie or Authorization header
    let token = req.cookies.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // We still fetch the latest user doc for UI, but decoded contains facultyId for middleware use
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user,
      // optional: echo parts of the decoded token if you want
      tokenPayload: {
        role: decoded.role,
        facultyId: decoded.facultyId,
        email: decoded.email,
        college: decoded.college ?? null,
        category: decoded.category ?? null
      }
    });

  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// ------------------------- LOGOUT -------------------------
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------- FORGOT PASSWORD --------------------
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
      return res.status(403).json({ success: false, message: 'Only institutional emails are allowed' });
    }

    // Check if user exists (do not reveal if not)
    const userExists = await User.exists({ email });
    if (!userExists) {
      return res.json({ success: true, message: 'If an account exists, an OTP has been sent' });
    }

    // Create & send OTP
    const otpDoc = await OTP.createOTP(email);
    const otp = otpDoc.otp;

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

    return res.json({ success: true, message: 'OTP sent to your email' });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// ----------------------- VERIFY OTP -----------------------
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
    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(400).json({ success: false, message: err.message || 'OTP verification failed' });
  }
});

// ---------------------- RESET PASSWORD ----------------------
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
    await OTP.consumeOTP(email, otp);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    await OTP.deleteMany({ email });

    return res.json({ success: true, message: 'Password reset successfully' });

  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

export default router;

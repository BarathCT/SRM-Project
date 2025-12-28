import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import OTP from '../models/Otp.js';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch'; // Add this import

dotenv.config();

const router = express.Router();
router.use(cookieParser());

// Remove the nodemailer transporter entirely

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

// Helper function to send email via Brevo API
const sendEmailViaBrevo = async (to, subject, html, toName = '') => {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'ScholarSync',
          email: brevoSenderEmail
        },
        to: [{
          email: to,
          name: toName
        }],
        subject: subject,
        htmlContent: html,
        replyTo: {
          email: brevoSenderEmail,
          name: 'ScholarSync Support'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error Response:', data);
      throw new Error(`Brevo API error: ${data.message || JSON.stringify(data)}`);
    }

    console.log('✅ Email sent successfully via Brevo API. Message ID:', data.messageId);
    return { success: true, messageId: data.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send email via Brevo API:', error.message);
    throw error;
  }
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
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    const userData = user.toObject();
    delete userData.password;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        ...userData,
        facultyId: user.facultyId
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
    let token = req.cookies.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user,
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

    const userExists = await User.exists({ email });
    if (!userExists) {
      return res.json({ success: true, message: 'If an account exists, an OTP has been sent' });
    }

    const otpDoc = await OTP.createOTP(email);
    const otp = otpDoc.otp;

    // Get user's name for email personalization
    const user = await User.findOne({ email });
    const userName = user ? user.fullName : 'User';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #2563eb; text-align: center; margin-bottom: 24px;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello ${userName},</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">You requested to reset your password. Use the OTP below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #60a5fa, #3b82f6); color: white; font-size: 28px; font-weight: bold; padding: 15px 40px; border-radius: 10px; letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            This OTP is valid for 10 minutes.
          </p>
          <p style="color: #ef4444; font-size: 14px; text-align: center; background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and contact support immediately.
          </p>
        </div>
      </div>
    `;

    await sendEmailViaBrevo(email, 'Password Reset OTP - ScholarSync', html, userName);

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

    // Send confirmation email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
          <h2 style="color: #10b981; margin-bottom: 20px;">✅ Password Reset Successful</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello ${user.fullName},</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Your ScholarSync account password has been successfully reset.</p>
          <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="color: #047857; margin: 0;">
              <strong>Security Tip:</strong> For added security, consider enabling two-factor authentication in your account settings.
            </p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            If you didn't make this change, please contact support immediately.
          </p>
        </div>
      </div>
    `;

    await sendEmailViaBrevo(email, 'Password Reset Confirmation - ScholarSync', html, user.fullName);

    return res.json({ success: true, message: 'Password reset successfully' });

  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

export default router;
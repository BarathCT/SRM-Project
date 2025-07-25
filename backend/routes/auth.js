import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// ✅ POST /api/auth/login — Login with email & password
// Updated login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Add .select('+password') to include the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Include fullName in the token payload
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        fullName: user.fullName, // Added this
        college: user.college,
        category: user.category,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        college: user.college,
        category: user.category,
        fullName: user.fullName, // Added this
      }
    });
  } catch (err) {
    console.error('Login error:', err); // Add logging
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// ✅ Optional: test route to verify auth token
router.get('/verify-token', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

export default router;
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication token required' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

/**
 * @route GET /api/settings
 * @desc Get current user's settings
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // Return user data without sensitive information
    const userData = {
      _id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      facultyId: req.user.facultyId,
      role: req.user.role,
      college: req.user.college,
      institute: req.user.institute,
      department: req.user.department,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user settings',
      error: error.message
    });
  }
});

/**
 * @route POST /api/settings/change-password
 * @desc Change user's password
 * @access Private
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password and confirmation are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    // Verify current password
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password'
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/settings/profile
 * @desc Update user profile information
 * @access Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const updates = {};

    // Validate input
    if (fullName && fullName.trim() !== '') {
      updates.fullName = fullName.trim();
    }
    
    if (email && email.trim() !== '') {
      // Check if email is already in use
      const existingUser = await User.findOne({ 
        email: { $regex: `^${email.trim()}$`, $options: 'i' } 
      });
      
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      updates.email = email.trim().toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    // Generate new token if email was changed
    let newToken = null;
    if (updates.email) {
      newToken = jwt.sign(
        { userId: updatedUser._id, email: updatedUser.email, role: updatedUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
      token: newToken || undefined
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settings/departments
 * @desc Get available departments based on user's college and institute
 * @access Private
 */
router.get('/departments', authenticate, async (req, res) => {
  try {
    const { college, institute } = req.user;
    
    if (college === 'N/A') {
      return res.status(200).json({
        success: true,
        data: ['N/A']
      });
    }

    // Updated logic: SRM RESEARCH for RAMAPURAM and TRICHY
    const collegeData = {
      'SRMIST RAMAPURAM': {
        'Science and Humanities': ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A'],
        'Engineering and Technology': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
        'Management': ['Business Administration', 'Commerce', 'N/A'],
        'Dental': ['General Dentistry', 'Orthodontics', 'N/A'],
        'SRM RESEARCH': ['Ramapuram Research']
      },
      'SRM TRICHY': {
        'Science and Humanities': ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A'],
        'Engineering and Technology': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
        'SRM RESEARCH': ['Trichy Research']
      },
      'EASWARI ENGINEERING COLLEGE': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
      'TRP ENGINEERING COLLEGE': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
      'N/A': ['N/A']
    };

    let departments = [];
    
    if (college === 'EASWARI ENGINEERING COLLEGE' || college === 'TRP ENGINEERING COLLEGE') {
      departments = collegeData[college];
    } else if (collegeData[college] && institute && collegeData[college][institute]) {
      departments = collegeData[college][institute];
    } else {
      departments = ['N/A'];
    }

    res.status(200).json({
      success: true,
      data: departments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

export default router;
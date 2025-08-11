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
      authorId: req.user.authorId || { scopus: null, sci: null, webOfScience: null }, // Include Author IDs
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
 * @desc Update user profile information (excluding email)
 * @access Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName } = req.body;
    const updates = {};

    // Validate input - only allow fullName updates
    if (fullName && fullName.trim() !== '') {
      updates.fullName = fullName.trim();
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

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
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
 * @route PUT /api/settings/author-ids
 * @desc Update user's Author IDs
 * @access Private
 */
router.put('/author-ids', authenticate, async (req, res) => {
  try {
    const { authorId } = req.body;

    // Only faculty members can update Author IDs
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty members can update Author IDs'
      });
    }

    // Validate Author ID formats
    const errors = [];

    if (authorId.scopus && !/^\d{10,11}$/.test(authorId.scopus)) {
      errors.push('Scopus Author ID must be 10-11 digits');
    }

    if (authorId.sci && !/^[A-Z]-\d{4}-\d{4}$/.test(authorId.sci)) {
      errors.push('SCI Author ID must be in format X-XXXX-XXXX');
    }

    if (authorId.webOfScience && !/^[A-Z]-\d{4}-\d{4}$/.test(authorId.webOfScience)) {
      errors.push('Web of Science ResearcherID must be in format X-XXXX-XXXX');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors
      });
    }

    // Update user's Author IDs
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        authorId: {
          scopus: authorId.scopus || null,
          sci: authorId.sci || null,
          webOfScience: authorId.webOfScience || null
        },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json({
      success: true,
      message: 'Author IDs updated successfully',
      data: {
        authorId: updatedUser.authorId
      }
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
      message: 'Failed to update Author IDs',
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

/**
 * @route GET /api/settings/author-id-status
 * @desc Check if user has required Author IDs for paper upload
 * @access Private
 */
router.get('/author-id-status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(200).json({
        success: true,
        canUploadPapers: true,
        message: 'Non-faculty users can upload papers without Author IDs'
      });
    }

    const hasAtLeastOneAuthorId = !!(
      req.user.authorId?.scopus || 
      req.user.authorId?.sci || 
      req.user.authorId?.webOfScience
    );

    res.status(200).json({
      success: true,
      canUploadPapers: hasAtLeastOneAuthorId,
      authorIds: {
        scopus: !!req.user.authorId?.scopus,
        sci: !!req.user.authorId?.sci,
        webOfScience: !!req.user.authorId?.webOfScience
      },
      message: hasAtLeastOneAuthorId 
        ? 'User can upload papers' 
        : 'At least one Author ID is required to upload papers'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check Author ID status',
      error: error.message
    });
  }
});

export default router;
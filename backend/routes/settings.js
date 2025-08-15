import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Centralized helpers (reuse instead of redefining college / institute / department data)
import {
  getDepartments,          // (college, institute) -> string[]
} from '../utils/collegeData.js';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Authentication Middleware                                                  */
/* -------------------------------------------------------------------------- */
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
    const user = await User.findById(decoded.userId)
      .populate('createdBy', 'fullName email role');
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

/* -------------------------------------------------------------------------- */
/* GET /api/settings - Current User Profile                                   */
/* -------------------------------------------------------------------------- */
router.get('/', authenticate, async (req, res) => {
  try {
    const u = req.user;
    const userData = {
      _id: u._id,
      email: u.email,
      fullName: u.fullName,
      facultyId: u.facultyId,
      role: u.role,
      college: u.college,
      institute: u.institute,
      department: u.department,
      authorId: u.authorId || { scopus: null, sci: null, webOfScience: null },
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLogin: u.lastLogin,
      isActive: u.isActive,
      createdBy: u.createdBy ? {
        _id: u.createdBy._id,
        fullName: u.createdBy.fullName,
        email: u.createdBy.email,
        role: u.createdBy.role
      } : null
    };
    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user settings',
      error: error.message
    });
  }
});

/* -------------------------------------------------------------------------- */
/* POST /api/settings/change-password                                         */
/* -------------------------------------------------------------------------- */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

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

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
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

/* -------------------------------------------------------------------------- */
/* PUT /api/settings/profile  (Only fullName update allowed)                  */
/* -------------------------------------------------------------------------- */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName } = req.body;
    const updates = {};
    if (fullName && fullName.trim() !== '') {
      updates.fullName = fullName.trim();
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    updates.updatedAt = new Date();

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

/* -------------------------------------------------------------------------- */
/* PUT /api/settings/author-ids                                               */
/* Allow campus_admin & faculty                                               */
/* -------------------------------------------------------------------------- */
router.put('/author-ids', authenticate, async (req, res) => {
  try {
    const { authorId } = req.body;
    if (!['faculty', 'campus_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only faculty or campus admin can update Author IDs'
      });
    }

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
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

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
      data: { authorId: updatedUser.authorId }
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

/* -------------------------------------------------------------------------- */
/* GET /api/settings/departments                                              */
/* Uses centralized collegeData helpers                                       */
/* -------------------------------------------------------------------------- */
router.get('/departments', authenticate, async (req, res) => {
  try {
    const { college, institute } = req.user;
    // If user has no college
    if (college === 'N/A') {
      return res.status(200).json({ success: true, data: ['N/A'] });
    }
    const departments = getDepartments(college, institute);
    return res.status(200).json({ success: true, data: departments });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

/* -------------------------------------------------------------------------- */
/* GET /api/settings/author-id-status                                         */
/* -------------------------------------------------------------------------- */
router.get('/author-id-status', authenticate, async (req, res) => {
  try {
    if (!['faculty', 'campus_admin'].includes(req.user.role)) {
      return res.status(200).json({
        success: true,
        canUploadPapers: true,
        message: 'User can upload papers without Author IDs'
      });
    }

    const hasAtLeastOne = !!(
      req.user.authorId?.scopus ||
      req.user.authorId?.sci ||
      req.user.authorId?.webOfScience
    );

    return res.status(200).json({
      success: true,
      canUploadPapers: hasAtLeastOne,
      authorIds: {
        scopus: !!req.user.authorId?.scopus,
        sci: !!req.user.authorId?.sci,
        webOfScience: !!req.user.authorId?.webOfScience
      },
      message: hasAtLeastOne
        ? 'User can upload papers'
        : 'At least one Author ID is recommended before uploading research publications'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check Author ID status',
      error: error.message
    });
  }
});

export default router;
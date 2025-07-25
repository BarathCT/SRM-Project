import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import xlsx from 'xlsx';
import User from '../models/User.js';
import { sendUserWelcomeEmail } from '../utils/sendUserWelcomeMail.js';
import bcrypt from 'bcrypt';


const router = express.Router();

// Helper function to normalize college names
const normalizeCollegeName = (college) => {
  if (!college || college === 'N/A') return 'N/A';
  const upperCollege = college.toUpperCase();
  const validColleges = ['SRMIST RAMAPURAM', 'SRM TRICHY', 'EASWARI ENGINEERING COLLEGE', 'TRP ENGINEERING COLLEGE'];
  return validColleges.find(c => c === upperCollege) || 'N/A';
};

// Helper function to validate college-category relationship
const validateCollegeCategory = (college, category) => {
  const collegeData = {
    'SRMIST RAMAPURAM': ['Science and Humanities', 'Engineering and Technology', 'Management', 'Dental'],
    'SRM TRICHY': ['Science and Humanities', 'Engineering and Technology'],
    'EASWARI ENGINEERING COLLEGE': ['N/A'],
    'TRP ENGINEERING COLLEGE': ['N/A'],
    'N/A': ['N/A']
  };
  return collegeData[college]?.includes(category) || false;
};

const collegeRequiresCategory = (college) => {
  return ['SRMIST RAMAPURAM', 'SRM TRICHY'].includes(college);
};

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains userId, role, email, college, category
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

function canCreateRole(creatorRole, targetRole) {
  const rolePermissions = {
    super_admin: ['campus_admin', 'admin', 'faculty'],
    campus_admin: ['admin', 'faculty'],
    admin: ['faculty']
  };
  return rolePermissions[creatorRole]?.includes(targetRole) || false;
}

function canModifyUser(creator, targetUser) {
  if (creator.role === 'super_admin') return true;
  if (creator.userId === targetUser._id.toString()) return false;

  if (creator.role === 'campus_admin') {
    if (creator.college !== targetUser.college) return false;
    if (!collegeRequiresCategory(creator.college)) return true;
    return creator.category === targetUser.category;
  }

  if (creator.role === 'admin') {
    return creator.college === targetUser.college &&
           creator.category === targetUser.category &&
           targetUser.role === 'faculty';
  }
  return false;
}

// Multer config for bulk upload
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed!'));
    }
  },
});

// GET: Get all users
router.get('/users', authenticate, async (req, res) => {
  try {
    const { role, college, category } = req.user;

    let filter = {};
    if (role === 'super_admin') {
      filter = {};
    } else if (role === 'campus_admin') {
      filter.college = college;
      if (collegeRequiresCategory(college)) {
        filter.category = category;
      }
    } else if (role === 'admin') {
      filter.college = college;
      filter.category = category;
      filter.role = 'faculty';
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { facultyId: searchRegex }
      ];
    }

    if (req.query.role && req.query.role !== 'all') {
      filter.role = req.query.role;
    }

    if (role === 'super_admin' && req.query.college && req.query.college !== 'all') {
      filter.college = req.query.college;
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const users = await User.find(filter).select('-password -__v');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Create a new user
router.post('/users', authenticate, async (req, res) => {
  const { email, password, fullName, facultyId, role, college, category } = req.body;
  const creator = req.user;

  try {
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Email, password, full name and role are required' });
    }

    // Check for existing user by email (case-insensitive)
    const existingUser = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!canCreateRole(creator.role, role)) {
      return res.status(403).json({ message: `You are not allowed to create a '${role}'` });
    }

    let finalCollege = normalizeCollegeName(college);
    let finalCategory = category;
    let finalFacultyId = facultyId;

    if (role === 'super_admin') {
      finalCollege = 'N/A';
      finalCategory = 'N/A';
      finalFacultyId = 'N/A';
    } else {
      if (creator.role !== 'super_admin') {
        finalCollege = creator.college;
        finalCategory = collegeRequiresCategory(creator.college) ? creator.category : 'N/A';
      }

      // Only require category for colleges that need it
      if (collegeRequiresCategory(finalCollege)) {
        if (!finalCategory || finalCategory === 'N/A') {
          return res.status(400).json({ message: 'Category is required for this role in this college' });
        }
        if (!validateCollegeCategory(finalCollege, finalCategory)) {
          return res.status(400).json({ message: `Category ${finalCategory} is not valid for college ${finalCollege}` });
        }
      } else {
        // For Eswari/TRP, always set category to N/A for any role
        finalCategory = 'N/A';
      }

      if (role !== 'super_admin') {
        finalFacultyId = facultyId;
      }
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      facultyId: finalFacultyId,
      role,
      college: finalCollege,
      category: finalCategory,
      createdBy: creator.userId
    });

    await newUser.save();

    if (['super_admin', 'campus_admin', 'admin'].includes(creator.role)) {
      try {
        await sendUserWelcomeEmail({
          to: email,
          fullName,
          email,
          password,
          role,
          collegeName: finalCollege,
          category: finalCategory,
          appUrl: process.env.APP_URL || 'https://scholarsync.example.com'
        });
      } catch (mailErr) {
        console.error('Failed to send welcome email:', mailErr);
      }
    }

    const responseUser = newUser.toObject();
    delete responseUser.password;
    delete responseUser.__v;

    res.status(201).json({ message: 'User created successfully', user: responseUser });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

// PUT: Update a user
router.put('/users/:id', authenticate, async (req, res) => {
  const { role: updaterRole, college: updaterCollege, category: updaterCategory, userId: updaterId } = req.user;

  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to update themselves
    const isSelfUpdate = userToUpdate._id.toString() === updaterId;

    // Initialize update data
    const updateData = { ...req.body };

    // Normalize college name if provided
    if (updateData.college) {
      updateData.college = normalizeCollegeName(updateData.college);
    }

    // Determine target role and college (either from update or existing values)
    const targetRole = updateData.role || userToUpdate.role;
    const targetCollege = updateData.college || userToUpdate.college;

    // Handle self-updates (only allow name and email changes)
    if (isSelfUpdate) {
      if (updateData.role || updateData.college || updateData.category || updateData.facultyId) {
        return res.status(403).json({ 
          message: 'You cannot modify your own role, college, category, or faculty ID' 
        });
      }

      // Only allow updating name and email
      const allowedFields = ['fullName', 'email'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });

      // Validate email if being updated
      if (updateData.email && updateData.email !== userToUpdate.email) {
        const existingEmailUser = await User.findOne({ 
          email: { $regex: `^${updateData.email}$`, $options: 'i' } 
        });
        if (existingEmailUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -__v');

      return res.json({ 
        message: 'Profile updated successfully', 
        user: updatedUser 
      });
    }

    // Handle updates to other users (admin functionality)
    if (!canModifyUser(req.user, userToUpdate)) {
      return res.status(403).json({ message: 'You are not authorized to modify this user' });
    }

    // Role change validation
    if (updateData.role) {
      if (!canCreateRole(updaterRole, updateData.role)) {
        return res.status(403).json({ 
          message: `You are not allowed to set role to '${updateData.role}'` 
        });
      }

      // For colleges without categories, set category to N/A
      if (updateData.role !== 'faculty' && !collegeRequiresCategory(targetCollege)) {
        updateData.category = 'N/A';
      }
    }

    // College change validation (only super_admin can change college)
    if (updateData.college) {
      if (updaterRole !== 'super_admin') {
        return res.status(403).json({ 
          message: 'Only super admins can change college' 
        });
      }
      if (targetRole === 'super_admin' && updateData.college !== 'N/A') {
        return res.status(400).json({ 
          message: 'Super admin must have college set to N/A' 
        });
      }
    }

    // Category validation for colleges that require it
    if (collegeRequiresCategory(targetCollege)) {
      if (!updateData.category || updateData.category === 'N/A') {
        return res.status(400).json({ 
          message: 'Category is required for this role in this college' 
        });
      }
      if (!validateCollegeCategory(targetCollege, updateData.category)) {
        return res.status(400).json({ 
          message: `Category ${updateData.category} is not valid for college ${targetCollege}` 
        });
      }
    } else {
      // For colleges without categories, force category to N/A
      updateData.category = 'N/A';
    }

    // Faculty ID validation
    if (updateData.facultyId) {
      if (targetRole === 'super_admin') {
        updateData.facultyId = 'N/A';
      } else if (updateData.facultyId === 'N/A') {
        return res.status(400).json({ 
          message: 'Faculty ID is required for non-super admin roles' 
        });
      }
    }

    // Password update handling
    if (updateData.password) {
      const bcrypt = await import('bcrypt');
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Email update validation
    if (updateData.email && updateData.email !== userToUpdate.email) {
      const existingEmailUser = await User.findOne({ 
        email: { $regex: `^${updateData.email}$`, $options: 'i' } 
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or faculty ID already exists' });
    }
    console.error('Error updating user:', err);
    res.status(500).json({ 
      message: 'Error updating user', 
      error: err.message 
    });
  }
});

// DELETE: Delete a user
router.delete('/users/:id', authenticate, async (req, res) => {
  const { role: deleterRole, college: deleterCollege, category: deleterCategory, userId: deleterId } = req.user;

  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (userToDelete._id.toString() === deleterId) {
      return res.status(403).json({ message: 'You cannot delete yourself' });
    }
    if (!canModifyUser(req.user, userToDelete)) {
      return res.status(403).json({ message: 'You are not authorized to delete this user' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

// BULK UPLOAD: Create users from Excel/CSV file
router.post('/bulk-upload-users', authenticate, upload.single('file'), async (req, res) => {
  const creator = req.user;
  const defaultRole = req.body.role || null;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let success = 0;
    let failed = 0;
    let errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Get columns (case insensitive)
        const email = row.email || row.Email || row.EMAIL;
        const fullName = row.fullName || row['Full Name'] || row.FULLNAME || row.name;
        let password = row.password || row.Password || row.PASSWORD;
        let role = creator.role === 'admin' ? 'faculty' : (row.role || row.Role || row.ROLE || defaultRole);
        let college = normalizeCollegeName(row.college || row.College || row.COLLEGE);
        let category = row.category || row.Category || row.CATEGORY;
        let facultyId = row.facultyId || row.FacultyId || row.FACULTYID;

        if (!email || !fullName) {
          failed++;
          errors.push(`Row ${i + 2}: Missing email or fullName`);
          continue;
        }

        // For admin, skip role validation since we force it to 'faculty'
        if (creator.role !== 'admin' && !role) {
          failed++;
          errors.push(`Row ${i + 2}: Role is missing`);
          continue;
        }

        if (!canCreateRole(creator.role, role)) {
          failed++;
          errors.push(`Row ${i + 2}: You are not allowed to create a '${role}'`);
          continue;
        }

        // Check for existing user by email (case-insensitive)
        const existingUser = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
        if (existingUser) {
          failed++;
          errors.push(`Row ${i + 2}: User already exists`);
          continue;
        }

        let finalCollege = college;
        let finalCategory = category;
        let finalFacultyId = facultyId;

        if (role === 'super_admin') {
          finalCollege = 'N/A';
          finalCategory = 'N/A';
          finalFacultyId = 'N/A';
        } else {
          // For campus_admin and admin, always use their own college and category
          if (['campus_admin', 'admin'].includes(creator.role)) {
            finalCollege = creator.college;
            finalCategory = collegeRequiresCategory(creator.college) ? creator.category : 'N/A';
          } else if (creator.role === 'super_admin') {
            // super_admin can assign college/category from file
            finalCollege = college;
            finalCategory = category;
            if (!collegeRequiresCategory(finalCollege)) {
              finalCategory = 'N/A';
            }
          }

          if (role !== 'super_admin') {
            finalFacultyId = facultyId;
          }

          // Only require category for colleges that need it
          if (collegeRequiresCategory(finalCollege)) {
            if (!finalCategory || finalCategory === 'N/A') {
              failed++;
              errors.push(`Row ${i + 2}: Category is required for college ${finalCollege}`);
              continue;
            }
            if (!validateCollegeCategory(finalCollege, finalCategory)) {
              failed++;
              errors.push(`Row ${i + 2}: Category ${finalCategory} is not valid for college ${finalCollege}`);
              continue;
            }
          } else {
            // For Eswari/TRP, always set category to N/A for any role
            finalCategory = 'N/A';
          }
        }

        if (!password) {
          // Auto-generate password if missing
          password = Math.random().toString(36).slice(-8);
        }
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
          email,
          password: hashedPassword,
          fullName,
          facultyId: finalFacultyId,
          role,
          college: finalCollege,
          category: finalCategory,
          createdBy: creator.userId
        });

        await newUser.save();

        if (['super_admin', 'campus_admin', 'admin'].includes(creator.role)) {
          try {
            await sendUserWelcomeEmail({
              to: email,
              fullName,
              email,
              password,
              role,
              collegeName: finalCollege,
              category: finalCategory,
              appUrl: process.env.APP_URL || 'https://scholarsync.example.com'
            });
          } catch (mailErr) {
            errors.push(`Row ${i + 2}: Failed to send welcome email`);
          }
        }

        success++;
      } catch (rowErr) {
        failed++;
        errors.push(`Row ${i + 2}: ${rowErr.message}`);
      }
    }

    res.json({
      success: true,
      summary: {
        total: rows.length,
        success,
        failed,
        errors,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bulk upload failed.' });
  }
});




//---------------------------------------
//---------------------------------------
//Settings page 
//---------------------------------------
//---------------------------------------

// Add to admin.js routes
router.get('/settings', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Add to admin.js routes
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Use req.user.userId instead of req.user.id
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Use bcrypt directly since it's now imported
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


export default router;
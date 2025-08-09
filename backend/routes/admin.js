import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import xlsx from 'xlsx';
import ExcelJS from 'exceljs';
import User from '../models/User.js';
import { sendUserWelcomeEmail } from '../utils/sendUserWelcomeMail.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Helper functions
const normalizeCollegeName = (college) => {
  if (!college || college === 'N/A') return 'N/A';
  const upperCollege = college.toUpperCase();
  const validColleges = ['SRMIST RAMAPURAM', 'SRM TRICHY', 'EASWARI ENGINEERING COLLEGE', 'TRP ENGINEERING COLLEGE'];
  return validColleges.find(c => c === upperCollege) || 'N/A';
};

const getCollegeData = (college) => {
  const collegeOptions = [
    { 
      name: 'SRMIST RAMAPURAM',
      hasInstitutes: true,
      institutes: [
        { 
          name: 'Science and Humanities',
          departments: ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A']
        },
        { 
          name: 'Engineering and Technology',
          departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
        },
        { 
          name: 'Management',
          departments: ['Business Administration', 'Commerce', 'N/A']
        },
        { 
          name: 'Dental',
          departments: ['General Dentistry', 'Orthodontics', 'N/A']
        },
        { 
          name: 'SRM RESEARCH',
          departments: ['Ramapuram Research']
        }
      ]
    },
    { 
      name: 'SRM TRICHY',
      hasInstitutes: true,
      institutes: [
        { 
          name: 'Science and Humanities',
          departments: ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A']
        },
        { 
          name: 'Engineering and Technology',
          departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
        },
        { 
          name: 'SRM RESEARCH',
          departments: ['Trichy Research']
        }
      ]
    },
    { 
      name: 'EASWARI ENGINEERING COLLEGE',
      hasInstitutes: false,
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
    },
    { 
      name: 'TRP ENGINEERING COLLEGE',
      hasInstitutes: false,
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
    },
    { 
      name: 'N/A',
      hasInstitutes: false,
      departments: ['N/A']
    }
  ];
  return collegeOptions.find(c => c.name === college) || collegeOptions.find(c => c.name === 'N/A');
};

const validateInstituteDepartment = (college, institute, department) => {
  const collegeData = getCollegeData(college);
  
  if (!collegeData.hasInstitutes) {
    // For colleges without institutes, validate department directly
    return collegeData.departments.includes(department);
  }
  
  // For colleges with institutes, find the institute and validate department
  const instituteData = collegeData.institutes.find(i => i.name === institute);
  if (!instituteData) return false;
  
  return instituteData.departments.includes(department);
};

const collegeRequiresInstitute = (college) => {
  return ['SRMIST RAMAPURAM', 'SRM TRICHY'].includes(college);
};

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains userId, role, email, college, institute, department
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Authorization helpers
function canCreateRole(creatorRole, targetRole) {
  // Only allow: super_admin > campus_admin/faculty, campus_admin > faculty
  const rolePermissions = {
    super_admin: ['campus_admin', 'faculty'],
    campus_admin: ['faculty']
  };
  return rolePermissions[creatorRole]?.includes(targetRole) || false;
}

function canModifyUser(creator, targetUser) {
  if (creator.role === 'super_admin') return true;
  if (creator.userId === targetUser._id.toString()) return false;

  if (creator.role === 'campus_admin') {
    if (creator.college !== targetUser.college) return false;
    if (!collegeRequiresInstitute(creator.college)) return true;
    return creator.institute === targetUser.institute;
  }
  // Only super_admin and campus_admin can modify, not faculty
  return false;
}

// Multer config for bulk upload
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed!'));
    }
  },
});

// NEW ROUTE: Generate and download Excel template (Updated with N/A in institute dropdown)
router.get('/download-template', authenticate, async (req, res) => {
  const { role, college, institute } = req.user;
  const { templateType } = req.query;

  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User_Template');

    // Define college data for dropdowns
    const collegeOptions = [
      'SRMIST RAMAPURAM',
      'SRM TRICHY', 
      'EASWARI ENGINEERING COLLEGE',
      'TRP ENGINEERING COLLEGE'
    ];

    // Updated institute options to include N/A
    const instituteOptions = [
      'Science and Humanities',
      'Engineering and Technology',
      'Management',
      'Dental',
      'SRM RESEARCH',
      'N/A'  // Added N/A for colleges without institutes
    ];

    const departmentOptions = [
      'Mathematics', 'Physics', 'Chemistry', 'English',
      'Computer Science', 'Information Technology', 'Electronics', 
      'Mechanical', 'Civil', 'Business Administration', 'Commerce',
      'General Dentistry', 'Orthodontics', 'Ramapuram Research', 'Trichy Research'
    ];

    let columns = [];

    // Define columns based on user role and template type
    if (role === 'super_admin') {
      if (templateType === 'campus_admin') {
        columns = [
          { header: 'fullName', key: 'fullName', width: 20 },
          { header: 'facultyId', key: 'facultyId', width: 15 },
          { header: 'email', key: 'email', width: 30 },
          { header: 'college', key: 'college', width: 25 },
          { header: 'institute', key: 'institute', width: 25 }
        ];
      } else { // faculty template
        columns = [
          { header: 'fullName', key: 'fullName', width: 20 },
          { header: 'facultyId', key: 'facultyId', width: 15 },
          { header: 'email', key: 'email', width: 30 },
          { header: 'college', key: 'college', width: 25 },
          { header: 'institute', key: 'institute', width: 25 },
          { header: 'department', key: 'department', width: 20 }
        ];
      }
    } else if (role === 'campus_admin') {
      columns = [
        { header: 'fullName', key: 'fullName', width: 20 },
        { header: 'facultyId', key: 'facultyId', width: 15 },
        { header: 'email', key: 'email', width: 30 },
        { header: 'department', key: 'department', width: 20 }
      ];
    }

    // Set up columns (headers only, no sample data)
    worksheet.columns = columns;

    // Add header row styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add borders to header row
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data validation (dropdowns) starting from row 2 (no sample data)
    const maxRows = 1000;

    // College dropdown
    const collegeColIndex = columns.findIndex(col => col.key === 'college');
    if (collegeColIndex !== -1) {
      for (let rowNumber = 2; rowNumber <= maxRows; rowNumber++) {
        const cell = worksheet.getCell(rowNumber, collegeColIndex + 1);
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"' + collegeOptions.join(',') + '"'],
          showErrorMessage: true,
          errorTitle: 'Invalid College',
          error: 'Please select a college from the dropdown list.',
          showDropDown: true
        };
      }
    }

    // Institute dropdown (now includes N/A)
    const instituteColIndex = columns.findIndex(col => col.key === 'institute');
    if (instituteColIndex !== -1) {
      for (let rowNumber = 2; rowNumber <= maxRows; rowNumber++) {
        const cell = worksheet.getCell(rowNumber, instituteColIndex + 1);
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"' + instituteOptions.join(',') + '"'],
          showErrorMessage: true,
          errorTitle: 'Invalid Institute',
          error: 'Please select an institute from the dropdown list. Use "N/A" for colleges without institutes.',
          showDropDown: true
        };
      }
    }

    // Department dropdown
    const departmentColIndex = columns.findIndex(col => col.key === 'department');
    if (departmentColIndex !== -1) {
      for (let rowNumber = 2; rowNumber <= maxRows; rowNumber++) {
        const cell = worksheet.getCell(rowNumber, departmentColIndex + 1);
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"' + departmentOptions.join(',') + '"'],
          showErrorMessage: true,
          errorTitle: 'Invalid Department', 
          error: 'Please select a department from the dropdown list.',
          showDropDown: true
        };
      }
    }

    // Generate filename
    let filename = 'user-upload-template.xlsx';
    if (role === 'super_admin') {
      filename = `${templateType || 'faculty'}-bulk-upload-template.xlsx`;
    } else if (role === 'campus_admin') {
      filename = `campus-admin-${college.toLowerCase().replace(/\s+/g, '-')}-template.xlsx`;
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// GET: Get all users
router.get('/users', authenticate, async (req, res) => {
  try {
    let { role, college, institute, department, userId } = req.user;

    let filter = {};
    if (role === 'super_admin') {
      filter = {};
    } else if (role === 'campus_admin') {
      filter.college = college;
      if (collegeRequiresInstitute(college)) {
        filter.institute = institute;
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Apply search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { facultyId: searchRegex },
        { email: searchRegex }
      ];
    }

    if (req.query.role && req.query.role !== 'all') {
      filter.role = req.query.role;
    }

    if (role === 'super_admin' && req.query.college && req.query.college !== 'all') {
      filter.college = req.query.college;
    }
    if (req.query.institute && req.query.institute !== 'all') {
      filter.institute = req.query.institute;
    }
    if (req.query.department && req.query.department !== 'all') {
      filter.department = req.query.department;
    }

    const users = await User.find(filter).select('-password -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Create a new user
// POST: Create a new user (Updated to handle SRM RESEARCH properly)
router.post('/users', authenticate, async (req, res) => {
  const { email, password, fullName, facultyId, role, college, institute, department } = req.body;
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

    let finalCollege = college;
    let finalInstitute = institute;
    let finalDepartment = department;
    let finalFacultyId = facultyId;

    if (role === 'super_admin') {
      finalCollege = 'N/A';
      finalInstitute = 'N/A';
      finalDepartment = 'N/A';
      finalFacultyId = 'N/A';
    } else {
      if (creator.role === 'super_admin') {
        finalCollege = normalizeCollegeName(college);
        if (!finalCollege || finalCollege === 'N/A') {
          return res.status(400).json({ message: 'College is required for non-super admin roles' });
        }

        // Handle institute validation
        if (collegeRequiresInstitute(finalCollege)) {
          if (!institute || institute === 'N/A') {
            return res.status(400).json({ message: 'Institute is required for this college' });
          }
          finalInstitute = institute;
        } else {
          finalInstitute = 'N/A';
        }

        // Handle department based on role and institute
        if (role === 'campus_admin') {
          // Campus admin department handling
          if (finalInstitute === 'SRM RESEARCH') {
            // For SRM RESEARCH institute, set specific department based on college
            if (finalCollege === 'SRMIST RAMAPURAM') {
              finalDepartment = 'Ramapuram Research';
            } else if (finalCollege === 'SRM TRICHY') {
              finalDepartment = 'Trichy Research';
            } else {
              return res.status(400).json({ 
                message: 'SRM RESEARCH institute is only available for SRMIST RAMAPURAM and SRM TRICHY colleges' 
              });
            }
          } else {
            // For other institutes, campus admin doesn't need department
            finalDepartment = 'N/A';
          }
        } else if (role === 'faculty') {
          // Faculty department handling
          if (!department || department === 'N/A') {
            return res.status(400).json({ message: `Department is required for ${role} role` });
          }
          
          // Validate department for SRM RESEARCH
          if (finalInstitute === 'SRM RESEARCH') {
            const expectedDepartment = finalCollege === 'SRMIST RAMAPURAM' ? 'Ramapuram Research' : 'Trichy Research';
            if (department !== expectedDepartment) {
              return res.status(400).json({ 
                message: `For SRM RESEARCH in ${finalCollege}, department must be '${expectedDepartment}'` 
              });
            }
          }
          
          finalDepartment = department;
        }
      } else if (creator.role === 'campus_admin') {
        finalCollege = creator.college;
        finalInstitute = creator.institute;
        
        if (role === 'campus_admin') {
          // Campus admin creating another campus admin (usually not allowed, but handle gracefully)
          if (creator.institute === 'SRM RESEARCH') {
            finalDepartment = creator.department; // Should be the research department
          } else {
            finalDepartment = 'N/A';
          }
        } else if (role === 'faculty') {
          if (!department || department === 'N/A') {
            return res.status(400).json({ message: 'Department is required when creating faculty' });
          }
          
          // For campus admin in SRM RESEARCH creating faculty
          if (creator.institute === 'SRM RESEARCH') {
            const expectedDepartment = creator.department; // Should match creator's department
            if (department !== expectedDepartment) {
              return res.status(400).json({ 
                message: `Department must be '${expectedDepartment}' for SRM RESEARCH institute` 
              });
            }
          }
          
          finalDepartment = department;
        }
      }

      // Faculty ID validation
      if (!facultyId || facultyId === 'N/A') {
        return res.status(400).json({ message: 'Faculty ID is required for non-super admin roles' });
      }
      finalFacultyId = facultyId;

      // Enhanced validation for college/institute/department relationships
      const collegeData = getCollegeData(finalCollege);
      
      if (collegeData.hasInstitutes) {
        // For colleges with institutes
        const validInstitute = collegeData.institutes.some(i => i.name === finalInstitute);
        if (!validInstitute) {
          return res.status(400).json({ 
            message: `Institute '${finalInstitute}' is not valid for college '${finalCollege}'` 
          });
        }

        // Department validation for faculty or campus admin in SRM RESEARCH
        if (role === 'faculty' || (role === 'campus_admin' && finalInstitute === 'SRM RESEARCH')) {
          if (finalDepartment === 'N/A') {
            return res.status(400).json({ 
              message: 'Department is required for this role and institute' 
            });
          }
          
          const instituteData = collegeData.institutes.find(i => i.name === finalInstitute);
          if (!instituteData.departments.includes(finalDepartment)) {
            return res.status(400).json({ 
              message: `Department '${finalDepartment}' is not valid for institute '${finalInstitute}' in college '${finalCollege}'` 
            });
          }
        }
      } else {
        // For colleges without institutes
        finalInstitute = 'N/A';
        
        if (role === 'faculty') {
          if (finalDepartment === 'N/A') {
            return res.status(400).json({ message: 'Department is required for faculty in this college' });
          }
          
          if (!collegeData.departments.includes(finalDepartment)) {
            return res.status(400).json({ 
              message: `Department '${finalDepartment}' is not valid for college '${finalCollege}'` 
            });
          }
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      facultyId: finalFacultyId,
      role,
      college: finalCollege,
      institute: finalInstitute,
      department: finalDepartment,
      createdBy: creator.userId
    });

    await newUser.save();

    // Send welcome email
    if (['super_admin', 'campus_admin'].includes(creator.role)) {
      try {
        await sendUserWelcomeEmail({
          to: email,
          fullName,
          email,
          password,
          role,
          collegeName: finalCollege,
          institute: finalInstitute,
          department: finalDepartment,
          appUrl: process.env.APP_URL || 'https://scholarsync.example.com'
        });
      } catch (mailErr) {
        console.error('Email sending failed:', mailErr);
        // Don't fail user creation if email fails
      }
    }

    const responseUser = newUser.toObject();
    delete responseUser.password;
    delete responseUser.__v;

    res.status(201).json({ message: 'User created successfully', user: responseUser });

  } catch (err) {
    console.error('User creation error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : 'Faculty ID'} already exists` 
      });
    }
    
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

// PUT: Update a user
router.put('/users/:id', authenticate, async (req, res) => {
  const { role: updaterRole, college: updaterCollege, institute: updaterInstitute, department: updaterDepartment, userId: updaterId } = req.user;

  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelfUpdate = userToUpdate._id.toString() === updaterId;

    const updateData = { ...req.body };
    if (updateData.college) {
      updateData.college = normalizeCollegeName(updateData.college);
    }
    const targetRole = updateData.role || userToUpdate.role;
    const targetCollege = updateData.college || userToUpdate.college;

    if (isSelfUpdate) {
      if (updateData.role || updateData.college || updateData.institute || updateData.department || updateData.facultyId) {
        return res.status(403).json({ 
          message: 'You cannot modify your own role, college, institute, department, or faculty ID' 
        });
      }
      const allowedFields = ['fullName', 'email'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
      if (updateData.email && updateData.email !== userToUpdate.email) {
        const existingEmailUser = await User.findOne({ 
          email: { $regex: `^${updateData.email}$`, $options: 'i' } 
        });
        if (existingEmailUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
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

    if (!canModifyUser(req.user, userToUpdate)) {
      return res.status(403).json({ message: 'You are not authorized to modify this user' });
    }

    if (updateData.role) {
      if (!canCreateRole(updaterRole, updateData.role)) {
        return res.status(403).json({ 
          message: `You are not allowed to set role to '${updateData.role}'` 
        });
      }
      if (updateData.role === 'super_admin') {
        updateData.college = 'N/A';
        updateData.institute = 'N/A';
        updateData.department = 'N/A';
        updateData.facultyId = 'N/A';
      } else if (updateData.role === 'campus_admin') {
        updateData.department = 'N/A';
      }
    }

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

    if (targetRole !== 'super_admin' && targetCollege !== 'N/A') {
      const collegeData = getCollegeData(targetCollege);
      if (collegeData.hasInstitutes) {
        if (targetRole !== 'campus_admin' && (!updateData.institute || updateData.institute === 'N/A')) {
          return res.status(400).json({ 
            message: 'Institute is required for this college' 
          });
        }
        if (updateData.institute && updateData.institute !== 'N/A') {
          const validInstitute = collegeData.institutes.some(i => i.name === updateData.institute);
          if (!validInstitute) {
            return res.status(400).json({ 
              message: `Institute '${updateData.institute}' is not valid for college '${targetCollege}'` 
            });
          }
          if (targetRole !== 'campus_admin') {
            if (!updateData.department || updateData.department === 'N/A') {
              return res.status(400).json({ 
                message: 'Department is required for this institute' 
              });
            }
            const instituteData = collegeData.institutes.find(i => i.name === updateData.institute);
            if (!instituteData.departments.includes(updateData.department)) {
              return res.status(400).json({ 
                message: `Department '${updateData.department}' is not valid for institute '${updateData.institute}'` 
              });
            }
          }
        }
      } else {
        updateData.institute = 'N/A';
        if (targetRole !== 'campus_admin') {
          if (!updateData.department || updateData.department === 'N/A') {
            return res.status(400).json({ 
              message: 'Department is required for this college' 
            });
          }
          if (!collegeData.departments.includes(updateData.department)) {
            return res.status(400).json({ 
              message: `Department '${updateData.department}' is not valid for college '${targetCollege}'` 
            });
          }
        }
      }
    }

    if (updateData.facultyId !== undefined) {
      if (targetRole === 'super_admin') {
        updateData.facultyId = 'N/A';
      } else if (!updateData.facultyId || updateData.facultyId === 'N/A') {
        return res.status(400).json({ 
          message: 'Faculty ID is required for non-super admin roles' 
        });
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.email && updateData.email !== userToUpdate.email) {
      const existingEmailUser = await User.findOne({ 
        email: { $regex: `^${updateData.email}$`, $options: 'i' } 
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

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
    res.status(500).json({ 
      message: 'Error updating user', 
      error: err.message 
    });
  }
});

// DELETE: Delete a user
router.delete('/users/:id', authenticate, async (req, res) => {
  const { role: deleterRole, college: deleterCollege, institute: deleterInstitute, department: deleterDepartment, userId: deleterId } = req.user;

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
        const email = row.email || row.Email || row.EMAIL;
        const fullName = row.fullName || row['Full Name'] || row.FULLNAME || row.name;
        let password = row.password || row.Password || row.PASSWORD;
        let role = row.role || row.Role || row.ROLE || defaultRole;
        let college = normalizeCollegeName(row.college || row.College || row.COLLEGE);
        let institute = row.institute || row.Institute || row.INSTITUTE;
        let department = row.department || row.Department || row.DEPARTMENT;
        let facultyId = row.facultyId || row.FacultyId || row.FACULTYID;

        if (creator.role === 'campus_admin') {
          // Campus admin can only create faculty
          role = 'faculty';
        }

        if (!email || !fullName) {
          failed++;
          errors.push(`Row ${i + 2}: Missing email or fullName`);
          continue;
        }

        if (!role) {
          failed++;
          errors.push(`Row ${i + 2}: Role is missing`);
          continue;
        }

        if (!canCreateRole(creator.role, role)) {
          failed++;
          errors.push(`Row ${i + 2}: You are not allowed to create a '${role}'`);
          continue;
        }

        const existingUser = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
        if (existingUser) {
          failed++;
          errors.push(`Row ${i + 2}: User already exists`);
          continue;
        }

        let finalCollege = college;
        let finalInstitute = institute;
        let finalDepartment = department;
        let finalFacultyId = facultyId;

        if (role === 'super_admin') {
          finalCollege = 'N/A';
          finalInstitute = 'N/A';
          finalDepartment = 'N/A';
          finalFacultyId = 'N/A';
        } else {
          if (creator.role === 'super_admin') {
            finalCollege = college;
            finalInstitute = institute;
            finalDepartment = department;
          } else if (creator.role === 'campus_admin') {
            finalCollege = creator.college;
            finalInstitute = creator.institute;
            finalDepartment = department;
          }

          if (role !== 'super_admin' && !finalFacultyId) {
            failed++;
            errors.push(`Row ${i + 2}: Faculty ID is required`);
            continue;
          }

          if (finalCollege !== 'N/A') {
            const collegeData = getCollegeData(finalCollege);
            if (collegeData.hasInstitutes) {
              if (role !== 'campus_admin' && (!finalInstitute || finalInstitute === 'N/A')) {
                failed++;
                errors.push(`Row ${i + 2}: Institute is required for college ${finalCollege}`);
                continue;
              }
              if (finalInstitute !== 'N/A') {
                const validInstitute = collegeData.institutes.some(i => i.name === finalInstitute);
                if (!validInstitute) {
                  failed++;
                  errors.push(`Row ${i + 2}: Institute '${finalInstitute}' is not valid for college '${finalCollege}'`);
                  continue;
                }
                if (role !== 'campus_admin') {
                  if (!finalDepartment || finalDepartment === 'N/A') {
                    failed++;
                    errors.push(`Row ${i + 2}: Department is required for institute '${finalInstitute}'`);
                    continue;
                  }
                  const instituteData = collegeData.institutes.find(i => i.name === finalInstitute);
                  if (!instituteData.departments.includes(finalDepartment)) {
                    failed++;
                    errors.push(`Row ${i + 2}: Department '${finalDepartment}' is not valid for institute '${finalInstitute}'`);
                    continue;
                  }
                }
              }
            } else {
              finalInstitute = 'N/A';
              if (role !== 'campus_admin') {
                if (!finalDepartment || finalDepartment === 'N/A') {
                  failed++;
                  errors.push(`Row ${i + 2}: Department is required for college '${finalCollege}'`);
                  continue;
                }
                if (!collegeData.departments.includes(finalDepartment)) {
                  failed++;
                  errors.push(`Row ${i + 2}: Department '${finalDepartment}' is not valid for college '${finalCollege}'`);
                  continue;
                }
              }
            }
          }
        }

        if (!password) {
          password = Math.random().toString(36).slice(-8);
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
          email,
          password: hashedPassword,
          fullName,
          facultyId: finalFacultyId,
          role,
          college: finalCollege,
          institute: finalInstitute,
          department: finalDepartment,
          createdBy: creator.userId
        });

        await newUser.save();

        if (['super_admin', 'campus_admin'].includes(creator.role)) {
          try {
            await sendUserWelcomeEmail({
              to: email,
              fullName,
              email,
              password,
              role,
              collegeName: finalCollege,
              institute: finalInstitute,
              department: finalDepartment,
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

export default router;
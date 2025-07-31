import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import xlsx from 'xlsx';
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
    if (!collegeRequiresInstitute(creator.college)) return true;
    return creator.institute === targetUser.institute;
  }

  if (creator.role === 'admin') {
    // FIXED: Admin can only modify users in their exact department, institute, and college
    return creator.college === targetUser.college &&
           creator.institute === targetUser.institute &&
           creator.department === targetUser.department &&
           (targetUser.role === 'faculty' || targetUser.role === 'admin');
  }
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

// GET: Get all users
// FIXED GET users endpoint
router.get('/users', authenticate, async (req, res) => {
  try {
    let { role, college, institute, department, userId } = req.user;

    console.log('=== ENHANCED GET USERS DEBUG ===');
    console.log('1. Original JWT data:', { role, college, institute, department, userId });

    // HOTFIX: If department is undefined for admin, fetch from database
    if (role === 'admin' && (!department || department === undefined || department === null)) {
      console.log('2. Admin department is missing, fetching from database...');
      const adminUser = await User.findById(req.user.userId).select('department college institute role fullName');
      console.log('3. Admin user from DB:', adminUser);
      
      if (adminUser && adminUser.department && adminUser.department !== 'N/A') {
        department = adminUser.department;
        college = adminUser.college || college;
        institute = adminUser.institute || institute;
        console.log('4. Updated admin data:', { college, institute, department });
      } else {
        console.log('4. ERROR: Admin department not found in database!');
        return res.status(400).json({ 
          message: 'Admin user missing department information. Please contact system administrator.'
        });
      }
    }

    console.log('5. Final user data for filtering:', { role, college, institute, department });

    let filter = {};
    if (role === 'super_admin') {
      filter = {};
    } else if (role === 'campus_admin') {
      filter.college = college;
      if (collegeRequiresInstitute(college)) {
        filter.institute = institute;
      }
    } else if (role === 'admin') {
      // FIXED: Base filter for admin users
      filter = {
        college: college,
        institute: institute,
        department: department,
        role: { $in: ['faculty', 'admin'] }
      };
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('6. Base filter before query params:', JSON.stringify(filter, null, 2));

    // Apply search filter - IMPORTANT: This might override the role filter!
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { facultyId: searchRegex },
        { email: searchRegex }
      ];
      console.log('7. Applied search filter:', req.query.search);
    }

    // Apply role filter - IMPORTANT: This might override the base role restriction!
    if (req.query.role && req.query.role !== 'all') {
      console.log('8. Query role filter requested:', req.query.role);
      if (role === 'admin') {
        // Admin can filter between faculty and admin, but only in their department
        if (['faculty', 'admin'].includes(req.query.role)) {
          filter.role = req.query.role; // This replaces the $in array!
          console.log('9. Applied role filter:', req.query.role);
        }
      } else {
        filter.role = req.query.role;
      }
    }

    // Apply other filters
    if (role === 'super_admin' && req.query.college && req.query.college !== 'all') {
      filter.college = req.query.college;
    }
    if (req.query.institute && req.query.institute !== 'all') {
      filter.institute = req.query.institute;
    }
    if (req.query.department && req.query.department !== 'all') {
      filter.department = req.query.department;
    }

    console.log('10. Final MongoDB filter:', JSON.stringify(filter, null, 2));
    console.log('11. All query parameters:', req.query);

    // Execute the query
    const users = await User.find(filter).select('-password -__v').sort({ createdAt: -1 });
    
    console.log(`12. QUERY RESULT: Found ${users.length} users`);
    users.forEach((user, index) => {
      console.log(`    ${index + 1}. ${user.fullName} | ${user.role} | ${user.department}`);
    });

    // Let's also test the exact filter manually
    const manualFilter = {
      college: college,
      institute: institute,
      department: department,
      role: { $in: ['faculty', 'admin'] }
    };
    
    const manualResults = await User.find(manualFilter).select('fullName role department');
    console.log(`13. MANUAL FILTER TEST: Found ${manualResults.length} users with filter:`, JSON.stringify(manualFilter, null, 2));
    manualResults.forEach((user, index) => {
      console.log(`    ${index + 1}. ${user.fullName} | ${user.role} | ${user.department}`);
    });

    console.log('=====================================');
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Create a new user
router.post('/users', authenticate, async (req, res) => {
  const { email, password, fullName, facultyId, role, college, institute, department } = req.body;
  const creator = req.user;

  console.log('=== CREATE USER DEBUG ===');
  console.log('Creator:', { 
    role: creator.role, 
    college: creator.college, 
    institute: creator.institute, 
    department: creator.department 
  });
  console.log('Request body:', req.body);
  console.log('Target role:', role);
  console.log('Date:', new Date().toISOString());
  console.log('=========================');

  try {
    if (!email || !password || !fullName || !role) {
      console.log('Missing required fields:', { 
        email: !!email, 
        password: !!password, 
        fullName: !!fullName, 
        role: !!role 
      });
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
      // Handle inheritance and validation based on creator role
      if (creator.role === 'super_admin') {
        // Super admin can set any college/institute/department from request
        finalCollege = normalizeCollegeName(college);
        
        if (!finalCollege || finalCollege === 'N/A') {
          return res.status(400).json({ message: 'College is required for non-super admin roles' });
        }

        // Validate institute requirement
        if (collegeRequiresInstitute(finalCollege)) {
          if (!institute || institute === 'N/A') {
            return res.status(400).json({ message: 'Institute is required for this college' });
          }
          finalInstitute = institute;
        } else {
          finalInstitute = 'N/A';
        }

        // Handle department based on role
        if (role === 'campus_admin') {
          finalDepartment = 'N/A';
        } else {
          if (!department || department === 'N/A') {
            return res.status(400).json({ message: `Department is required for ${role} role` });
          }
          finalDepartment = department;
        }

      } else if (creator.role === 'campus_admin') {
        // Campus admin: inherit college and institute, handle department based on target role
        finalCollege = creator.college;
        finalInstitute = creator.institute;
        
        if (role === 'admin') {
          // Admin MUST have a department
          if (!department || department === 'N/A') {
            return res.status(400).json({ message: 'Department is required when creating admin' });
          }
          finalDepartment = department;
        } else if (role === 'campus_admin') {
          // Campus admin doesn't need department
          finalDepartment = 'N/A';
        } else if (role === 'faculty') {
          // Faculty needs department
          if (!department || department === 'N/A') {
            return res.status(400).json({ message: 'Department is required when creating faculty' });
          }
          finalDepartment = department;
        }

      } else if (creator.role === 'admin') {
        // Admin: can only create faculty, inherit everything from admin
        if (role !== 'faculty') {
          return res.status(403).json({ message: 'Admin can only create faculty' });
        }
        finalCollege = creator.college;
        finalInstitute = creator.institute;
        finalDepartment = creator.department;
      }

      // Faculty ID validation
      if (!facultyId || facultyId === 'N/A') {
        return res.status(400).json({ message: 'Faculty ID is required for non-super admin roles' });
      }
      finalFacultyId = facultyId;

      // Validate college/institute/department combination
      const collegeData = getCollegeData(finalCollege);
      
      if (collegeData.hasInstitutes) {
        // For colleges with institutes
        if (finalInstitute === 'N/A' && role !== 'campus_admin') {
          return res.status(400).json({ message: 'Institute is required for this college' });
        }
        
        if (finalInstitute !== 'N/A') {
          const validInstitute = collegeData.institutes.some(i => i.name === finalInstitute);
          if (!validInstitute) {
            return res.status(400).json({ 
              message: `Institute '${finalInstitute}' is not valid for college '${finalCollege}'` 
            });
          }
          
          // Department validation for roles that need it
          if (role !== 'campus_admin') {
            if (finalDepartment === 'N/A') {
              return res.status(400).json({ message: 'Department is required for this institute' });
            }
            
            const instituteData = collegeData.institutes.find(i => i.name === finalInstitute);
            if (!instituteData.departments.includes(finalDepartment)) {
              return res.status(400).json({ 
                message: `Department '${finalDepartment}' is not valid for institute '${finalInstitute}'` 
              });
            }
          }
        }
      } else {
        // For colleges without institutes
        finalInstitute = 'N/A';
        
        // Department validation for roles that need it
        if (role !== 'campus_admin') {
          if (finalDepartment === 'N/A') {
            return res.status(400).json({ message: 'Department is required for this college' });
          }
          
          if (!collegeData.departments.includes(finalDepartment)) {
            return res.status(400).json({ 
              message: `Department '${finalDepartment}' is not valid for college '${finalCollege}'` 
            });
          }
        }
      }
    }

    console.log('Final values:', {
      finalCollege,
      finalInstitute,
      finalDepartment,
      finalFacultyId,
      role
    });

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

    // Send welcome email
    if (['super_admin', 'campus_admin', 'admin'].includes(creator.role)) {
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
        console.error('Failed to send welcome email:', mailErr);
      }
    }

    const responseUser = newUser.toObject();
    delete responseUser.password;
    delete responseUser.__v;

    console.log('User created successfully:', responseUser.email);
    res.status(201).json({ message: 'User created successfully', user: responseUser });

  } catch (err) {
    console.error('Error creating user:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
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
      if (updateData.role || updateData.college || updateData.institute || updateData.department || updateData.facultyId) {
        return res.status(403).json({ 
          message: 'You cannot modify your own role, college, institute, department, or faculty ID' 
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

      // Handle special role cases
      if (updateData.role === 'super_admin') {
        updateData.college = 'N/A';
        updateData.institute = 'N/A';
        updateData.department = 'N/A';
        updateData.facultyId = 'N/A';
      } else if (updateData.role === 'campus_admin') {
        updateData.department = 'N/A';
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

    // Institute and department validation for non-super admin roles
    if (targetRole !== 'super_admin' && targetCollege !== 'N/A') {
      const collegeData = getCollegeData(targetCollege);
      
      if (collegeData.hasInstitutes) {
        // For colleges with institutes
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
        // For colleges without institutes
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

    // Faculty ID validation
    if (updateData.facultyId !== undefined) {
      if (targetRole === 'super_admin') {
        updateData.facultyId = 'N/A';
      } else if (!updateData.facultyId || updateData.facultyId === 'N/A') {
        return res.status(400).json({ 
          message: 'Faculty ID is required for non-super admin roles' 
        });
      }
    }

    // Password update handling
    if (updateData.password) {
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
        // Get columns (case insensitive)
        const email = row.email || row.Email || row.EMAIL;
        const fullName = row.fullName || row['Full Name'] || row.FULLNAME || row.name;
        let password = row.password || row.Password || row.PASSWORD;
        let role = row.role || row.Role || row.ROLE || defaultRole;
        let college = normalizeCollegeName(row.college || row.College || row.COLLEGE);
        let institute = row.institute || row.Institute || row.INSTITUTE;
        let department = row.department || row.Department || row.DEPARTMENT;
        let facultyId = row.facultyId || row.FacultyId || row.FACULTYID;

        // Force role to faculty if creator is admin
        if (creator.role === 'admin') {
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

        // Check for existing user by email (case-insensitive)
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
          // Handle inheritance based on creator role
          if (creator.role === 'super_admin') {
            // Super admin can set from file
            finalCollege = college;
            finalInstitute = institute;
            finalDepartment = department;
          } else if (creator.role === 'campus_admin') {
            // Campus admin: inherit college and institute
            finalCollege = creator.college;
            finalInstitute = creator.institute;
            
            // Department handling
            if (role === 'campus_admin') {
              finalDepartment = 'N/A';
            } else {
              finalDepartment = department;
            }
          } else if (creator.role === 'admin') {
            // Admin: inherit everything for faculty
            finalCollege = creator.college;
            finalInstitute = creator.institute;
            finalDepartment = creator.department;
          }

          if (role !== 'super_admin') {
            if (!finalFacultyId) {
              failed++;
              errors.push(`Row ${i + 2}: Faculty ID is required`);
              continue;
            }
          }

          // Validate the final college/institute/department combination
          if (finalCollege !== 'N/A') {
            const collegeData = getCollegeData(finalCollege);
            
            if (collegeData.hasInstitutes) {
              // For colleges with institutes
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
                
                // Department validation
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
              // For colleges without institutes
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
          // Auto-generate password if missing
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

        if (['super_admin', 'campus_admin', 'admin'].includes(creator.role)) {
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
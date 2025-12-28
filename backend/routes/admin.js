import express from 'express';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import UserLog from '../models/UserLog.js'; // <-- ADD THIS LINE
import { sendUserWelcomeEmail } from '../utils/sendUserWelcomeMail.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

// Centralized college / institute helpers
import {
  normalizeCollegeName,
  getCollegeData,
  collegeRequiresInstitute,
  ALL_COLLEGE_NAMES,
  getAllInstituteNames,
  getAllDepartmentNames
} from '../utils/collegeData.js';

const router = express.Router();

/* ----------------------------- Auth Middleware ----------------------------- */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, email, college, institute, department }
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

/* ---------------------------- Authorization Utils ------------------------- */
function canCreateRole(creatorRole, targetRole) {
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
  return false;
}

/* ------------------ GET /admin/download-template (Excel) ------------------ */
router.get('/download-template', authenticate, async (req, res) => {
  const { role, college } = req.user;
  const { templateType } = req.query;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User_Template');

    // Dynamic lists from centralized helpers
    const collegeOptions = ALL_COLLEGE_NAMES.filter(c => c !== 'N/A');
    const instituteOptions = getAllInstituteNames(true); // include N/A
    const departmentOptions = getAllDepartmentNames();

    let columns = [];
    if (role === 'super_admin') {
      if (templateType === 'campus_admin') {
        columns = [
          { header: 'fullName', key: 'fullName', width: 20 },
          { header: 'facultyId', key: 'facultyId', width: 15 },
          { header: 'email', key: 'email', width: 30 },
          { header: 'college', key: 'college', width: 25 },
          { header: 'institute', key: 'institute', width: 25 }
        ];
      } else {
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
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    worksheet.columns = columns;

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    const maxRows = 1000;
    const addValidation = (key, list, errorTitle) => {
      const colIdx = columns.findIndex(c => c.key === key);
      if (colIdx === -1) return;
      for (let r = 2; r <= maxRows; r++) {
        const cell = worksheet.getCell(r, colIdx + 1);
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"' + list.join(',') + '"'],
          showErrorMessage: true,
          errorTitle,
          error: `Please select a valid ${key} from the dropdown list.`,
          showDropDown: true
        };
      }
    };

    addValidation('college', collegeOptions, 'Invalid College');
    addValidation('institute', instituteOptions, 'Invalid Institute');
    addValidation('department', departmentOptions, 'Invalid Department');

    let filename = 'user-upload-template.xlsx';
    if (role === 'super_admin') {
      filename = `${templateType || 'faculty'}-bulk-upload-template.xlsx`;
    } else if (role === 'campus_admin') {
      filename = `campus-admin-${college.toLowerCase().replace(/\s+/g, '-')}-template.xlsx`;
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

/* ------------------------------ GET /admin/users --------------------------- */
router.get('/users', authenticate, async (req, res) => {
  try {
    const { role, college, institute } = req.user;
    const { page, limit, skip } = getPaginationParams(req.query);

    let filter = {};
    if (role === 'super_admin') {
      // no restriction
    } else if (role === 'campus_admin') {
      filter.college = college;
      if (collegeRequiresInstitute(college)) {
        filter.institute = institute;
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ fullName: regex }, { facultyId: regex }, { email: regex }];
    }
    if (req.query.role && req.query.role !== 'all') filter.role = req.query.role;
    if (role === 'super_admin' && req.query.college && req.query.college !== 'all') {
      filter.college = req.query.college;
    }
    if (req.query.institute && req.query.institute !== 'all') filter.institute = req.query.institute;
    if (req.query.department && req.query.department !== 'all') filter.department = req.query.department;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);


    res.json(buildPaginatedResponse(users, total, { page, limit }));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ----------------------------- GET /admin/stats --------------------------- */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { role, college, institute } = req.user;

    // Base filter based on role
    let matchStage = {};
    if (role === 'campus_admin') {
      matchStage.college = college;
      if (collegeRequiresInstitute(college)) {
        matchStage.institute = institute;
      }
    } else if (role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Apply Query Filters
    if (req.query.role && req.query.role !== 'all') matchStage.role = req.query.role;
    if (role === 'super_admin' && req.query.college && req.query.college !== 'all') {
      matchStage.college = req.query.college;
    }
    if (req.query.institute && req.query.institute !== 'all') matchStage.institute = req.query.institute;
    if (req.query.department && req.query.department !== 'all') matchStage.department = req.query.department;
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      matchStage.$or = [{ fullName: regex }, { facultyId: regex }, { email: regex }];
    }

    const [
      totalUsers,
      activeUsers,
      roleStats,
      collegeStats,
      instituteStats,
      departmentStats,
      rolesByDeptData,
      rolesByCollegeData,
      rolesByInstituteData
    ] = await Promise.all([
      User.countDocuments(matchStage),
      User.countDocuments({ ...matchStage, isActive: true }),
      // Role distribution
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),
      // College distribution
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: "$college", count: { $sum: 1 } } }
      ]),
      // Institute distribution
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: "$institute", count: { $sum: 1 } } }
      ]),
      // Department distribution
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: "$department", count: { $sum: 1 } } }
      ]),
      // Roles by Department
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: { department: "$department", role: "$role" }, count: { $sum: 1 } } }
      ]),
      // Roles by College
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: { college: "$college", role: "$role" }, count: { $sum: 1 } } }
      ]),
      // Roles by Institute
      User.aggregate([
        { $match: matchStage },
        { $group: { _id: { institute: "$institute", role: "$role" }, count: { $sum: 1 } } }
      ])
    ]);

    // Format distributions
    const formatDist = (data) => data.map(item => ({ label: item._id || 'N/A', value: item.count }));
    const formatRoleStats = (data) => {
      const stats = { super_admin: 0, campus_admin: 0, faculty: 0, total: totalUsers };
      data.forEach(item => { if (stats.hasOwnProperty(item._id)) stats[item._id] = item.count; });
      return stats;
    };

    // Format Cross-Tabs
    const formatCrossTab = (data, keyField) => {
      const result = {};
      data.forEach(item => {
        const key = item._id[keyField] || 'N/A';
        const role = item._id.role;
        if (!result[key]) result[key] = { campus_admin: 0, faculty: 0, super_admin: 0 };
        result[key][role] = item.count;
      });
      return result;
    };

    res.json({
      totalUsers,
      activeUsers,
      roleStats: formatRoleStats(roleStats),
      collegeDistribution: formatDist(collegeStats),
      instituteDistribution: formatDist(instituteStats),
      departmentDistribution: formatDist(departmentStats),
      rolesByDepartment: formatCrossTab(rolesByDeptData, 'department'),
      rolesByCollege: formatCrossTab(rolesByCollegeData, 'college'),
      rolesByInstitute: formatCrossTab(rolesByInstituteData, 'institute')
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ----------------------------- POST /admin/users -------------------------- */
router.post('/users', authenticate, async (req, res) => {
  let { email, password, fullName, facultyId, role, college, institute, department } = req.body;
  const creator = req.user;

  try {
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Email, password, full name and role are required' });
    }

    const existingUser = await User.findOne({
      email: { $regex: `^${email}$`, $options: 'i' }
    });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    if (!canCreateRole(creator.role, role)) {
      return res.status(403).json({ message: `You are not allowed to create a '${role}'` });
    }

    // --- ENSURE department/institute are always set for SRM RESEARCH campus_admins ---
    if (
      creator.role === 'campus_admin' &&
      creator.institute === 'SRM RESEARCH' &&
      (creator.college === 'SRMIST RAMAPURAM' || creator.college === 'SRM TRICHY')
    ) {
      institute = 'SRM RESEARCH';
      department = creator.college === 'SRMIST RAMAPURAM'
        ? 'Ramapuram Research'
        : 'Trichy Research';
      college = creator.college;
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

        if (collegeRequiresInstitute(finalCollege)) {
          if (!institute || institute === 'N/A') {
            return res.status(400).json({ message: 'Institute is required for this college' });
          }
          finalInstitute = institute;
        } else {
          finalInstitute = 'N/A';
        }

        if (role === 'campus_admin') {
          if (finalInstitute === 'SRM RESEARCH') {
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
            finalDepartment = 'N/A';
          }
        } else if (role === 'faculty') {
          if (!department || department === 'N/A') {
            return res.status(400).json({ message: `Department is required for ${role} role` });
          }
          if (finalInstitute === 'SRM RESEARCH') {
            const expectedDepartment =
              finalCollege === 'SRMIST RAMAPURAM'
                ? 'Ramapuram Research'
                : 'Trichy Research';
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
          finalDepartment =
            creator.institute === 'SRM RESEARCH'
              ? creator.department
              : 'N/A';
        } else if (role === 'faculty') {
          if (!department || department === 'N/A') {
            return res.status(400).json({
              message: 'Department is required when creating faculty'
            });
          }
          if (creator.institute === 'SRM RESEARCH') {
            const expectedDepartment = creator.college === 'SRMIST RAMAPURAM'
              ? 'Ramapuram Research'
              : creator.college === 'SRM TRICHY'
                ? 'Trichy Research'
                : creator.department;
            if (department !== expectedDepartment) {
              return res.status(400).json({
                message: `Department must be '${expectedDepartment}' for SRM RESEARCH institute`
              });
            }
          }
          finalDepartment = department;
        }
      }

      if (!facultyId || facultyId === 'N/A') {
        return res.status(400).json({
          message: 'Faculty ID is required for non-super admin roles'
        });
      }
      finalFacultyId = facultyId;

      const collegeData = getCollegeData(finalCollege);

      if (collegeData.hasInstitutes) {
        const validInstitute = collegeData.institutes.some(i => i.name === finalInstitute);
        if (!validInstitute) {
          return res.status(400).json({
            message: `Institute '${finalInstitute}' is not valid for college '${finalCollege}'`
          });
        }

        if (role === 'faculty' || (role === 'campus_admin' && finalInstitute === 'SRM RESEARCH')) {
          if (finalDepartment === 'N/A') {
            return res.status(400).json({
              message: 'Department is required for this role and institute'
            });
          }
          const instData = collegeData.institutes.find(i => i.name === finalInstitute);
          if (!instData.departments.includes(finalDepartment)) {
            return res.status(400).json({
              message: `Department '${finalDepartment}' is not valid for institute '${finalInstitute}' in college '${finalCollege}'`
            });
          }
        }
      } else {
        finalInstitute = 'N/A';
        if (role === 'faculty') {
          if (finalDepartment === 'N/A') {
            return res.status(400).json({
              message: 'Department is required for faculty in this college'
            });
          }
          if (!collegeData.departments.includes(finalDepartment)) {
            return res.status(400).json({
              message: `Department '${finalDepartment}' is not valid for college '${finalCollege}'`
            });
          }
        }
      }
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

    // LOG CREATE ACTION
    await UserLog.create({
      actor: {
        userId: creator.userId,
        name: creator.fullName,
        email: creator.email,
        role: creator.role,
      },
      action: 'create',
      targetUser: {
        userId: newUser._id,
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
      before: null,
      after: {
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        facultyId: newUser.facultyId,
        college: newUser.college,
        institute: newUser.institute,
        department: newUser.department
      },
      timestamp: new Date()
    });

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
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field === 'email' ? 'Email' : 'Faculty ID'} already exists` });
    }
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

/* --------------------------- PUT /admin/users/:id -------------------------- */
router.put('/users/:id', authenticate, async (req, res) => {
  const { role: updaterRole, userId: updaterId, fullName, email, role } = req.user;

  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    const isSelfUpdate = userToUpdate._id.toString() === updaterId;
    const updateData = { ...req.body };

    if (updateData.college) {
      updateData.college = normalizeCollegeName(updateData.college);
    }

    const targetRole = updateData.role || userToUpdate.role;
    const targetCollege = updateData.college || userToUpdate.college;

    if (isSelfUpdate) {
      if (
        updateData.role ||
        updateData.college ||
        updateData.institute ||
        updateData.department ||
        updateData.facultyId
      ) {
        return res.status(403).json({
          message: 'You cannot modify your own role, college, institute, department, or faculty ID'
        });
      }
      const allowedFields = ['fullName', 'email', 'password'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) delete updateData[key];
      });

      if (updateData.email && updateData.email !== userToUpdate.email) {
        const existingEmailUser = await User.findOne({
          email: { $regex: `^${updateData.email}$`, $options: 'i' }
        });
        if (existingEmailUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -__v');

      return res.json({ message: 'Profile updated successfully', user: updatedUser });
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
        return res.status(403).json({ message: 'Only super admins can change college' });
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
        if (
          targetRole !== 'campus_admin' &&
          (!updateData.institute || updateData.institute === 'N/A')
        ) {
          return res.status(400).json({ message: 'Institute is required for this college' });
        }
        if (updateData.institute && updateData.institute !== 'N/A') {
          const validInst = collegeData.institutes.some(i => i.name === updateData.institute);
          if (!validInst) {
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
            const instData = collegeData.institutes.find(i => i.name === updateData.institute);
            if (!instData.departments.includes(updateData.department)) {
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

    const before = {
      fullName: userToUpdate.fullName,
      email: userToUpdate.email,
      role: userToUpdate.role,
      facultyId: userToUpdate.facultyId,
      college: userToUpdate.college,
      institute: userToUpdate.institute,
      department: userToUpdate.department
    };

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    // LOG UPDATE ACTION
    await UserLog.create({
      actor: {
        userId: updaterId,
        name: fullName,
        email: email,
        role: role,
      },
      action: 'update',
      targetUser: {
        userId: userToUpdate._id,
        name: userToUpdate.fullName,
        email: userToUpdate.email,
        role: userToUpdate.role,
      },
      before,
      after: {
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        facultyId: updated.facultyId,
        college: updated.college,
        institute: updated.institute,
        department: updated.department
      },
      timestamp: new Date()
    });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or faculty ID already exists' });
    }
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

/* -------------------------- DELETE /admin/users/:id ----------------------- */
router.delete('/users/:id', authenticate, async (req, res) => {
  const { userId: deleterId, fullName, email, role } = req.user;
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });
    if (userToDelete._id.toString() === deleterId) {
      return res.status(403).json({ message: 'You cannot delete yourself' });
    }
    if (!canModifyUser(req.user, userToDelete)) {
      return res.status(403).json({ message: 'You are not authorized to delete this user' });
    }

    const before = {
      fullName: userToDelete.fullName,
      email: userToDelete.email,
      role: userToDelete.role,
      facultyId: userToDelete.facultyId,
      college: userToDelete.college,
      institute: userToDelete.institute,
      department: userToDelete.department
    };

    await User.findByIdAndDelete(req.params.id);

    // LOG DELETE ACTION
    await UserLog.create({
      actor: {
        userId: deleterId,
        name: fullName,
        email: email,
        role: role,
      },
      action: 'delete',
      targetUser: {
        userId: userToDelete._id,
        name: userToDelete.fullName,
        email: userToDelete.email,
        role: userToDelete.role,
      },
      before,
      after: null,
      timestamp: new Date()
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

/* ---------------------- GET /admin/user-logs (Super Admin) ---------------- */
router.get('/user-logs', authenticate, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const logs = await UserLog.find().sort({ timestamp: -1 }).limit(500);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs', error: err.message });
  }
});

export default router;
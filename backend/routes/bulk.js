import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { sendUserWelcomeEmail } from '../utils/sendUserWelcomeMail.js';

// Centralized helpers (single source of truth)
import {
  normalizeCollegeName,
  getCollegeData,
  collegeRequiresInstitute
} from '../utils/collegeData.js';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Role permission helpers (OPTIONAL: move to a roles util if reused elsewhere) */
/* -------------------------------------------------------------------------- */
function canCreateRole(creatorRole, targetRole) {
  const rolePermissions = {
    super_admin: ['campus_admin', 'faculty'],
    campus_admin: ['faculty'],
  };
  return rolePermissions[creatorRole]?.includes(targetRole) || false;
}

/* -------------------------------------------------------------------------- */
/* Authentication (minimal)                                                   */
/* -------------------------------------------------------------------------- */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { userId, role, college, institute, department }
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

/* -------------------------------------------------------------------------- */
/* Multer config                                                              */
/* -------------------------------------------------------------------------- */
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
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

/* -------------------------------------------------------------------------- */
/* POST /bulk-upload-users                                                    */
/* -------------------------------------------------------------------------- */
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
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // account for header row in spreadsheet
      try {
        // Extract / normalize fields (case-insensitive header support)
        const email = row.email || row.Email || row.EMAIL;
        const fullName =
          row.fullName || row['Full Name'] || row.FULLNAME || row.name;
        let password = row.password || row.Password || row.PASSWORD;
        let role = row.role || row.Role || row.ROLE || defaultRole;
        let college = normalizeCollegeName(row.college || row.College || row.COLLEGE);
        let institute = row.institute || row.Institute || row.INSTITUTE;
        let department = row.department || row.Department || row.DEPARTMENT;
        let facultyId = row.facultyId || row.FacultyId || row.FACULTYID;

        // Campus admin can only create faculty (hardened)
        if (creator.role === 'campus_admin') {
            role = 'faculty';
        }

        // Basic field validations
        if (!email || !fullName) {
          failed++; errors.push(`Row ${rowIndex}: Missing email or fullName`);
          continue;
        }
        if (!role) {
          failed++; errors.push(`Row ${rowIndex}: Role is missing`);
          continue;
        }
        if (!canCreateRole(creator.role, role)) {
          failed++; errors.push(`Row ${rowIndex}: You are not allowed to create role '${role}'`);
          continue;
        }

        // Duplicate user check
        const existingUser = await User.findOne({
          email: { $regex: `^${email}$`, $options: 'i' }
        });
        if (existingUser) {
          failed++; errors.push(`Row ${rowIndex}: User already exists`);
          continue;
        }

        // Determine final values
        let finalCollege = college;
        let finalInstitute = institute;
        let finalDepartment = department;
        let finalFacultyId = facultyId;

        if (role === 'super_admin') {
          // Normalize for super_admin
          finalCollege = 'N/A';
          finalInstitute = 'N/A';
          finalDepartment = 'N/A';
          finalFacultyId = 'N/A';
        } else {
          // Creator-based overrides
          if (creator.role === 'super_admin') {
            finalCollege = college;
            finalInstitute = institute;
            finalDepartment = department;
          } else if (creator.role === 'campus_admin') {
            finalCollege = creator.college;
            finalInstitute = creator.institute;
            finalDepartment = department;
          }

          // Faculty ID requirement (non super_admin)
          if (!finalFacultyId) {
            failed++; errors.push(`Row ${rowIndex}: Faculty ID is required for role '${role}'`);
            continue;
          }

          if (finalCollege !== 'N/A') {
            const cData = getCollegeData(finalCollege);
            if (!cData) {
              failed++; errors.push(`Row ${rowIndex}: Invalid college '${finalCollege}'`);
              continue;
            }

            if (cData.hasInstitutes) {
              // Institute required for certain roles
              if (role !== 'campus_admin' && (!finalInstitute || finalInstitute === 'N/A')) {
                failed++; errors.push(`Row ${rowIndex}: Institute is required for college '${finalCollege}'`);
                continue;
              }
              if (finalInstitute && finalInstitute !== 'N/A') {
                const validInst = cData.institutes.some(inst => inst.name === finalInstitute);
                if (!validInst) {
                  failed++; errors.push(`Row ${rowIndex}: Invalid institute '${finalInstitute}' for '${finalCollege}'`);
                  continue;
                }
                if (role !== 'campus_admin') {
                  const instData = cData.institutes.find(inst => inst.name === finalInstitute);
                  if (!finalDepartment || finalDepartment === 'N/A') {
                    failed++; errors.push(`Row ${rowIndex}: Department is required for institute '${finalInstitute}'`);
                    continue;
                  }
                  if (!instData.departments.includes(finalDepartment)) {
                    failed++; errors.push(`Row ${rowIndex}: Department '${finalDepartment}' invalid for '${finalInstitute}'`);
                    continue;
                  }
                } else {
                  // campus_admin => department forced based on RESEARCH or N/A
                  if (finalInstitute !== 'SRM RESEARCH') {
                    finalDepartment = 'N/A';
                  }
                }
              }
            } else {
              // College without institutes
              finalInstitute = 'N/A';
              if (role !== 'campus_admin') {
                if (!finalDepartment || finalDepartment === 'N/A') {
                  failed++; errors.push(`Row ${rowIndex}: Department is required for college '${finalCollege}'`);
                  continue;
                }
                if (!cData.departments.includes(finalDepartment)) {
                  failed++; errors.push(`Row ${rowIndex}: Department '${finalDepartment}' invalid for '${finalCollege}'`);
                  continue;
                }
              } else {
                finalDepartment = 'N/A';
              }
            }
          }
        }

        // Auto-generate password if omitted
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
          } catch {
            // Ignore mail failure in batch summary
          }
        }

        success++;
      } catch (rowErr) {
        failed++;
        errors.push(`Row ${rowIndex}: ${rowErr.message}`);
      }
    }

    res.json({
      success: true,
      summary: {
        total: rows.length,
        success,
        failed,
        errors
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bulk upload failed.' });
  }
});

export default router;
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { sendUserWelcomeEmail } from '../utils/sendUserWelcomeMail.js';

// Local helpers (duplicated from admin.js to avoid cross-file coupling)
const normalizeCollegeName = (college) => {
  if (!college || college === 'N/A') return 'N/A';
  const upperCollege = college.toUpperCase();
  const validColleges = ['SRMIST RAMAPURAM', 'SRM TRICHY', 'EASWARI ENGINEERING COLLEGE', 'TRP ENGINEERING COLLEGE'];
  return validColleges.find((c) => c === upperCollege) || 'N/A';
};

const getCollegeData = (college) => {
  const collegeOptions = [
    {
      name: 'SRMIST RAMAPURAM',
      hasInstitutes: true,
      institutes: [
        { name: 'Science and Humanities', departments: ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A'] },
        {
          name: 'Engineering and Technology',
          departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
        },
        { name: 'Management', departments: ['Business Administration', 'Commerce', 'N/A'] },
        { name: 'Dental', departments: ['General Dentistry', 'Orthodontics', 'N/A'] },
        { name: 'SRM RESEARCH', departments: ['Ramapuram Research'] },
      ],
    },
    {
      name: 'SRM TRICHY',
      hasInstitutes: true,
      institutes: [
        { name: 'Science and Humanities', departments: ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A'] },
        {
          name: 'Engineering and Technology',
          departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
        },
        { name: 'SRM RESEARCH', departments: ['Trichy Research'] },
      ],
    },
    {
      name: 'EASWARI ENGINEERING COLLEGE',
      hasInstitutes: false,
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
    },
    {
      name: 'TRP ENGINEERING COLLEGE',
      hasInstitutes: false,
      departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'],
    },
    { name: 'N/A', hasInstitutes: false, departments: ['N/A'] },
  ];
  return collegeOptions.find((c) => c.name === college) || collegeOptions.find((c) => c.name === 'N/A');
};

function canCreateRole(creatorRole, targetRole) {
  const rolePermissions = {
    super_admin: ['campus_admin', 'faculty'],
    campus_admin: ['faculty'],
  };
  return rolePermissions[creatorRole]?.includes(targetRole) || false;
}

// Minimal auth (same logic as in admin.js)
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

const router = express.Router();

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
    const errors = [];

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
                const validInstitute = collegeData.institutes.some((i) => i.name === finalInstitute);
                if (!validInstitute) {
                  failed++;
                  errors.push(
                    `Row ${i + 2}: Institute '${finalInstitute}' is not valid for college '${finalCollege}'`,
                  );
                  continue;
                }
                if (role !== 'campus_admin') {
                  if (!finalDepartment || finalDepartment === 'N/A') {
                    failed++;
                    errors.push(`Row ${i + 2}: Department is required for institute '${finalInstitute}'`);
                    continue;
                  }
                  const instituteData = collegeData.institutes.find((i) => i.name === finalInstitute);
                  if (!instituteData.departments.includes(finalDepartment)) {
                    failed++;
                    errors.push(
                      `Row ${i + 2}: Department '${finalDepartment}' is not valid for institute '${finalInstitute}'`,
                    );
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
                  errors.push(
                    `Row ${i + 2}: Department '${finalDepartment}' is not valid for college '${finalCollege}'`,
                  );
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
          createdBy: creator.userId,
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
              appUrl: process.env.APP_URL || 'https://scholarsync.example.com',
            });
          } catch (mailErr) {
            // Don't fail hard on email error; capture for summary
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
      summary: { total: rows.length, success, failed, errors },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bulk upload failed.' });
  }
});

export default router;
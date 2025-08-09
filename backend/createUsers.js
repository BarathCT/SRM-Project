import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js'; // Adjust path as needed

dotenv.config();

const COLLEGE_CONFIG = [
  {
    name: 'SRMIST RAMAPURAM',
    emailDomain: 'srmist.edu.in',
    hasInstitutes: true,
    institutes: [
      { name: 'Science and Humanities', departments: ['Physics', 'Chemistry', 'Mathematics', 'English', 'N/A'] },
      { name: 'Engineering and Technology', departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'] },
      { name: 'Management', departments: ['Business Administration', 'Commerce', 'N/A'] },
      { name: 'Dental', departments: ['General Dentistry', 'Orthodontics', 'N/A'] },
      { name: 'SRM RESEARCH', departments: ['Ramapuram Research'] } // <-- Added
    ]
  },
  {
    name: 'SRM TRICHY',
    emailDomain: 'srmtrichy.edu.in',
    hasInstitutes: true,
    institutes: [
      { name: 'Science and Humanities', departments: ['Physics', 'Chemistry', 'Mathematics', 'English', 'N/A'] },
      { name: 'Engineering and Technology', departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A'] },
      { name: 'SRM RESEARCH', departments: ['Trichy Research'] } // <-- Added
    ]
  },
  {
    name: 'EASWARI ENGINEERING COLLEGE',
    emailDomain: 'eec.srmrmp.edu.in',
    hasInstitutes: false
  },
  {
    name: 'TRP ENGINEERING COLLEGE',
    emailDomain: 'trp.srmtrichy.edu.in',
    hasInstitutes: false
  }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    console.log('🗑️  Existing users cleared');

    // Password hashing function
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 12);
    };

    // Generate unique faculty IDs
    let facultyIdx = 1;
    const generateFacultyId = () => `FAC-${String(facultyIdx++).padStart(4, '0')}`;

    // Super Admin
    const users = [
      {
        fullName: 'Super Admin',
        facultyId: 'N/A',
        email: 'superadmin@srmist.edu.in',
        password: await hashPassword('superadmin123'),
        role: 'super_admin',
        college: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        createdBy: null
      }
    ];

    // Campus Admins: One per institute (if present), else one per college, emails like campusadmin1@domain
    for (const college of COLLEGE_CONFIG) {
      let campusAdminCount = 1;
      if (college.hasInstitutes) {
        for (const institute of college.institutes) {
          users.push({
            fullName: `${institute.name} Campus Admin`,
            facultyId: generateFacultyId(),
            email: `campusadmin${campusAdminCount}@${college.emailDomain}`,
            password: await hashPassword('campusadmin123'),
            role: 'campus_admin',
            college: college.name,
            institute: institute.name,
            department: institute.departments?.[0] ?? 'N/A',
            createdBy: null
          });
          campusAdminCount++;
        }
      } else {
        users.push({
          fullName: `${college.name} Campus Admin`,
          facultyId: generateFacultyId(),
          email: `campusadmin1@${college.emailDomain}`,
          password: await hashPassword('campusadmin123'),
          role: 'campus_admin',
          college: college.name,
          institute: 'N/A',
          department: 'N/A',
          createdBy: null
        });
      }
    }

    // For each college, create unique faculty emails: faculty1@domain, faculty2@domain, ...
    for (const college of COLLEGE_CONFIG) {
      let facultyCount = 1;
      if (college.hasInstitutes) {
        for (const institute of college.institutes) {
          for (let i = 1; i <= 5; i++) {
            users.push({
              fullName: `${institute.name} Faculty ${i}`,
              facultyId: generateFacultyId(),
              email: `faculty${facultyCount}@${college.emailDomain}`,
              password: await hashPassword('faculty1234'),
              role: 'faculty',
              college: college.name,
              institute: institute.name,
              department: institute.departments?.[0] ?? 'N/A',
              createdBy: null
            });
            facultyCount++;
          }
        }
      } else {
        for (let i = 1; i <= 5; i++) {
          users.push({
            fullName: `${college.name} Faculty ${i}`,
            facultyId: generateFacultyId(),
            email: `faculty${facultyCount}@${college.emailDomain}`,
            password: await hashPassword('faculty1234'),
            role: 'faculty',
            college: college.name,
            institute: 'N/A',
            department: 'N/A',
            createdBy: null
          });
          facultyCount++;
        }
      }
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Successfully created ${createdUsers.length} test users`);

    console.log('\nCreated Users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.role.padEnd(15)}: ${user.email} (${user._id})`);
    });

    // Set createdBy: all users except super_admin are created by super_admin
    const superAdmin = createdUsers.find(u => u.role === 'super_admin');
    if (superAdmin) {
      await User.updateMany(
        { _id: { $ne: superAdmin._id } },
        { $set: { createdBy: superAdmin._id } }
      );
      console.log('🔗 Updated createdBy references (all except super_admin)');
    }

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

run();
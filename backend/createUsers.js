import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js'; // Adjust path as needed

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Optional: clean slate
    await User.deleteMany({});
    console.log('🗑️  Existing users cleared');

    // Password hashing function
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 12);
    };

    // Generate simple faculty IDs
    const generateFacultyId = (role, index) => {
      return `${role.toUpperCase().substr(0, 3)}-${index.toString().padStart(3, '0')}`;
    };

    // Test users
    const users = [
      // Super Admin (1)
      {
        fullName: 'Super Admin',
        facultyId: 'N/A',
        email: 'superadmin@srmist.edu.in',
        password: await hashPassword('superadmin'),
        role: 'super_admin',
        college: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        createdBy: null
      },

      // Campus Admins (2 per college)
      // SRMIST RAMAPURAM
      {
        fullName: 'Ramapuram Campus Admin 1',
        facultyId: generateFacultyId('campus_admin', 1),
        email: 'campusadmin1@ramapuram.edu.in',
        password: await hashPassword('campusadmin'),
        role: 'campus_admin',
        college: 'SRMIST RAMAPURAM',
        institute: 'Engineering and Technology',
        department: 'Computer Science',
        createdBy: null
      },
      {
        fullName: 'Ramapuram Campus Admin 2',
        facultyId: generateFacultyId('campus_admin', 2),
        email: 'campusadmin2@ramapuram.edu.in',
        password: await hashPassword('campusadmin'),
        role: 'campus_admin',
        college: 'SRMIST RAMAPURAM',
        institute: 'Science and Humanities',
        department: 'Physics',
        createdBy: null
      },

      // SRM TRICHY
      {
        fullName: 'Trichy Campus Admin 1',
        facultyId: generateFacultyId('campus_admin', 3),
        email: 'campusadmin1@trichy.edu.in',
        password: await hashPassword('campusadmin'),
        role: 'campus_admin',
        college: 'SRM TRICHY',
        institute: 'Engineering and Technology',
        department: 'Information Technology',
        createdBy: null
      },

      // EASWARI ENGINEERING COLLEGE
      {
        fullName: 'Eswari Campus Admin 1',
        facultyId: generateFacultyId('campus_admin', 4),
        email: 'campusadmin1@eswari.edu.in',
        password: await hashPassword('campusadmin'),
        role: 'campus_admin',
        college: 'EASWARI ENGINEERING COLLEGE',
        institute: 'N/A',
        department: 'Electronics',
        createdBy: null
      },

      // TRP ENGINEERING COLLEGE
      {
        fullName: 'TRP Campus Admin 1',
        facultyId: generateFacultyId('campus_admin', 5),
        email: 'campusadmin1@trp.edu.in',
        password: await hashPassword('campusadmin'),
        role: 'campus_admin',
        college: 'TRP ENGINEERING COLLEGE',
        institute: 'N/A',
        department: 'Mechanical',
        createdBy: null
      },

      // Admins (2 per institute where applicable)
      // SRMIST RAMAPURAM - Engineering
      {
        fullName: 'Engineering Admin 1',
        facultyId: generateFacultyId('admin', 1),
        email: 'admin1@ramapuram.edu.in',
        password: await hashPassword('admin'),
        role: 'admin',
        college: 'SRMIST RAMAPURAM',
        institute: 'Engineering and Technology',
        department: 'Computer Science',
        createdBy: null
      },
      {
        fullName: 'Engineering Admin 2',
        facultyId: generateFacultyId('admin', 2),
        email: 'admin2@ramapuram.edu.in',
        password: await hashPassword('admin'),
        role: 'admin',
        college: 'SRMIST RAMAPURAM',
        institute: 'Engineering and Technology',
        department: 'Civil',
        createdBy: null
      },

      // SRMIST RAMAPURAM - Science
      {
        fullName: 'Science Admin 1',
        facultyId: generateFacultyId('admin', 3),
        email: 'admin1@science.edu.in',
        password: await hashPassword('admin'),
        role: 'admin',
        college: 'SRMIST RAMAPURAM',
        institute: 'Science and Humanities',
        department: 'Physics',
        createdBy: null
      },

      // SRM TRICHY - Engineering
      {
        fullName: 'Trichy Admin 1',
        facultyId: generateFacultyId('admin', 4),
        email: 'admin1@trichy.edu.in',
        password: await hashPassword('admin'),
        role: 'admin',
        college: 'SRM TRICHY',
        institute: 'Engineering and Technology',
        department: 'Mechanical',
        createdBy: null
      },

      // Faculty (3 per department)
      // SRMIST RAMAPURAM - Engineering - Computer Science
      {
        fullName: 'CS Faculty 1',
        facultyId: generateFacultyId('faculty', 1),
        email: 'faculty1@cs.ramapuram.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        institute: 'Engineering and Technology',
        department: 'Computer Science',
        createdBy: null
      },
      {
        fullName: 'CS Faculty 2',
        facultyId: generateFacultyId('faculty', 2),
        email: 'faculty2@cs.ramapuram.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        institute: 'Engineering and Technology',
        department: 'Computer Science',
        createdBy: null
      },

      // SRMIST RAMAPURAM - Engineering - Electronics
      {
        fullName: 'ECE Faculty 1',
        facultyId: generateFacultyId('faculty', 3),
        email: 'faculty1@ece.ramapuram.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        institute: 'Engineering and Technology',
        department: 'Electronics',
        createdBy: null
      },

      // SRMIST RAMAPURAM - Science - Physics
      {
        fullName: 'Physics Faculty 1',
        facultyId: generateFacultyId('faculty', 4),
        email: 'faculty1@physics.ramapuram.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        institute: 'Science and Humanities',
        department: 'Physics',
        createdBy: null
      },

      // SRM TRICHY - Engineering - IT
      {
        fullName: 'IT Faculty 1',
        facultyId: generateFacultyId('faculty', 5),
        email: 'faculty1@it.trichy.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'SRM TRICHY',
        institute: 'Engineering and Technology',
        department: 'Information Technology',
        createdBy: null
      },

      // EASWARI ENGINEERING COLLEGE - Electronics
      {
        fullName: 'Eswari Faculty 1',
        facultyId: generateFacultyId('faculty', 6),
        email: 'faculty1@eswari.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'EASWARI ENGINEERING COLLEGE',
        institute: 'N/A',
        department: 'Electronics',
        createdBy: null
      },

      // TRP ENGINEERING COLLEGE - Mechanical
      {
        fullName: 'TRP Faculty 1',
        facultyId: generateFacultyId('faculty', 7),
        email: 'faculty1@trp.edu.in',
        password: await hashPassword('faculty'),
        role: 'faculty',
        college: 'TRP ENGINEERING COLLEGE',
        institute: 'N/A',
        department: 'Mechanical',
        createdBy: null
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Successfully created ${createdUsers.length} test users`);

    console.log('\nCreated Users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.role.padEnd(15)}: ${user.email} (${user._id})`);
    });

    // Now set createdBy references properly
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
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

    // Generate faculty IDs
    const generateFacultyId = () => {
      return 'FAC-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    };

    // Test users
    const users = [
      // Super Admin
      {
        fullName: 'Super Admin',
        facultyId: 'N/A',
        email: 'superadmin@srmist.edu.in',
        password: await hashPassword('superadmin123'),
        role: 'super_admin',
        college: 'N/A',
        category: 'N/A',
        createdBy: null
      },

      // Campus Admins
      {
        fullName: 'Ramapuram Campus Admin',
        facultyId: generateFacultyId(),
        email: 'ramapuram.campusadmin@srmist.edu.in',
        password: await hashPassword('ramapuram123'),
        role: 'campus_admin',
        college: 'SRMIST RAMAPURAM',
        category: 'Engineering and Technology',
        createdBy: null
      },
      {
        fullName: 'Trichy Campus Admin',
        facultyId: generateFacultyId(),
        email: 'trichy.campusadmin@srmist.edu.in',
        password: await hashPassword('trichy123'),
        role: 'campus_admin',
        college: 'SRM TRICHY',
        category: 'Engineering and Technology',
        createdBy: null
      },
      {
        fullName: 'Eswari Campus Admin',
        facultyId: generateFacultyId(),
        email: 'eswari.campusadmin@srmist.edu.in',
        password: await hashPassword('eswari123'),
        role: 'campus_admin',
        college: 'EASWARI ENGINEERING COLLEGE',
        category: 'N/A',
        createdBy: null
      },
      {
        fullName: 'TRP Campus Admin',
        facultyId: generateFacultyId(),
        email: 'trp.campusadmin@srmist.edu.in',
        password: await hashPassword('trp123'),
        role: 'campus_admin',
        college: 'TRP ENGINEERING COLLEGE',
        category: 'N/A',
        createdBy: null
      },

      // Admins
      {
        fullName: 'Engineering Admin',
        facultyId: generateFacultyId(),
        email: 'eng.admin@ramapuram.edu.in',
        password: await hashPassword('engadmin123'),
        role: 'admin',
        college: 'SRMIST RAMAPURAM',
        category: 'Engineering and Technology',
        createdBy: null
      },
      {
        fullName: 'Science Admin',
        facultyId: generateFacultyId(),
        email: 'science.admin@ramapuram.edu.in',
        password: await hashPassword('scienceadmin123'),
        role: 'admin',
        college: 'SRMIST RAMAPURAM',
        category: 'Science and Humanities',
        createdBy: null
      },

      // Faculty
      {
        fullName: 'CS Faculty',
        facultyId: generateFacultyId(),
        email: 'cs.faculty@ramapuram.edu.in',
        password: await hashPassword('csfaculty123'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        category: 'Engineering and Technology',
        createdBy: null
      },
      {
        fullName: 'ECE Faculty',
        facultyId: generateFacultyId(),
        email: 'ece.faculty@ramapuram.edu.in',
        password: await hashPassword('ecefaculty123'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        category: 'Engineering and Technology',
        createdBy: null
      },
      {
        fullName: 'Physics Faculty',
        facultyId: generateFacultyId(),
        email: 'physics.faculty@ramapuram.edu.in',
        password: await hashPassword('physics123'),
        role: 'faculty',
        college: 'SRMIST RAMAPURAM',
        category: 'Science and Humanities',
        createdBy: null
      },
      {
        fullName: 'Eswari Faculty',
        facultyId: generateFacultyId(),
        email: 'eswari.faculty@eswari.edu.in',
        password: await hashPassword('eswarifaculty123'),
        role: 'faculty',
        college: 'EASWARI ENGINEERING COLLEGE',
        category: 'N/A',
        createdBy: null
      },
      {
        fullName: 'TRP Faculty',
        facultyId: generateFacultyId(),
        email: 'trp.faculty@trp.edu.in',
        password: await hashPassword('trpfaculty123'),
        role: 'faculty',
        college: 'TRP ENGINEERING COLLEGE',
        category: 'N/A',
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
// // scripts/createUsers.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import bcrypt from 'bcrypt';
// import User from './models/User.js'; // ✅ Adjust path as per your project structure

// dotenv.config();

// const run = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ Connected to MongoDB');

//     // Optional: clean slate
//     await User.deleteMany({});

//     // Passwords
//     const superAdminPass = await bcrypt.hash('superadmin123', 10);
//     const campusAdminPass = await bcrypt.hash('campusadmin123', 10);
//     const adminPass = await bcrypt.hash('admin123', 10);
//     const facultyPass = await bcrypt.hash('faculty123', 10);
//     const scholarPass = await bcrypt.hash('scholar123', 10);

//     const users = [
//       {
//         email: 'superadmin@srmist.edu.in',
//         password: superAdminPass,
//         role: 'super_admin',
//         college: 'N/A',
//         category: 'N/A'
//       },
//       {
//         email: 'campusadmin@ramapuram.edu.in',
//         password: campusAdminPass,
//         role: 'campus_admin',
//         college: 'SRMIST RAMAPURAM',
//         category: 'N/A'
//       },
//       {
//         email: 'campusadmin@trichy.edu.in',
//         password: campusAdminPass,
//         role: 'campus_admin',
//         college: 'SRM TRICHY',
//         category: 'N/A'
//       },
//       {
//         email: 'admin@ramapuram.edu.in',
//         password: adminPass,
//         role: 'admin',
//         college: 'SRMIST RAMAPURAM',
//         category: 'N/A'
//       },
//       {
//         email: 'faculty1@ramapuram.edu.in',
//         password: facultyPass,
//         role: 'faculty',
//         college: 'SRMIST RAMAPURAM',
//         category: 'Engineering and Technology'
//       },
//       {
//         email: 'scholar1@ramapuram.edu.in',
//         password: scholarPass,
//         role: 'scholar',
//         college: 'SRMIST RAMAPURAM',
//         category: 'Engineering and Technology'
//       }
//     ];

//     await User.insertMany(users);
//     console.log('✅ Users created successfully');
//   } catch (error) {
//     console.error('❌ Error creating users:', error.message);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// run();

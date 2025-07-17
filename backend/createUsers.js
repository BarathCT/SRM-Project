// scripts/createUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js'; // ✅ Adjust path if needed

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedUser = await bcrypt.hash('user123', 10);

    await User.deleteMany({}); // Optional: Clean up all users

    await User.insertMany([
      {
        email: 'admin@srmist.edu.in',
        password: hashedAdmin,
        role: 'admin',
        college: 'N/A',
        category: 'N/A'
      },
      {
        email: 'user@srmist.edu.in',
        password: hashedUser,
        role: 'user',
        college: 'SRMIST RAMAPURAM',
        category: 'Engineering and Technology' // ✅ Only valid for SRMIST RAMAPURAM
      },
      {
        email: 'user2@srmist.edu.in',
        password: await bcrypt.hash('user123', 10),
        role: 'user',
        college: 'EASWARI ENGINEERING COLLEGE',
        category: 'N/A' // ✅ Automatically N/A for non-RAMAPURAM
      }
    ]);

    console.log('Users created successfully');
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    mongoose.connection.close();
  }
};

run();

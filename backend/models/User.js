// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  college: {
    type: String,
    enum: ['SRMIST RAMAPURAM', 'SRM TRICHY', 'EASWARI ENGINEERING COLLEGE', 'N/A'],
    default: 'N/A'
  },
  category: {
    type: String,
    enum: ['Engineering and Technology', 'Science and Humanities', 'Management', 'Dental', 'N/A'],
    default: 'N/A'
  }
});

const User = mongoose.model('User', userSchema);
export default User; // ✅ default export

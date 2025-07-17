import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['super_admin', 'campus_admin', 'admin', 'faculty', 'scholar'],
    default: 'scholar'
  },

  // Applicable only for roles below super_admin
  college: {
    type: String,
    enum: [
      'SRMIST RAMAPURAM',
      'SRM TRICHY',
      'EASWARI ENGINEERING COLLEGE',
      'N/A'
    ],
    default: 'N/A'
  },

  // Only required for faculty, scholar, and possibly admin (for filtering)
  category: {
    type: String,
    enum: [
      'Engineering and Technology',
      'Science and Humanities',
      'Management',
      'Dental',
      'N/A'
    ],
    default: 'N/A'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

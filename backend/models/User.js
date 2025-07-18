import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 
      'Please fill a valid email address'
    ]
  },
  password: { 
    type: String, 
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  facultyId: {
    type: String,
    default: 'N/A'
  },
  role: {
    type: String,
    enum: ['super_admin', 'campus_admin', 'admin', 'faculty'],
    required: true
  },
  college: {
    type: String,
    enum: [
      'SRMIST RAMAPURAM',
      'SRM TRICHY',
      'EASWARI ENGINEERING COLLEGE',
      'TRP ENGINEERING COLLEGE',
      'N/A'
    ],
    default: 'N/A'
  },
  // For Eswari and TRP college, category will always be 'N/A'
  category: {
    type: String,
    enum: [
      'Science and Humanities',
      'Engineering and Technology', 
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// List of colleges which do not have category
const collegesWithoutCategories = [
  'EASWARI ENGINEERING COLLEGE',
  'TRP ENGINEERING COLLEGE'
];

// Middleware to validate logical field consistency
userSchema.pre('validate', function(next) {
  // Super admin must have N/A values
  if (this.role === 'super_admin') {
    this.college = 'N/A';
    this.category = 'N/A';
    this.facultyId = 'N/A';
  } else {
    // All other roles must have facultyId
    if (this.facultyId === 'N/A') {
      return next(new Error('Faculty ID is required for non-super admin roles'));
    }

    // College must not be N/A
    if (this.college === 'N/A') {
      return next(new Error('College is required for non-super admin roles'));
    }
  }

  // If college doesn't have categories, always set category to 'N/A'
  if (collegesWithoutCategories.includes(this.college)) {
    this.category = 'N/A';
  }

  // Category-specific rules
  if (this.role === 'faculty' && !collegesWithoutCategories.includes(this.college)) {
    if (this.category === 'N/A') {
      return next(new Error('Category is required for faculty'));
    }
  }

  if (this.role === 'campus_admin') {
    if (collegesWithoutCategories.includes(this.college)) {
      if (this.category !== 'N/A') {
        return next(new Error(`Campus admins in ${this.college} must have category set to N/A`));
      }
    } else {
      if (this.category === 'N/A') {
        return next(new Error(`Campus admins in ${this.college} must have a valid category`));
      }
    }
  }

  next();
});

// College options for validation
const collegeOptions = [
  { 
    name: 'SRMIST RAMAPURAM',
    categories: [
      'Science and Humanities',
      'Engineering and Technology',
      'Management',
      'Dental'
    ],
    hasCategories: true
  },
  { 
    name: 'SRM TRICHY',
    categories: [
      'Science and Humanities',
      'Engineering and Technology'
    ],
    hasCategories: true
  },
  { 
    name: 'EASWARI ENGINEERING COLLEGE',
    categories: ['N/A'],
    hasCategories: false
  },
  { 
    name: 'TRP ENGINEERING COLLEGE',
    categories: ['N/A'],
    hasCategories: false
  },
  { 
    name: 'N/A',
    categories: ['N/A'],
    hasCategories: false
  }
];

// Middleware to validate category-college match
userSchema.pre('save', function(next) {
  const collegeData = collegeOptions.find(c => c.name === this.college);

  // If college doesn't have categories, always set category to 'N/A'
  if (collegesWithoutCategories.includes(this.college)) {
    this.category = 'N/A';
  }

  if (this.college !== 'N/A' && collegeData) {
    // Validate category belongs to college for colleges with categories
    if (collegeData.hasCategories) {
      if (this.category !== 'N/A' && !collegeData.categories.includes(this.category)) {
        return next(
          new Error(`Category '${this.category}' is not valid for college '${this.college}'`)
        );
      }
    }
    // Campus admins in colleges without categories must have category N/A
    if (this.role === 'campus_admin' && !collegeData.hasCategories && this.category !== 'N/A') {
      return next(
        new Error(`Campus admins in ${this.college} must have category set to N/A`)
      );
    }
  }

  next();
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ facultyId: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });
userSchema.index({ category: 1 });
userSchema.index({ createdBy: 1 });

const User = mongoose.model('User', userSchema);
export default User;
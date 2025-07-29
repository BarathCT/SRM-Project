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
  institute: {
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
  department: {
    type: String,
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

// List of colleges which do not have institutes
const collegesWithoutInstitutes = [
  'EASWARI ENGINEERING COLLEGE',
  'TRP ENGINEERING COLLEGE'
];

// College options with their institutes and departments
const collegeOptions = [
  { 
    name: 'SRMIST RAMAPURAM',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: [
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'N/A'
        ]
      },
      { 
        name: 'Engineering and Technology',
        departments: [
          'Computer Science',
          'Information Technology',
          'Electronics',
          'Mechanical',
          'Civil',
          'N/A'
        ]
      },
      { 
        name: 'Management',
        departments: [
          'Business Administration',
          'Commerce',
          'N/A'
        ]
      },
      { 
        name: 'Dental',
        departments: [
          'General Dentistry',
          'Orthodontics',
          'N/A'
        ]
      }
    ]
  },
  { 
    name: 'SRM TRICHY',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: [
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'N/A'
        ]
      },
      { 
        name: 'Engineering and Technology',
        departments: [
          'Computer Science',
          'Information Technology',
          'Electronics',
          'Mechanical',
          'Civil',
          'N/A'
        ]
      }
    ]
  },
  { 
    name: 'EASWARI ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: [
      'Computer Science',
      'Information Technology',
      'Electronics',
      'Mechanical',
      'Civil',
      'N/A'
    ]
  },
  { 
    name: 'TRP ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: [
      'Computer Science',
      'Information Technology',
      'Electronics',
      'Mechanical',
      'Civil',
      'N/A'
    ]
  },
  { 
    name: 'N/A',
    hasInstitutes: false,
    departments: ['N/A']
  }
];

// Middleware to validate logical field consistency
userSchema.pre('validate', function(next) {
  // Super admin must have N/A values
  if (this.role === 'super_admin') {
    this.college = 'N/A';
    this.institute = 'N/A';
    this.department = 'N/A';
    this.facultyId = 'N/A';
    return next();
  }

  // All other roles must have facultyId
  if (this.facultyId === 'N/A') {
    return next(new Error('Faculty ID is required for non-super admin roles'));
  }

  // College must not be N/A
  if (this.college === 'N/A') {
    return next(new Error('College is required for non-super admin roles'));
  }

  const collegeData = collegeOptions.find(c => c.name === this.college);
  if (!collegeData) {
    return next(new Error('Invalid college specified'));
  }

  // Handle colleges without institutes
  if (collegesWithoutInstitutes.includes(this.college)) {
    this.institute = 'N/A';
    
    // Validate department for colleges without institutes
    if (!collegeData.departments.includes(this.department)) {
      return next(new Error(`Invalid department '${this.department}' for college '${this.college}'`));
    }
    
    return next();
  }

  // For colleges with institutes
  if (this.institute === 'N/A') {
    return next(new Error('Institute is required for this college'));
  }

  // Find the institute data
  const instituteData = collegeData.institutes.find(i => i.name === this.institute);
  if (!instituteData) {
    return next(new Error(`Institute '${this.institute}' is not valid for college '${this.college}'`));
  }

  // Validate department
  if (!instituteData.departments.includes(this.department)) {
    return next(new Error(`Invalid department '${this.department}' for institute '${this.institute}' in college '${this.college}'`));
  }

  next();
});

// Middleware to validate institute-college-department match
userSchema.pre('save', function(next) {
  const collegeData = collegeOptions.find(c => c.name === this.college);

  // If college doesn't have institutes, ensure institute is 'N/A'
  if (collegesWithoutInstitutes.includes(this.college)) {
    this.institute = 'N/A';
    
    // Validate department for colleges without institutes
    if (!collegeData.departments.includes(this.department)) {
      return next(new Error(`Invalid department '${this.department}' for college '${this.college}'`));
    }
  } else {
    // For colleges with institutes, validate the institute-department relationship
    if (this.institute !== 'N/A') {
      const instituteData = collegeData.institutes.find(i => i.name === this.institute);
      if (!instituteData) {
        return next(new Error(`Institute '${this.institute}' is not valid for college '${this.college}'`));
      }
      
      if (!instituteData.departments.includes(this.department)) {
        return next(new Error(`Department '${this.department}' is not valid for institute '${this.institute}'`));
      }
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
userSchema.index({ institute: 1 });
userSchema.index({ department: 1 });
userSchema.index({ createdBy: 1 });

const User = mongoose.model('User', userSchema);
export default User;
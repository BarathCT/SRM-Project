import mongoose from 'mongoose';

// Allowed domains for email validation
const normalCollegeDomains = {
  'SRMIST RAMAPURAM': 'srmist.edu.in',
  'SRM TRICHY': 'srmtrichy.edu.in',
  'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
  'TRP ENGINEERING COLLEGE': 'trp.srmtrichy.edu.in'
};
const researchAllowedDomains = [
  'srmist.edu.in',
  'srmtrichy.edu.in',
  'eec.srmrmp.edu.in',
  'trp.srmtrichy.edu.in'
];

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
    enum: ['super_admin', 'campus_admin', 'faculty'],
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
      // Only these colleges have SRM RESEARCH as an institute
      'Science and Humanities',
      'Engineering and Technology', 
      'Management',
      'Dental',
      'SRM RESEARCH',
      'N/A'
    ],
    default: 'N/A'
  },
  department: {
    type: String,
    default: 'N/A'
  },
  // Author ID fields for research publications
  authorId: {
    scopus: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function(v) {
          // Only validate if value is provided (not null/empty)
          if (!v) return true;
          // Scopus Author ID is typically 10-11 digits
          return /^\d{10,11}$/.test(v);
        },
        message: 'Scopus Author ID must be 10-11 digits'
      }
    },
    sci: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function(v) {
          // Only validate if value is provided (not null/empty)
          if (!v) return true;
          // SCI Author ID format validation (adjust pattern as needed)
          return /^[A-Z]-\d{4}-\d{4}$/.test(v);
        },
        message: 'SCI Author ID must be in format X-XXXX-XXXX (e.g., A-1234-5678)'
      }
    },
    webOfScience: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function(v) {
          // Only validate if value is provided (not null/empty)
          if (!v) return true;
          // Web of Science ResearcherID format validation
          return /^[A-Z]-\d{4}-\d{4}$/.test(v);
        },
        message: 'Web of Science ResearcherID must be in format X-XXXX-XXXX (e.g., A-1234-5678)'
      }
    }
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
      },
      { 
        name: 'SRM RESEARCH',
        departments: [
          'Ramapuram Research'
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
      },
      { 
        name: 'SRM RESEARCH',
        departments: [
          'Trichy Research'
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

  if (collegesWithoutInstitutes.includes(this.college)) {
    this.institute = 'N/A';
    if (!collegeData.departments.includes(this.department)) {
      return next(new Error(`Invalid department '${this.department}' for college '${this.college}'`));
    }
  } else {
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

// Middleware to enforce email domain restrictions (SRM RESEARCH case and normal)
userSchema.pre('validate', function(next) {
  if (!this.isActive) return next();
  if (this.role === 'super_admin') return next();

  // Check for SRM RESEARCH selection for only SRMIST RAMAPURAM and SRM TRICHY
  let isResearch = false;
  if (
    (this.college === 'SRMIST RAMAPURAM' || this.college === 'SRM TRICHY') &&
    this.institute === 'SRM RESEARCH'
  ) {
    isResearch = true;
  }

  const emailDomain = this.email.split('@')[1] || '';
  if (isResearch) {
    if (!researchAllowedDomains.includes(emailDomain)) {
      return next(new Error(
        `For SRM RESEARCH, only these email domains are allowed: ${researchAllowedDomains.join(', ')}`
      ));
    }
    return next();
  }

  // Normal selection (no SRM RESEARCH)
  if (Object.keys(normalCollegeDomains).includes(this.college)) {
    const allowedDomain = normalCollegeDomains[this.college];
    if (emailDomain !== allowedDomain) {
      return next(new Error(
        `Email domain '${emailDomain}' is not allowed for college '${this.college}'. Allowed domain: ${allowedDomain}`
      ));
    }
    return next();
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
// New indexes for Author IDs
userSchema.index({ 'authorId.scopus': 1 }, { sparse: true });
userSchema.index({ 'authorId.sci': 1 }, { sparse: true });
userSchema.index({ 'authorId.webOfScience': 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);
export default User;
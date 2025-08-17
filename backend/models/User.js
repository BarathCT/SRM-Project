import mongoose from 'mongoose';
import {
  normalCollegeDomains,
  researchAllowedDomains,
  collegesWithoutInstitutes,
  getCollegeData,
  isValidDepartmentSelection
} from '../utils/collegeData.js';

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
  fullName: { type: String, required: true, trim: true },
  facultyId: { 
    type: String, 
    default: 'N/A',
    unique: true, // <-- Make facultyId unique
    sparse: true  // Allow multiple 'N/A' values (unique only when not null/'N/A')
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
  authorId: {
    scopus: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: v => !v || /^\d{10,11}$/.test(v),
        message: 'Scopus Author ID must be 10-11 digits'
      }
    },
    sci: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: v => !v || /^[A-Z]-\d{4}-\d{4}$/.test(v),
        message: 'SCI Author ID must be in format X-XXXX-XXXX (e.g., A-1234-5678)'
      }
    },
    webOfScience: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: v => !v || /^[A-Z]-\d{4}-\d{4}$/.test(v),
        message: 'Web of Science ResearcherID must be in format X-XXXX-XXXX (e.g., A-1234-5678)'
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
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

// Enhanced validation middleware
userSchema.pre('validate', function(next) {
  if (this.role === 'super_admin') {
    this.college = 'N/A';
    this.institute = 'N/A';
    this.department = 'N/A';
    this.facultyId = 'N/A';
    return next();
  }

  // Common validations for both campus_admin and faculty
  if (this.facultyId === 'N/A') {
    return next(new Error('Faculty ID is required for non-super admin roles'));
  }

  if (this.college === 'N/A') {
    return next(new Error('College is required for non-super admin roles'));
  }

  const collegeData = getCollegeData(this.college);
  if (!collegeData) {
    return next(new Error('Invalid college specified'));
  }

  // Campus Admin specific validations
  if (this.role === 'campus_admin') {
    this.department = 'N/A'; // Force department to be N/A for all campus admins
    
    if (collegesWithoutInstitutes.includes(this.college)) {
      this.institute = 'N/A';
    } else {
      if (this.institute === 'N/A') {
        return next(new Error('Institute is required for campus admins in colleges with institutes'));
      }
    }
    return next();
  }

  // Faculty specific validations
  if (this.role === 'faculty') {
    if (this.department === 'N/A') {
      return next(new Error('Department is required for faculty members'));
    }

    if (collegesWithoutInstitutes.includes(this.college)) {
      this.institute = 'N/A';
      if (!isValidDepartmentSelection(this.college, 'N/A', this.department)) {
        return next(new Error(`Invalid department '${this.department}' for college '${this.college}'`));
      }
    } else {
      if (this.institute === 'N/A') {
        return next(new Error('Institute is required for faculty in colleges with institutes'));
      }
      if (!isValidDepartmentSelection(this.college, this.institute, this.department)) {
        return next(new Error(
          `Invalid department '${this.department}' for institute '${this.institute}' in college '${this.college}'`
        ));
      }
    }
  }

  next();
});

// Email domain restrictions (unchanged)
userSchema.pre('validate', function(next) {
  if (!this.isActive) return next();
  if (this.role === 'super_admin') return next();

  const emailDomain = (this.email.split('@')[1] || '').toLowerCase();

  const isResearch =
    (this.college === 'SRMIST RAMAPURAM' || this.college === 'SRM TRICHY') &&
    this.institute === 'SRM RESEARCH';

  if (isResearch) {
    if (!researchAllowedDomains.includes(emailDomain)) {
      return next(new Error(
        `For SRM RESEARCH, only these email domains are allowed: ${researchAllowedDomains.join(', ')}`
      ));
    }
    return next();
  }

  if (normalCollegeDomains[this.college]) {
    const allowedDomain = normalCollegeDomains[this.college];
    if (emailDomain !== allowedDomain) {
      return next(new Error(
        `Email domain '${emailDomain}' is not allowed for college '${this.college}'. Allowed domain: ${allowedDomain}`
      ));
    }
  }

  next();
});

// Save hook: re-assert relationships
userSchema.pre('save', function(next) {
  if (this.role === 'super_admin') {
    this.college = 'N/A';
    this.institute = 'N/A';
    this.department = 'N/A';
    this.facultyId = 'N/A';
  } else if (this.role === 'campus_admin') {
    this.department = 'N/A';
    if (collegesWithoutInstitutes.includes(this.college)) {
      this.institute = 'N/A';
    }
  } else if (this.role === 'faculty' && collegesWithoutInstitutes.includes(this.college)) {
    this.institute = 'N/A';
  }
  next();
});

// Indexes (unchanged)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ facultyId: 1 }, { unique: true, sparse: true }); // Ensure unique facultyId, allow multiple N/A
userSchema.index({ fullName: 'text' });
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });
userSchema.index({ institute: 1 });
userSchema.index({ department: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ 'authorId.scopus': 1 }, { sparse: true });
userSchema.index({ 'authorId.sci': 1 }, { sparse: true });
userSchema.index({ 'authorId.webOfScience': 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);
export default User;
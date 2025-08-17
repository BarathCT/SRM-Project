// Centralized college / institute / department data & helper utilities

// Email domain policies (used in User model & potentially elsewhere)
export const normalCollegeDomains = {
  'SRMIST RAMAPURAM': 'srmist.edu.in',
  'SRM TRICHY': 'srmtrichy.edu.in',
  'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
  'TRP ENGINEERING COLLEGE': 'trp.srmtrichy.edu.in'
};

export const researchAllowedDomains = [
  'srmist.edu.in',
  'srmtrichy.edu.in',
  'eec.srmrmp.edu.in',
  'trp.srmtrichy.edu.in'
];

// Colleges without institutes (direct department assignment)
export const collegesWithoutInstitutes = [
  'EASWARI ENGINEERING COLLEGE',
  'TRP ENGINEERING COLLEGE'
];

// Master structured data (removed 'N/A' departments as they cause validation issues)
export const collegeOptions = [
  { 
    name: 'SRMIST RAMAPURAM',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: ['Mathematics', 'Physics', 'Chemistry', 'English']
      },
      { 
        name: 'Engineering and Technology',
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']
      },
      { 
        name: 'Management',
        departments: ['Business Administration', 'Commerce']
      },
      { 
        name: 'Dental',
        departments: ['General Dentistry', 'Orthodontics']
      },
      { 
        name: 'SRM RESEARCH',
        departments: ['Ramapuram Research']
      }
    ]
  },
  { 
    name: 'SRM TRICHY',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: ['Mathematics', 'Physics', 'Chemistry', 'English']
      },
      { 
        name: 'Engineering and Technology',
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']
      },
      { 
        name: 'SRM RESEARCH',
        departments: ['Trichy Research']
      }
    ]
  },
  { 
    name: 'EASWARI ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']
  },
  { 
    name: 'TRP ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']
  }
];

// Derived convenience constants
export const ALL_COLLEGE_NAMES = collegeOptions.map(c => c.name);

export const collegeRequiresInstitute = (college) =>
  ['SRMIST RAMAPURAM', 'SRM TRICHY'].includes(college);

export const normalizeCollegeName = (college) => {
  if (!college || college === 'N/A') return 'N/A';
  const upper = college.toUpperCase();
  return ALL_COLLEGE_NAMES.find(n => n === upper) || 'N/A';
};

export const getCollegeData = (college) =>
  collegeOptions.find(c => c.name === college) || null;

/**
 * Get list of institutes for a college (returns empty array if none)
 */
export const getInstitutesForCollege = (college) => {
  const data = getCollegeData(college);
  if (!data || !data.hasInstitutes) return [];
  return data.institutes.map(i => i.name);
};

/**
 * Get departments given college & institute (returns empty array if invalid)
 */
export const getDepartments = (college, institute) => {
  const data = getCollegeData(college);
  if (!data) return [];
  if (!data.hasInstitutes) return data.departments;
  if (!institute) return [];
  const inst = data.institutes.find(i => i.name === institute);
  return inst ? inst.departments : [];
};

/**
 * Aggregate unique institute names across colleges
 */
export const getAllInstituteNames = () => {
  const set = new Set();
  collegeOptions.filter(c => c.hasInstitutes).forEach(c => {
    c.institutes.forEach(i => set.add(i.name));
  });
  return [...set];
};

/**
 * Aggregate unique department names across all colleges / institutes
 */
export const getAllDepartmentNames = () => {
  const set = new Set();
  collegeOptions.forEach(c => {
    if (c.hasInstitutes) {
      c.institutes.forEach(i => i.departments.forEach(d => set.add(d)));
    } else {
      c.departments.forEach(d => set.add(d));
    }
  });
  return [...set];
};

/**
 * Validate department coherence
 */
export const isValidDepartmentSelection = (college, institute, department) => {
  if (department === 'N/A') return false; // Explicitly disallow 'N/A' as department
  const list = getDepartments(college, institute);
  return list.includes(department);
};

/**
 * Helper: for SRM RESEARCH institute - enforce allowed colleges
 */
export const isValidResearchSelection = (college, institute) => {
  if (institute !== 'SRM RESEARCH') return true;
  return ['SRMIST RAMAPURAM', 'SRM TRICHY'].includes(college);
};

export const getAllDepartmentsInCollege = (college) => {
  const data = getCollegeData(college);
  if (!data) return [];
  if (!data.hasInstitutes) return data.departments;
  const set = new Set();
  data.institutes.forEach(inst => inst.departments.forEach(dep => set.add(dep)));
  return [...set];
};
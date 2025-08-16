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

// Master structured data
export const collegeOptions = [
  { 
    name: 'SRMIST RAMAPURAM',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: ['Mathematics','Physics','Chemistry','English','N/A']
      },
      { 
        name: 'Engineering and Technology',
        departments: ['Computer Science','Information Technology','Electronics','Mechanical','Civil','N/A']
      },
      { 
        name: 'Management',
        departments: ['Business Administration','Commerce','N/A']
      },
      { 
        name: 'Dental',
        departments: ['General Dentistry','Orthodontics','N/A']
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
        departments: ['Mathematics','Physics','Chemistry','English','N/A']
      },
      { 
        name: 'Engineering and Technology',
        departments: ['Computer Science','Information Technology','Electronics','Mechanical','Civil','N/A']
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
    departments: [
      'Computer Science','Information Technology','Electronics','Mechanical','Civil','N/A'
    ]
  },
  { 
    name: 'TRP ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: [
      'Computer Science','Information Technology','Electronics','Mechanical','Civil','N/A'
    ]
  },
  { 
    name: 'N/A',
    hasInstitutes: false,
    departments: ['N/A']
  }
];

// Derived convenience constants
export const ALL_COLLEGE_NAMES = collegeOptions.map(c => c.name);

export const collegeRequiresInstitute = (college) =>
  ['SRMIST RAMAPURAM','SRM TRICHY'].includes(college);

export const normalizeCollegeName = (college) => {
  if (!college || college === 'N/A') return 'N/A';
  const upper = college.toUpperCase();
  return ALL_COLLEGE_NAMES.find(n => n === upper) || 'N/A';
};

export const getCollegeData = (college) =>
  collegeOptions.find(c => c.name === college) ||
  collegeOptions.find(c => c.name === 'N/A');

/**
 * Get list of institutes for a college (returns ['N/A'] if none)
 */
export const getInstitutesForCollege = (college) => {
  const data = getCollegeData(college);
  if (!data || !data.hasInstitutes) return ['N/A'];
  return [...data.institutes.map(i => i.name), 'N/A'];
};

/**
 * Get departments given college & institute (handles all patterns)
 */
export const getDepartments = (college, institute) => {
  const data = getCollegeData(college);
  if (!data) return ['N/A'];
  if (!data.hasInstitutes) return data.departments;
  if (!institute || institute === 'N/A') return ['N/A'];
  const inst = data.institutes.find(i => i.name === institute);
  return inst ? inst.departments : ['N/A'];
};

/**
 * Aggregate unique institute names across colleges (optionally with 'N/A')
 */
export const getAllInstituteNames = (includeNA = true) => {
  const set = new Set();
  collegeOptions.filter(c => c.hasInstitutes).forEach(c => {
    c.institutes.forEach(i => set.add(i.name));
  });
  if (includeNA) set.add('N/A');
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
  const list = getDepartments(college, institute);
  return list.includes(department);
};

/**
 * Helper: for SRM RESEARCH institute - enforce allowed colleges
 */
export const isValidResearchSelection = (college, institute) => {
  if (institute !== 'SRM RESEARCH') return true;
  return ['SRMIST RAMAPURAM','SRM TRICHY'].includes(college);
};
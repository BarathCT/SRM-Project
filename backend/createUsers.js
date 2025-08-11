import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js'; // Adjust path as needed

dotenv.config();

const COLLEGE_CONFIG = [
  {
    name: 'SRMIST RAMAPURAM',
    emailDomain: 'srmist.edu.in',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities', 
        departments: ['Physics', 'Chemistry', 'Mathematics', 'English'] 
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
    emailDomain: 'srmtrichy.edu.in',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities', 
        departments: ['Physics', 'Chemistry', 'Mathematics', 'English'] 
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
    emailDomain: 'eec.srmrmp.edu.in',
    hasInstitutes: false,
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']
  },
  {
    name: 'TRP ENGINEERING COLLEGE',
    emailDomain: 'trp.srmtrichy.edu.in',
    hasInstitutes: false,
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']
  }
];

// Helper functions for generating sample Author IDs
const generateScopusId = () => {
  // Generate 10-11 digit Scopus ID
  const length = Math.random() > 0.5 ? 10 : 11;
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

const generateSciId = () => {
  // Generate SCI ID in format A-1234-5678
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num1 = Math.floor(Math.random() * 9000) + 1000; // 4 digits
  const num2 = Math.floor(Math.random() * 9000) + 1000; // 4 digits
  return `${letter}-${num1}-${num2}`;
};

const generateWebOfScienceId = () => {
  // Generate Web of Science ID in format A-1234-5678 (same format as SCI)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num1 = Math.floor(Math.random() * 9000) + 1000; // 4 digits
  const num2 = Math.floor(Math.random() * 9000) + 1000; // 4 digits
  return `${letter}-${num1}-${num2}`;
};

// Function to randomly assign Author IDs to faculty (some will have none, some partial, some all)
const generateAuthorIds = (facultyIndex) => {
  const authorId = {
    scopus: null,
    sci: null,
    webOfScience: null
  };

  // Distribution strategy:
  // 30% - No Author IDs (new faculty/those who haven't set up yet)
  // 25% - Only Scopus
  // 20% - Only Scopus + SCI
  // 15% - Only Scopus + Web of Science
  // 10% - All three IDs
  
  const random = Math.random();
  
  if (random < 0.30) {
    // 30% - No Author IDs (represents faculty who need to add them before uploading papers)
    return authorId;
  } else if (random < 0.55) {
    // 25% - Only Scopus
    authorId.scopus = generateScopusId();
  } else if (random < 0.75) {
    // 20% - Scopus + SCI
    authorId.scopus = generateScopusId();
    authorId.sci = generateSciId();
  } else if (random < 0.90) {
    // 15% - Scopus + Web of Science
    authorId.scopus = generateScopusId();
    authorId.webOfScience = generateWebOfScienceId();
  } else {
    // 10% - All three
    authorId.scopus = generateScopusId();
    authorId.sci = generateSciId();
    authorId.webOfScience = generateWebOfScienceId();
  }

  return authorId;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    console.log('🗑️  Existing users cleared');

    // Password hashing function
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 12);
    };

    // Generate unique faculty IDs
    let facultyIdx = 1;
    const generateFacultyId = () => `FAC-${String(facultyIdx++).padStart(4, '0')}`;

    // Email counter per domain to ensure unique emails
    const emailCounters = {};
    const getUniqueEmail = (prefix, domain) => {
      const key = `${prefix}@${domain}`;
      emailCounters[key] = (emailCounters[key] || 0) + 1;
      return `${prefix}${emailCounters[key]}@${domain}`;
    };

    // 3 Super Admins (no Author IDs needed)
    const users = [
      {
        fullName: 'Super Admin 1',
        facultyId: 'N/A',
        email: 'superadmin1@srmist.edu.in',
        password: await hashPassword('superadmin123'),
        role: 'super_admin',
        college: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        createdBy: null,
        authorId: {
          scopus: null,
          sci: null,
          webOfScience: null
        }
      },
      {
        fullName: 'Super Admin 2',
        facultyId: 'N/A',
        email: 'superadmin2@srmist.edu.in',
        password: await hashPassword('superadmin123'),
        role: 'super_admin',
        college: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        createdBy: null,
        authorId: {
          scopus: null,
          sci: null,
          webOfScience: null
        }
      },
      {
        fullName: 'Super Admin 3',
        facultyId: 'N/A',
        email: 'superadmin3@srmist.edu.in',
        password: await hashPassword('superadmin123'),
        role: 'super_admin',
        college: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        createdBy: null,
        authorId: {
          scopus: null,
          sci: null,
          webOfScience: null
        }
      }
    ];

    // Campus Admins (no Author IDs needed - they don't upload papers)
    for (const college of COLLEGE_CONFIG) {
      if (college.hasInstitutes) {
        // For colleges with institutes: One campus admin per institute
        for (const institute of college.institutes) {
          users.push({
            fullName: `${institute.name} Campus Admin`,
            facultyId: generateFacultyId(),
            email: getUniqueEmail('campusadmin', college.emailDomain),
            password: await hashPassword('campusadmin123'),
            role: 'campus_admin',
            college: college.name,
            institute: institute.name,
            department: institute.departments[0],
            createdBy: null,
            authorId: {
              scopus: null,
              sci: null,
              webOfScience: null
            }
          });
        }
      } else {
        // For colleges without institutes: One campus admin for the entire college
        users.push({
          fullName: `${college.name} Campus Admin`,
          facultyId: generateFacultyId(),
          email: getUniqueEmail('campusadmin', college.emailDomain),
          password: await hashPassword('campusadmin123'),
          role: 'campus_admin',
          college: college.name,
          institute: 'N/A',
          department: 'N/A',
          createdBy: null,
          authorId: {
            scopus: null,
            sci: null,
            webOfScience: null
          }
        });
      }
    }

    // Calculate total departments for faculty distribution
    let totalDepartments = 0;
    for (const college of COLLEGE_CONFIG) {
      if (college.hasInstitutes) {
        for (const institute of college.institutes) {
          totalDepartments += institute.departments.length;
        }
      } else {
        totalDepartments += college.departments.length;
      }
    }

    console.log(`📊 Total departments across all colleges: ${totalDepartments}`);
    console.log(`👥 Target: 850 faculty (170 departments × 5 faculty each)`);
    
    // Faculty: Calculate how many faculty per department to reach 850 total
    const targetFacultyTotal = 850;
    const facultyPerDepartment = Math.ceil(targetFacultyTotal / totalDepartments);
    
    console.log(`📈 Creating ${facultyPerDepartment} faculty per department to reach target`);

    let facultyCount = 0;
    let facultyIndex = 0; // For tracking Author ID distribution

    for (const college of COLLEGE_CONFIG) {
      if (college.hasInstitutes) {
        // Colleges with institutes
        for (const institute of college.institutes) {
          for (const department of institute.departments) {
            // Create calculated number of faculty members for each department
            for (let i = 1; i <= facultyPerDepartment; i++) {
              if (facultyCount < targetFacultyTotal) {
                users.push({
                  fullName: `${department} Faculty ${i}`,
                  facultyId: generateFacultyId(),
                  email: getUniqueEmail('faculty', college.emailDomain),
                  password: await hashPassword('faculty1234'),
                  role: 'faculty',
                  college: college.name,
                  institute: institute.name,
                  department: department,
                  createdBy: null,
                  authorId: generateAuthorIds(facultyIndex) // Generate Author IDs for faculty
                });
                facultyCount++;
                facultyIndex++;
              }
            }
          }
        }
      } else {
        // Colleges without institutes (direct departments)
        for (const department of college.departments) {
          // Create calculated number of faculty members for each department
          for (let i = 1; i <= facultyPerDepartment; i++) {
            if (facultyCount < targetFacultyTotal) {
              users.push({
                fullName: `${department} Faculty ${i}`,
                facultyId: generateFacultyId(),
                email: getUniqueEmail('faculty', college.emailDomain),
                password: await hashPassword('faculty1234'),
                role: 'faculty',
                college: college.name,
                institute: 'N/A',
                department: department,
                createdBy: null,
                authorId: generateAuthorIds(facultyIndex) // Generate Author IDs for faculty
              });
              facultyCount++;
              facultyIndex++;
            }
          }
        }
      }
    }

    // Add additional faculty to reach exactly 850 if needed
    while (facultyCount < targetFacultyTotal) {
      // Distribute remaining faculty across departments
      for (const college of COLLEGE_CONFIG) {
        if (facultyCount >= targetFacultyTotal) break;
        
        if (college.hasInstitutes) {
          for (const institute of college.institutes) {
            if (facultyCount >= targetFacultyTotal) break;
            for (const department of institute.departments) {
              if (facultyCount >= targetFacultyTotal) break;
              
              const existingCount = users.filter(u => 
                u.role === 'faculty' && 
                u.college === college.name && 
                u.institute === institute.name && 
                u.department === department
              ).length;
              
              users.push({
                fullName: `${department} Faculty ${existingCount + 1}`,
                facultyId: generateFacultyId(),
                email: getUniqueEmail('faculty', college.emailDomain),
                password: await hashPassword('faculty1234'),
                role: 'faculty',
                college: college.name,
                institute: institute.name,
                department: department,
                createdBy: null,
                authorId: generateAuthorIds(facultyIndex)
              });
              facultyCount++;
              facultyIndex++;
            }
          }
        } else {
          for (const department of college.departments) {
            if (facultyCount >= targetFacultyTotal) break;
            
            const existingCount = users.filter(u => 
              u.role === 'faculty' && 
              u.college === college.name && 
              u.department === department
            ).length;
            
            users.push({
              fullName: `${department} Faculty ${existingCount + 1}`,
              facultyId: generateFacultyId(),
              email: getUniqueEmail('faculty', college.emailDomain),
              password: await hashPassword('faculty1234'),
              role: 'faculty',
              college: college.name,
              institute: 'N/A',
              department: department,
              createdBy: null,
              authorId: generateAuthorIds(facultyIndex)
            });
            facultyCount++;
            facultyIndex++;
          }
        }
      }
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Successfully created ${createdUsers.length} test users`);

    // Display summary statistics
    console.log('\n📊 User Creation Summary:');
    console.log('========================');
    
    const summary = {
      super_admin: createdUsers.filter(u => u.role === 'super_admin').length,
      campus_admin: createdUsers.filter(u => u.role === 'campus_admin').length,
      faculty: createdUsers.filter(u => u.role === 'faculty').length
    };
    
    console.log(`Super Admins: ${summary.super_admin}`);
    console.log(`Campus Admins: ${summary.campus_admin}`);
    console.log(`Faculty: ${summary.faculty}`);
    console.log(`Total Users: ${createdUsers.length}`);

    // Author ID Distribution Statistics
    console.log('\n🆔 Author ID Distribution for Faculty:');
    console.log('======================================');
    
    const facultyUsers = createdUsers.filter(u => u.role === 'faculty');
    let noAuthorIds = 0;
    let onlyScopus = 0;
    let scopusAndSci = 0;
    let scopusAndWos = 0;
    let allThree = 0;
    let partial = 0;

    facultyUsers.forEach(user => {
      const hasScope = !!user.authorId.scopus;
      const hasSci = !!user.authorId.sci;
      const hasWos = !!user.authorId.webOfScience;
      
      if (!hasScope && !hasSci && !hasWos) {
        noAuthorIds++;
      } else if (hasScope && !hasSci && !hasWos) {
        onlyScopus++;
      } else if (hasScope && hasSci && !hasWos) {
        scopusAndSci++;
      } else if (hasScope && !hasSci && hasWos) {
        scopusAndWos++;
      } else if (hasScope && hasSci && hasWos) {
        allThree++;
      } else {
        partial++;
      }
    });

    console.log(`No Author IDs: ${noAuthorIds} (${((noAuthorIds/facultyUsers.length)*100).toFixed(1)}%)`);
    console.log(`Only Scopus: ${onlyScopus} (${((onlyScopus/facultyUsers.length)*100).toFixed(1)}%)`);
    console.log(`Scopus + SCI: ${scopusAndSci} (${((scopusAndSci/facultyUsers.length)*100).toFixed(1)}%)`);
    console.log(`Scopus + Web of Science: ${scopusAndWos} (${((scopusAndWos/facultyUsers.length)*100).toFixed(1)}%)`);
    console.log(`All Three IDs: ${allThree} (${((allThree/facultyUsers.length)*100).toFixed(1)}%)`);
    console.log(`Other Combinations: ${partial} (${((partial/facultyUsers.length)*100).toFixed(1)}%)`);

    console.log('\n⚠️  Important Notes:');
    console.log('===================');
    console.log(`• ${noAuthorIds} faculty members have no Author IDs and will need to add at least one before uploading papers`);
    console.log('• Faculty can update their Author IDs after login through their profile');
    console.log('• At least one Author ID (Scopus, SCI, or Web of Science) is required to upload papers');

    // Verify target numbers
    console.log('\n🎯 Target Verification:');
    console.log('======================');
    console.log(`✅ Super Admins: ${summary.super_admin}/3 ${summary.super_admin === 3 ? '✓' : '✗'}`);
    console.log(`✅ Campus Admins: ${summary.campus_admin}/10 ${summary.campus_admin === 10 ? '✓' : '✗'}`);
    console.log(`✅ Faculty: ${summary.faculty}/850 ${summary.faculty === 850 ? '✓' : '✗'}`);
    console.log(`✅ Total: ${createdUsers.length}/863 ${createdUsers.length === 863 ? '✓' : '✗'}`);

    // Display breakdown by college
    console.log('\n🏫 Users by College:');
    console.log('====================');
    
    for (const college of COLLEGE_CONFIG) {
      const collegeUsers = createdUsers.filter(u => u.college === college.name);
      console.log(`\n${college.name}:`);
      console.log(`  Total: ${collegeUsers.length} users`);
      
      // Show campus admins for this college
      const campusAdmins = collegeUsers.filter(u => u.role === 'campus_admin');
      console.log(`  Campus Admins: ${campusAdmins.length}`);
      campusAdmins.forEach(admin => {
        if (college.hasInstitutes) {
          console.log(`    - ${admin.fullName} (${admin.institute})`);
        } else {
          console.log(`    - ${admin.fullName} (Overall College Management)`);
        }
      });
      
      // Show faculty count with Author ID status
      const facultyUsers = collegeUsers.filter(u => u.role === 'faculty');
      const facultyWithAuthorIds = facultyUsers.filter(u => 
        u.authorId.scopus || u.authorId.sci || u.authorId.webOfScience
      );
      console.log(`  Faculty: ${facultyUsers.length} (${facultyWithAuthorIds.length} with Author IDs)`);
    }

    // Set createdBy: all users except super_admin are created by super_admin
    const superAdmins = createdUsers.filter(u => u.role === 'super_admin');
    const firstSuperAdmin = superAdmins[0];
    if (firstSuperAdmin) {
      await User.updateMany(
        { _id: { $ne: firstSuperAdmin._id }, role: { $ne: 'super_admin' } },
        { $set: { createdBy: firstSuperAdmin._id } }
      );
      console.log('\n🔗 Updated createdBy references (all non-super-admin users created by first super_admin)');
    }

    // Sample Author IDs for testing
    console.log('\n📋 Sample Faculty with Author IDs (for testing):');
    console.log('================================================');
    const sampleFaculty = facultyUsers.filter(u => 
      u.authorId.scopus || u.authorId.sci || u.authorId.webOfScience
    ).slice(0, 5);
    
    sampleFaculty.forEach(faculty => {
      console.log(`${faculty.email}:`);
      console.log(`  Name: ${faculty.fullName}`);
      console.log(`  Faculty ID: ${faculty.facultyId}`);
      console.log(`  Scopus: ${faculty.authorId.scopus || 'Not set'}`);
      console.log(`  SCI: ${faculty.authorId.sci || 'Not set'}`);
      console.log(`  Web of Science: ${faculty.authorId.webOfScience || 'Not set'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

run();
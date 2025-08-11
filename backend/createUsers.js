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

    // 3 Super Admins
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
        createdBy: null
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
        createdBy: null
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
        createdBy: null
      }
    ];

    // Campus Admins (unchanged - keeping original structure)
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
            department: institute.departments[0], // Assign to first department of the institute
            createdBy: null
          });
        }
      } else {
        // For colleges without institutes: One campus admin for the entire college
        // No institute or department assignment - they manage the whole college
        users.push({
          fullName: `${college.name} Campus Admin`,
          facultyId: generateFacultyId(),
          email: getUniqueEmail('campusadmin', college.emailDomain),
          password: await hashPassword('campusadmin123'),
          role: 'campus_admin',
          college: college.name,
          institute: 'N/A', // No institute for colleges without institutes
          department: 'N/A', // No specific department - manages entire college
          createdBy: null
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
    const targetFacultyTotal = 850; // 170 × 5
    const facultyPerDepartment = Math.ceil(targetFacultyTotal / totalDepartments);
    
    console.log(`📈 Creating ${facultyPerDepartment} faculty per department to reach target`);

    let facultyCount = 0;
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
                  createdBy: null
                });
                facultyCount++;
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
                institute: 'N/A', // No institute for these colleges
                department: department,
                createdBy: null
              });
              facultyCount++;
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
                createdBy: null
              });
              facultyCount++;
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
              createdBy: null
            });
            facultyCount++;
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
      
      // Show faculty count
      const facultyUsers = collegeUsers.filter(u => u.role === 'faculty');
      console.log(`  Faculty: ${facultyUsers.length}`);
      
      if (college.hasInstitutes) {
        for (const institute of college.institutes) {
          const instituteUsers = collegeUsers.filter(u => u.institute === institute.name);
          const instituteFaculty = instituteUsers.filter(u => u.role === 'faculty');
          console.log(`  ${institute.name}: ${instituteFaculty.length} faculty`);
          
          for (const department of institute.departments) {
            const deptUsers = instituteFaculty.filter(u => u.department === department);
            console.log(`    ${department}: ${deptUsers.length} faculty`);
          }
        }
      } else {
        console.log(`  Faculty by Department:`);
        for (const department of college.departments) {
          const deptUsers = facultyUsers.filter(u => u.department === department);
          console.log(`    ${department}: ${deptUsers.length} faculty`);
        }
      }
    }

    // Display super admin details
    console.log('\n👑 Super Admin Details:');
    console.log('=======================');
    const superAdmins = createdUsers.filter(u => u.role === 'super_admin');
    superAdmins.forEach(admin => {
      console.log(`${admin.email.padEnd(35)} | ${admin.fullName}`);
    });

    // Display campus admin details
    console.log('\n🏢 Campus Admin Details:');
    console.log('========================');
    const campusAdmins = createdUsers.filter(u => u.role === 'campus_admin');
    campusAdmins.forEach(admin => {
      console.log(`${admin.email.padEnd(35)} | ${admin.college.padEnd(25)} | ${admin.institute.padEnd(20)} | ${admin.department}`);
    });

    // Display faculty distribution summary
    console.log('\n📊 Faculty Distribution Summary:');
    console.log('===============================');
    const facultyUsers = createdUsers.filter(u => u.role === 'faculty');
    const facultyByCollege = {};
    
    facultyUsers.forEach(user => {
      if (!facultyByCollege[user.college]) {
        facultyByCollege[user.college] = 0;
      }
      facultyByCollege[user.college]++;
    });
    
    Object.entries(facultyByCollege).forEach(([college, count]) => {
      console.log(`${college}: ${count} faculty`);
    });

    // Set createdBy: all users except super_admin are created by super_admin
    const firstSuperAdmin = superAdmins[0];
    if (firstSuperAdmin) {
      await User.updateMany(
        { _id: { $ne: firstSuperAdmin._id }, role: { $ne: 'super_admin' } },
        { $set: { createdBy: firstSuperAdmin._id } }
      );
      console.log('\n🔗 Updated createdBy references (all non-super-admin users created by first super_admin)');
    }

    // Final department count verification
    console.log('\n🔍 Department Distribution Verification:');
    console.log('=======================================');
    
    const facultyByDept = {};
    facultyUsers.forEach(user => {
      const key = `${user.college} | ${user.institute} | ${user.department}`;
      facultyByDept[key] = (facultyByDept[key] || 0) + 1;
    });
    
    console.log(`Total departments with faculty: ${Object.keys(facultyByDept).length}`);
    Object.entries(facultyByDept)
      .sort(([,a], [,b]) => b - a)
      .forEach(([dept, count]) => {
        console.log(`${dept}: ${count} faculty`);
      });

    // Email distribution check
    console.log('\n📧 Email Distribution Check:');
    console.log('===========================');
    Object.entries(emailCounters).forEach(([email, count]) => {
      console.log(`${email}: ${count} users`);
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
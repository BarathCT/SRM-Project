import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import {
  collegeOptions,
  collegesWithoutInstitutes,
  normalCollegeDomains
} from './utils/collegeData.js';

dotenv.config();

// Configuration
const COLLEGE_CONFIG = collegeOptions.filter(c => c.name !== 'N/A');
const BATCH_SIZE = 100;
const TARGET_FACULTY_TOTAL = 850;

// Pre-calculate college data
const collegeDataMap = new Map();
for (const college of COLLEGE_CONFIG) {
  const departments = college.hasInstitutes
    ? college.institutes.flatMap(inst => inst.departments)
    : college.departments;
  collegeDataMap.set(college.name, {
    ...college,
    allDepartments: departments,
    departmentCount: departments.length
  });
}

// Helper functions
const getEmailDomain = (collegeName) => {
  const domain = normalCollegeDomains[collegeName];
  if (!domain) throw new Error(`No email domain for college: ${collegeName}`);
  return domain;
};

const generateScopusId = () => Math.floor(Math.random() * 1e11).toString().padStart(10, '0');
const generateSciId = () => `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateWebOfScienceId = () => generateSciId();

const generateAuthorIds = () => {
  const random = Math.random();
  const authorId = { scopus: null, sci: null, webOfScience: null };

  if (random < 0.30) return authorId;
  authorId.scopus = generateScopusId();
  if (random < 0.55) return authorId;
  if (random < 0.75) authorId.sci = generateSciId();
  else if (random < 0.90) authorId.webOfScience = generateWebOfScienceId();
  else {
    authorId.sci = generateSciId();
    authorId.webOfScience = generateWebOfScienceId();
  }
  return authorId;
};

// Batch processing with logging
const createUsersInBatches = async (users) => {
  const batches = [];
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    batches.push(users.slice(i, i + BATCH_SIZE));
  }

  let createdCount = 0;
  for (const batch of batches) {
    try {
      const result = await User.insertMany(batch, { ordered: false });
      createdCount += result.length;
      console.log(`✅ Inserted batch: ${result.length} users (Total: ${createdCount})`);
    } catch (batchError) {
      if (batchError.writeErrors) {
        console.error(`❌ Partial batch failure: ${batchError.writeErrors.length} errors`);
        batchError.writeErrors.forEach(err => {
          console.error(`  - Error ${err.index}: ${err.errmsg}`);
        });
      } else {
        console.error('❌ Batch error:', batchError.message);
      }
    }
  }
  return createdCount;
};

const run = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    console.log('Connected to MongoDB');

    console.log('Clearing existing users...');
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Generate users in memory
    const users = [];
    const hashPassword = async (password) => await bcrypt.hash(password, 12);
    let facultyIdx = 1;
    const generateFacultyId = () => `FAC-${String(facultyIdx++).padStart(4, '0')}`;

    // Email counter
    const emailCounters = new Map();
    const getUniqueEmail = (prefix, domain) => {
      const key = `${prefix}@${domain}`;
      const count = (emailCounters.get(key) || 0) + 1;
      emailCounters.set(key, count);
      return `${prefix}${count}@${domain}`;
    };

    // 1. Create Super Admins
    for (let i = 1; i <= 3; i++) {
      const user = {
        fullName: `Super Admin ${i}`,
        facultyId: 'N/A',
        email: `superadmin${i}@srmist.edu.in`,
        password: await hashPassword('superadmin123'),
        role: 'super_admin',
        college: 'N/A',
        institute: 'N/A',
        department: 'N/A',
        createdBy: null,
        authorId: { scopus: null, sci: null, webOfScience: null }
      };
      users.push(user);
      console.log(`👤 Created Super Admin ${i}: ${user.email}`);
    }

    // 2. Create Campus Admins with proper department handling
    for (const college of COLLEGE_CONFIG) {
      const collegeData = collegeDataMap.get(college.name);
      const emailDomain = getEmailDomain(college.name);

      if (college.hasInstitutes) {
        // For colleges WITH institutes - create one admin per institute
        for (const institute of college.institutes) {
          const user = {
            fullName: `${institute.name} Campus Admin`,
            facultyId: generateFacultyId(),
            email: getUniqueEmail('campusadmin', emailDomain),
            password: await hashPassword('campusadmin123'),
            role: 'campus_admin',
            college: college.name,
            institute: institute.name,
            department: 'N/A',
            createdBy: null,
            authorId: { scopus: null, sci: null, webOfScience: null }
          };
          users.push(user);
          console.log(`👤 Created Campus Admin for ${college.name} - ${institute.name}: ${user.email}`);
        }
      } else {
        // For colleges WITHOUT institutes - create one admin for the college
        const user = {
          fullName: `${college.name} Campus Admin`,
          facultyId: generateFacultyId(),
          email: getUniqueEmail('campusadmin', emailDomain),
          password: await hashPassword('campusadmin123'),
          role: 'campus_admin',
          college: college.name,
          institute: 'N/A',
          department: 'N/A',
          createdBy: null,
          authorId: { scopus: null, sci: null, webOfScience: null }
        };
        users.push(user);
        console.log(`👤 Created Campus Admin for ${college.name}: ${user.email}`);
      }
    }

    // 3. Create Faculty Members with proper college/institute/department relationships
    const totalDepartments = Array.from(collegeDataMap.values()).reduce(
      (sum, college) => sum + college.departmentCount, 0
    );
    const facultyPerDept = Math.ceil(TARGET_FACULTY_TOTAL / totalDepartments);

    console.log(`📊 Creating ~${facultyPerDept} faculty per department (${totalDepartments} departments)`);

    for (const [collegeName, collegeData] of collegeDataMap) {
      const emailDomain = getEmailDomain(collegeName);
      
      if (collegeData.hasInstitutes) {
        // For colleges WITH institutes
        for (const institute of collegeData.institutes) {
          for (const department of institute.departments) {
            for (let i = 1; i <= facultyPerDept && users.length < 3 + COLLEGE_CONFIG.length + TARGET_FACULTY_TOTAL; i++) {
              const user = {
                fullName: `${department} Faculty ${i}`,
                facultyId: generateFacultyId(),
                email: getUniqueEmail('faculty', emailDomain),
                password: await hashPassword('faculty1234'),
                role: 'faculty',
                college: collegeName,
                institute: institute.name,
                department,
                createdBy: null,
                authorId: generateAuthorIds()
              };
              users.push(user);
              console.log(`👤 Created Faculty ${users.length - 3 - COLLEGE_CONFIG.length}/${TARGET_FACULTY_TOTAL}: ${user.email} (${collegeName} - ${institute.name} - ${department})`);
            }
          }
        }

        
      } else {
        // For colleges WITHOUT institutes
        for (const department of collegeData.departments) {
          for (let i = 1; i <= facultyPerDept && users.length < 3 + COLLEGE_CONFIG.length + TARGET_FACULTY_TOTAL; i++) {
            const user = {
              fullName: `${department} Faculty ${i}`,
              facultyId: generateFacultyId(),
              email: getUniqueEmail('faculty', emailDomain),
              password: await hashPassword('faculty1234'),
              role: 'faculty',
              college: collegeName,
              institute: 'N/A',
              department,
              createdBy: null,
              authorId: generateAuthorIds()
            };
            users.push(user);
            console.log(`👤 Created Faculty ${users.length - 3 - COLLEGE_CONFIG.length}/${TARGET_FACULTY_TOTAL}: ${user.email} (${collegeName} - ${department})`);
          }
        }
      }
    }

    // 4. Insert users in batches
    console.log('⏳ Inserting users in batches...');
    const createdCount = await createUsersInBatches(users);
    
    // 5. Set createdBy references
    const firstSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (firstSuperAdmin) {
      console.log('⏳ Updating createdBy references...');
      await User.updateMany(
        { _id: { $ne: firstSuperAdmin._id }, role: { $ne: 'super_admin' } },
        { $set: { createdBy: firstSuperAdmin._id } }
      );
      console.log('🔗 Updated createdBy references');
    }

    // 6. Generate summary
    const summary = {
      super_admin: await User.countDocuments({ role: 'super_admin' }),
      campus_admin: await User.countDocuments({ role: 'campus_admin' }),
      faculty: await User.countDocuments({ role: 'faculty' })
    };

    console.log('\n📊 Final Summary:');
    console.log('================');
    console.log(`Super Admins: ${summary.super_admin}`);
    console.log(`Campus Admins: ${summary.campus_admin}`);
    console.log(`Faculty: ${summary.faculty}`);
    console.log(`Total Users: ${createdCount}`);

    // Sample faculty with author IDs
    const sampleFaculty = await User.find({ role: 'faculty', $or: [
      { 'authorId.scopus': { $ne: null } },
      { 'authorId.sci': { $ne: null } },
      { 'authorId.webOfScience': { $ne: null } }
    ]}).limit(5);
    
    console.log('\n🔍 Sample Faculty with Author IDs:');
    sampleFaculty.forEach(user => {
      console.log(`📌 ${user.email}:`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Scopus: ${user.authorId.scopus || 'None'}`);
      console.log(`   SCI: ${user.authorId.sci || 'None'}`);
      console.log(`   Web of Science: ${user.authorId.webOfScience || 'None'}`);
    });

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('Stack Trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

run();
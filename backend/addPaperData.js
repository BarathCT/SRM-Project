import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './models/Paper.js';       // <-- uses backend/models/Paper.js
import User from './models/User.js';         // <-- to find faculty users only

dotenv.config();

// -------- configuration --------
const RESET_PAPERS = true;       // set false if you don't want to clear the collection
const MIN_PAPERS = 2;           // minimum mock papers per faculty
const MAX_PAPERS = 8;           // maximum mock papers per faculty
// --------------------------------

const sampleJournals = [
  { journal: 'International Journal of Computer Science', publisher: 'Springer' },
  { journal: 'IEEE Access', publisher: 'IEEE' },
  { journal: 'ACM Transactions on Software Engineering', publisher: 'ACM' },
  { journal: 'Journal of Information Security', publisher: 'Elsevier' },
  { journal: 'Scientific Reports', publisher: 'Nature Portfolio' },
  { journal: 'Machine Learning and Applications', publisher: 'Wiley' }
];

const coAuthorPool = [
  'Bharath K', 'Priya S', 'Rahul M', 'Meera N', 'Karthik P', 'Divya R',
  'Arun V', 'Sneha T', 'Vikram J', 'Nisha L', 'Harish B', 'Anjali C'
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function buildPublication(type) {
  switch (type) {
    case 'scopus':
      return { type, id: String(randomInt(10_000_000_000, 99_999_999_999)) };
    case 'sci':
      return { type, id: `SCI-${randomInt(100000, 999999)}` };
    case 'webOfScience':
      return { type, id: `WOS:${randomInt(1000000, 9999999)}` };
    case 'pubmed':
      return { type, id: String(randomInt(1_000_000, 9_999_999)) };
    case 'abdc':
      return { type, id: `ABDC-${randomInt(1000, 9999)}` };
    default:
      return { type: 'scopus', id: String(randomInt(10_000_000_000, 99_999_999_999)) };
  }
}

function uniqueDoi(facultyId, year, index) {
  const safeId = (facultyId || 'FAC-XXX').replace(/[^A-Za-z0-9]+/g, '');
  return `10.5555/${safeId}.${year}.${index + 1}`;
}

function makeAuthors(facultyName) {
  const authorCount = randomInt(2, 4);
  const pool = coAuthorPool.filter(n => n !== facultyName);
  const authors = [{ name: facultyName, isCorresponding: Math.random() < 0.5 }];
  while (authors.length < authorCount) {
    const n = pick(pool);
    if (!authors.find(a => a.name === n)) authors.push({ name: n, isCorresponding: false });
  }
  if (!authors.some(a => a.isCorresponding)) {
    authors[randomInt(0, authors.length - 1)].isCorresponding = true;
  }
  return authors;
}

function makeStudentScholars(maybe) {
  if (!maybe) return { isStudentScholar: 'no', studentScholars: [] };
  const count = randomInt(1, 2);
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      name: pick(coAuthorPool),
      id: `STU-${randomInt(100000, 999999)}`
    });
  }
  return { isStudentScholar: 'yes', studentScholars: list };
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to MongoDB');

    if (RESET_PAPERS) {
      await Paper.deleteMany({});
      console.log('  Cleared existing papers');
    }

    const faculties = await User.find({ role: 'faculty', facultyId: { $exists: true, $ne: 'N/A' } }).lean();
    if (!faculties.length) {
      console.log('  No faculty users found. Seed users first.');
      return;
    }
    console.log(` Found ${faculties.length} faculty accounts`);

    const docs = [];
    for (const fac of faculties) {
      const facultyName = fac.fullName || 'Faculty Member';
      const facultyId = fac.facultyId || 'FAC-000';
      const papersForThis = randomInt(MIN_PAPERS, MAX_PAPERS);
      console.log(` Generating ${papersForThis} papers for ${facultyName} (${facultyId})`);
      for (let i = 0; i < papersForThis; i++) {
        const year = randomInt(2020, 2025);
        const { journal, publisher } = pick(sampleJournals);
        const pub = buildPublication(pick(['scopus', 'sci', 'webOfScience', 'pubmed', 'abdc']));
        const authors = makeAuthors(facultyName);
        const claimedByObj = pick(authors);
        const claimedBy = claimedByObj.name;
        const correspondingIndex = authors.findIndex(a => a.isCorresponding);
        const authorNo = Math.random() < 0.25 && correspondingIndex >= 0 ? 'C' : String(randomInt(1, authors.length));
        const withStudents = Math.random() < 0.3 ? makeStudentScholars(true) : { isStudentScholar: 'no', studentScholars: [] };

        const titleCore = [
          'AI-Driven', 'Optimization of', 'A Study on', 'Analysis of', 'Design and Evaluation of', 'Benchmarking'
        ];
        const domain = [
          'Distributed Systems', 'Deep Neural Networks', 'IoT Edge Devices', 'Cybersecurity Protocols',
          'Microservices', 'Recommender Systems', 'Data Pipelines'
        ];

        const doc = {
          authors,
          title: `${pick(titleCore)} ${pick(domain)}`,
          journal,
          publisher,
          volume: String(randomInt(1, 50)),
          issue: String(randomInt(1, 12)),
          pageNo: `${randomInt(1, 50)}-${randomInt(51, 120)}`,
          doi: uniqueDoi(facultyId, year, i),
          publicationType: pub.type,
          facultyId,
          publicationId: pub.id,
          year,
          claimedBy,
          authorNo,
          isStudentScholar: withStudents.isStudentScholar,
          studentScholars: withStudents.studentScholars,
          qRating: pick(['Q1', 'Q2', 'Q3', 'Q4']),
          typeOfIssue: Math.random() < 0.3 ? 'Special Issue' : 'Regular Issue'
        };

        docs.push(doc);
      }
    }

    if (!docs.length) {
      console.log('Nothing to insert.');
      return;
    }

    const created = await Paper.insertMany(docs, { ordered: false });
    console.log(` Inserted ${created.length} paper documents`);

    console.log('\nExample inserted doc:');
    const one = created[0];
    console.log({
      title: one.title,
      facultyId: one.facultyId,
      year: one.year,
      doi: one.doi,
      qRating: one.qRating,
      publicationType: one.publicationType
    });

  } catch (err) {
    console.error(' Error seeding papers:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(' Disconnected from MongoDB');
  }
}

run();

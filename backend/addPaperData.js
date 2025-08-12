import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './models/Paper.js';
import User from './models/User.js';

dotenv.config();

// -------- configuration --------
const RESET_PAPERS = true;       // set false if you don't want to clear the collection
const MIN_PAPERS = 11;          // minimum mock papers per user
const MAX_PAPERS = 18;          // maximum mock papers per user
// --------------------------------

// Academic publishers
const PUBLISHERS = [
  'Springer', 'Elsevier', 'IEEE', 'ACM', 'Wiley', 'Nature Portfolio', 
  'Taylor & Francis', 'SAGE Publications', 'Oxford University Press', 
  'Cambridge University Press', 'Hindawi', 'MDPI', 'IOP Publishing',
  'American Chemical Society', 'Royal Society of Chemistry', 'JMLR',
  'AI Access Foundation', 'MIT Press', 'World Scientific', 'Academic Press'
];

// EXACT Subject Areas and Categories that match your schema validation
const SUBJECT_AREAS = {
  "Agricultural and Biological Sciences": [
    "Agronomy and Crop Science",
    "Animal Science and Zoology",
    "Aquatic Science",
    "Ecology, Evolution, Behavior and Systematics",
    "Food Science",
    "Forestry",
    "Horticulture",
    "Insect Science",
    "Plant Science",
    "Soil Science",
    "Agricultural and Biological Sciences (miscellaneous)"
  ],
  "Arts and Humanities": [
    "Archeology",
    "Arts and Humanities (miscellaneous)",
    "Classics",
    "Conservation",
    "History",
    "History and Philosophy of Science",
    "Language and Linguistics",
    "Literature and Literary Theory",
    "Music",
    "Philosophy",
    "Religious Studies",
    "Visual Arts and Performing Arts"
  ],
  "Biochemistry, Genetics and Molecular Biology": [
    "Aging",
    "Biochemistry",
    "Biochemistry, Genetics and Molecular Biology (miscellaneous)",
    "Biophysics",
    "Biotechnology",
    "Cancer Research",
    "Cell Biology",
    "Clinical Biochemistry",
    "Developmental Biology",
    "Endocrinology",
    "Genetics",
    "Molecular Biology",
    "Molecular Medicine",
    "Structural Biology"
  ],
  "Business, Management and Accounting": [
    "Accounting",
    "Business and International Management",
    "Business, Management and Accounting (miscellaneous)",
    "Industrial and Manufacturing Engineering",
    "Management Information Systems",
    "Management of Technology and Innovation",
    "Marketing",
    "Organizational Behavior and Human Resource Management",
    "Strategy and Management",
    "Tourism, Leisure and Hospitality Management"
  ],
  "Chemical Engineering": [
    "Bioengineering",
    "Catalysis",
    "Chemical Engineering (miscellaneous)",
    "Chemical Health and Safety",
    "Colloid and Surface Chemistry",
    "Filtration and Separation",
    "Fluid Flow and Transfer Processes",
    "Process Chemistry and Technology"
  ],
  "Chemistry": [
    "Analytical Chemistry",
    "Chemistry (miscellaneous)",
    "Electrochemistry",
    "Inorganic Chemistry",
    "Organic Chemistry",
    "Physical and Theoretical Chemistry",
    "Spectroscopy"
  ],
  "Computer Science": [
    "Artificial Intelligence",
    "Computational Theory and Mathematics",
    "Computer Graphics and Computer-Aided Design",
    "Computer Networks and Communications",
    "Computer Science Applications",
    "Computer Science (miscellaneous)",
    "Computer Vision and Pattern Recognition",
    "Hardware and Architecture",
    "Human-Computer Interaction",
    "Information Systems",
    "Signal Processing",
    "Software"
  ],
  "Decision Sciences": [
    "Decision Sciences (miscellaneous)",
    "Information Systems and Management",
    "Management Science and Operations Research"
  ],
  "Earth and Planetary Sciences": [
    "Atmospheric Science",
    "Computers in Earth Sciences",
    "Earth and Planetary Sciences (miscellaneous)",
    "Earth-Surface Processes",
    "Economic Geology",
    "Geochemistry and Petrology",
    "Geology",
    "Geophysics",
    "Geotechnical Engineering and Engineering Geology",
    "Oceanography",
    "Paleontology",
    "Space and Planetary Science",
    "Stratigraphy"
  ],
  "Economics, Econometrics and Finance": [
    "Economics and Econometrics",
    "Economics, Econometrics and Finance (miscellaneous)",
    "Finance"
  ],
  "Energy": [
    "Energy Engineering and Power Technology",
    "Energy (miscellaneous)",
    "Fuel Technology",
    "Nuclear Energy and Engineering",
    "Renewable Energy, Sustainability and the Environment"
  ],
  "Engineering": [
    "Aerospace Engineering",
    "Automotive Engineering",
    "Biomedical Engineering",
    "Civil and Structural Engineering",
    "Control and Systems Engineering",
    "Electrical and Electronic Engineering",
    "Engineering (miscellaneous)",
    "Industrial and Manufacturing Engineering",
    "Mechanical Engineering",
    "Ocean Engineering",
    "Safety, Risk, Reliability and Quality"
  ],
  "Environmental Science": [
    "Ecological Modeling",
    "Ecology",
    "Environmental Chemistry",
    "Environmental Engineering",
    "Environmental Science (miscellaneous)",
    "Global and Planetary Change",
    "Health, Toxicology and Mutagenesis",
    "Management, Monitoring, Policy and Law",
    "Nature and Landscape Conservation",
    "Pollution",
    "Waste Management and Disposal",
    "Water Science and Technology"
  ],
  "Immunology and Microbiology": [
    "Applied Microbiology and Biotechnology",
    "Immunology",
    "Immunology and Microbiology (miscellaneous)",
    "Microbiology",
    "Parasitology",
    "Virology"
  ],
  "Materials Science": [
    "Biomaterials",
    "Ceramics and Composites",
    "Electronic, Optical and Magnetic Materials",
    "Materials Chemistry",
    "Materials Science (miscellaneous)",
    "Metals and Alloys",
    "Polymers and Plastics",
    "Surfaces, Coatings and Films"
  ],
  "Mathematics": [
    "Algebra and Number Theory",
    "Analysis",
    "Applied Mathematics",
    "Computational Mathematics",
    "Control and Optimization",
    "Discrete Mathematics and Combinatorics",
    "Geometry and Topology",
    "Logic",
    "Mathematical Physics",
    "Mathematics (miscellaneous)",
    "Modeling and Simulation",
    "Numerical Analysis",
    "Statistics and Probability",
    "Theoretical Computer Science"
  ],
  "Medicine": [
    "Anesthesiology and Pain Medicine",
    "Biochemistry (medical)",
    "Cardiology and Cardiovascular Medicine",
    "Critical Care and Intensive Care Medicine",
    "Complementary and Alternative Medicine",
    "Dermatology",
    "Drug Discovery",
    "Emergency Medicine",
    "Endocrinology, Diabetes and Metabolism",
    "Epidemiology",
    "Family Practice",
    "Gastroenterology",
    "Geriatrics and Gerontology",
    "Health Informatics",
    "Health Policy",
    "Hematology",
    "Hepatology",
    "Histology and Pathology",
    "Immunology and Allergy",
    "Internal Medicine",
    "Medicine (miscellaneous)",
    "Microbiology (medical)",
    "Nephrology",
    "Neurology (clinical)",
    "Obstetrics and Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics and Sports Medicine",
    "Otorhinolaryngology",
    "Pathology and Forensic Medicine",
    "Pediatrics, Perinatology and Child Health",
    "Pharmacology (medical)",
    "Physiology (medical)",
    "Psychiatry and Mental Health",
    "Public Health, Environmental and Occupational Health",
    "Pulmonary and Respiratory Medicine",
    "Radiology, Nuclear Medicine and Imaging",
    "Rehabilitation",
    "Reproductive Medicine",
    "Reviews and References (medical)",
    "Rheumatology",
    "Surgery",
    "Transplantation",
    "Urology"
  ],
  "Neuroscience": [
    "Behavioral Neuroscience",
    "Biological Psychiatry",
    "Cellular and Molecular Neuroscience",
    "Cognitive Neuroscience",
    "Developmental Neuroscience",
    "Endocrine and Autonomic Systems",
    "Neurology",
    "Neuroscience (miscellaneous)",
    "Sensory Systems"
  ],
  "Nursing": [
    "Advanced and Specialized Nursing",
    "Assessment and Diagnosis",
    "Care Planning",
    "Community and Home Care",
    "Critical Care Nursing",
    "Emergency Nursing",
    "Fundamentals and Skills",
    "Gerontology",
    "Issues, Ethics and Legal Aspects",
    "Leadership and Management",
    "Maternity and Midwifery",
    "Nurse Assisting",
    "Nursing (miscellaneous)",
    "Nutrition and Dietetics",
    "Oncology (nursing)",
    "Pathophysiology",
    "Pediatric Nursing",
    "Pharmacology (nursing)",
    "Psychiatric Mental Health",
    "Public Health, Environmental and Occupational Health",
    "Research and Theory",
    "Review and Exam Preparation"
  ],
  "Pharmacology, Toxicology and Pharmaceutics": [
    "Drug Discovery",
    "Pharmaceutical Science",
    "Pharmacology",
    "Pharmacology, Toxicology and Pharmaceutics (miscellaneous)",
    "Toxicology"
  ],
  "Physics and Astronomy": [
    "Acoustics and Ultrasonics",
    "Astronomy and Astrophysics",
    "Atomic and Molecular Physics, and Optics",
    "Condensed Matter Physics",
    "Instrumentation",
    "Nuclear and High Energy Physics",
    "Physics and Astronomy (miscellaneous)",
    "Radiation",
    "Statistical and Nonlinear Physics",
    "Surfaces and Interfaces"
  ],
  "Psychology": [
    "Applied Psychology",
    "Clinical Psychology",
    "Developmental and Educational Psychology",
    "Experimental and Cognitive Psychology",
    "Neuropsychology and Physiological Psychology",
    "Psychology (miscellaneous)",
    "Social Psychology"
  ],
  "Social Sciences": [
    "Anthropology",
    "Archeology",
    "Communication",
    "Cultural Studies",
    "Demography",
    "Development",
    "Education",
    "Gender Studies",
    "Geography, Planning and Development",
    "Health (social science)",
    "Human Factors and Ergonomics",
    "Law",
    "Library and Information Sciences",
    "Linguistics and Language",
    "Political Science and International Relations",
    "Public Administration",
    "Safety Research",
    "Social Sciences (miscellaneous)",
    "Social Work",
    "Sociology and Political Science",
    "Transportation",
    "Urban Studies"
  ],
  "Veterinary": [
    "Equine",
    "Food Animals",
    "Small Animals",
    "Veterinary (miscellaneous)"
  ],
  "Dentistry": [
    "Dental Assisting",
    "Dental Hygiene",
    "Dentistry (miscellaneous)",
    "Oral Surgery",
    "Orthodontics",
    "Periodontics"
  ],
  "Health Professions": [
    "Chiropractics",
    "Complementary and Manual Therapy",
    "Emergency Medical Services",
    "Health Information Management",
    "Health Professions (miscellaneous)",
    "Medical Assisting and Transcription",
    "Medical Laboratory Technology",
    "Occupational Therapy",
    "Optometry",
    "Pharmacy",
    "Physical Therapy, Sports Therapy and Rehabilitation",
    "Podiatry",
    "Radiological and Ultrasound Technology",
    "Respiratory Care",
    "Speech and Hearing"
  ],
  "Multidisciplinary": [
    "Multidisciplinary"
  ]
};

// Journal name components for dynamic generation
const JOURNAL_COMPONENTS = {
  prefixes: [
    'International Journal of', 'Journal of', 'Advanced', 'IEEE', 'ACM', 'European', 
    'American', 'International', 'Proceedings of', 'Transactions on', 'Advances in',
    'Applied', 'Clinical', 'Experimental', 'Theoretical', 'Computational', 'Modern',
    'Contemporary', 'Global', 'World', 'Annual Review of', 'Frontiers in'
  ],
  subjects: [
    'Research', 'Science', 'Technology', 'Engineering', 'Medicine', 'Biology',
    'Chemistry', 'Physics', 'Mathematics', 'Computer Science', 'Materials',
    'Energy', 'Environment', 'Health', 'Innovation', 'Development', 'Analysis',
    'Applications', 'Systems', 'Methods', 'Studies', 'Communications', 'Letters',
    'Reports', 'Reviews', 'Discoveries', 'Innovations', 'Solutions', 'Advances'
  ],
  suffixes: [
    'and Applications', 'Research', 'Letters', 'Communications', 'Review', 
    'Technology', 'Engineering', 'Science', 'Today', 'Quarterly', 'International',
    'and Practice', 'Reports', 'Studies', 'and Development', 'Innovations',
    'and Technology', 'Methods', 'Systems', 'and Analysis', 'Proceedings'
  ]
};

const diverseCoAuthorPool = [
  // Indian Names
  'Bharath K', 'Priya S', 'Rahul M', 'Meera N', 'Karthik P', 'Divya R',
  'Arun V', 'Sneha T', 'Vikram J', 'Nisha L', 'Harish B', 'Anjali C',
  'Suresh Kumar', 'Lakshmi Devi', 'Ravi Shankar', 'Kavitha M',
  'Srinivas R', 'Padmavathi S', 'Venkatesh N', 'Deepika Rao',
  
  // International Names
  'John Smith', 'Maria Garcia', 'Chen Wei', 'Ahmed Hassan',
  'Sarah Johnson', 'Michael Brown', 'Lisa Anderson', 'David Wilson',
  'Anna Kowalski', 'Pierre Dubois', 'Yuki Tanaka', 'Elena Rossi',
  'James Miller', 'Sophie Martin', 'Alexander Petrov', 'Isabella Lopez'
];

// Research topics - ALL MIXED UP for random assignment
const ALL_RESEARCH_TOPICS = [
  'Machine Learning Algorithms', 'Deep Neural Networks', 'Natural Language Processing',
  'Computer Vision', 'Distributed Systems', 'Cloud Computing', 'Edge Computing',
  'Blockchain Technology', 'Cybersecurity Protocols', 'Data Mining Techniques',
  'IoT Edge Devices', 'Microservices Architecture', 'DevOps Practices',
  'Software Engineering', 'Database Management', 'Web Technologies',
  'VLSI Design', 'Signal Processing', 'Communication Systems', 'Embedded Systems',
  'Finite Element Analysis', 'Fluid Dynamics', 'Heat Transfer', 'Manufacturing Processes',
  'Structural Engineering', 'Geotechnical Engineering', 'Transportation Systems',
  'Quantum Mechanics', 'Condensed Matter Physics', 'Optical Physics',
  'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
  'Applied Mathematics', 'Mathematical Modeling', 'Optimization Theory',
  'Linguistic Analysis', 'Literature Studies', 'Discourse Analysis',
  'Strategic Management', 'Operations Research', 'Supply Chain Management',
  'Financial Markets', 'E-commerce Strategies', 'Consumer Behavior',
  'Oral Health Assessment', 'Preventive Dentistry', 'Restorative Procedures',
  'Malocclusion Treatment', 'Bracket Systems', 'Clear Aligners',
  'Interdisciplinary Research', 'Cross-domain Applications', 'General Studies',
  'Biotechnology Applications', 'Nanotechnology', 'Renewable Energy Systems',
  'Environmental Sustainability', 'Climate Change', 'Artificial Intelligence Ethics',
  'Robotics and Automation', 'Human-Computer Interaction', 'Data Analytics',
  'Wireless Networks', 'Network Security', 'Mobile Computing'
];

const titlePrefixes = [
  'Advanced', 'Novel', 'Intelligent', 'Efficient', 'Optimized', 'Enhanced',
  'Robust', 'Scalable', 'Adaptive', 'Dynamic', 'Hybrid', 'Multi-objective',
  'Real-time', 'Distributed', 'Secure', 'Energy-efficient', 'High-performance',
  'Smart', 'Automated', 'Integrated', 'Collaborative', 'Predictive'
];

const researchActions = [
  'Analysis of', 'Design and Implementation of', 'A Comprehensive Study on',
  'Performance Evaluation of', 'Optimization Techniques for', 'Investigation of',
  'Development of', 'Comparative Analysis of', 'Experimental Study on',
  'Theoretical Framework for', 'Empirical Analysis of', 'Case Study on',
  'Review and Analysis of', 'Modeling and Simulation of', 'Assessment of'
];

const usedTitles = new Set();
const usedDOIs = new Set();
const usedJournals = new Set();

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
    default:
      return { type: 'scopus', id: String(randomInt(10_000_000_000, 99_999_999_999)) };
  }
}

function generateUniqueDoi() {
  let doi;
  let attempts = 0;
  do {
    const publisher = randomInt(1000, 9999);
    const journal = randomInt(100, 999);
    const year = randomInt(2020, 2025);
    const paper = randomInt(1000, 9999);
    doi = `10.${publisher}/${journal}.${year}.${paper}`;
    attempts++;
  } while (usedDOIs.has(doi) && attempts < 100);
  
  usedDOIs.add(doi);
  return doi;
}

function generateUniqueJournal(userFacultyId, userFullName) {
  let journal;
  let attempts = 0;
  
  do {
    const prefix = pick(JOURNAL_COMPONENTS.prefixes);
    const subject = pick(JOURNAL_COMPONENTS.subjects);
    const suffix = Math.random() < 0.6 ? pick(JOURNAL_COMPONENTS.suffixes) : '';
    
    // Create different journal name patterns
    const patterns = [
      `${prefix} ${subject}${suffix ? ' ' + suffix : ''}`,
      `${subject} ${suffix || 'Journal'}`,
      `${prefix} ${subject}`,
      `${subject} Research ${suffix || 'Letters'}`,
      `${subject}: ${suffix || 'Theory and Practice'}`,
    ];
    
    journal = pick(patterns);
    
    // Add uniqueness by incorporating user info for very similar journals
    if (usedJournals.has(journal)) {
      const uniquePatterns = [
        `${journal} - Advanced Studies`,
        `${journal} and Applications`,
        `${journal}: International Edition`,
        `${journal} Quarterly`,
        `${journal} Communications`,
        `${journal} International`,
        `${journal} Today`,
        `${journal} - Series ${randomInt(1, 99)}`
      ];
      journal = pick(uniquePatterns);
    }
    
    attempts++;
  } while (usedJournals.has(journal) && attempts < 100);
  
  // If still not unique after 100 attempts, add a random suffix
  if (usedJournals.has(journal)) {
    journal = `${journal} - Edition ${randomInt(100, 999)}`;
  }
  
  usedJournals.add(journal);
  return {
    journal,
    publisher: pick(PUBLISHERS)
  };
}

function generateUniqueTitle() {
  let title;
  let attempts = 0;
  
  do {
    const prefix = pick(titlePrefixes);
    const action = pick(researchActions);
    const topic = pick(ALL_RESEARCH_TOPICS);
    
    // Create variations
    const variations = [
      `${prefix} ${action} ${topic}`,
      `${action} ${prefix} ${topic}`,
      `${prefix} ${topic}: ${action}`,
      `${topic} using ${prefix} Approaches`,
      `${prefix} Framework for ${topic}`,
      `${topic}: A ${prefix} Perspective`
    ];
    
    title = pick(variations);
    attempts++;
  } while (usedTitles.has(title) && attempts < 100);
  
  // If we can't find a unique title after 100 attempts, add a suffix
  if (usedTitles.has(title)) {
    title = `${title} - Study ${randomInt(1, 1000)}`;
  }
  
  usedTitles.add(title);
  return title;
}

function getRandomSubjectAreaAndCategories() {
  // Get ALL subject areas
  const allSubjectAreas = Object.keys(SUBJECT_AREAS);
  
  // Pick a random subject area - completely random, not tied to department
  const subjectArea = pick(allSubjectAreas);
  const availableCategories = SUBJECT_AREAS[subjectArea];
  
  // Select 1-3 random categories from the SAME subject area (this is key!)
  const numCategories = randomInt(1, Math.min(3, availableCategories.length));
  const selectedCategories = [];
  
  while (selectedCategories.length < numCategories) {
    const category = pick(availableCategories);
    if (!selectedCategories.includes(category)) {
      selectedCategories.push(category);
    }
  }
  
  return {
    subjectArea,
    subjectCategories: selectedCategories
  };
}

function makeAuthors(primaryAuthor) {
  const authorCount = randomInt(2, 5);
  const pool = diverseCoAuthorPool.filter(n => n !== primaryAuthor);
  const authors = [{ name: primaryAuthor, isCorresponding: Math.random() < 0.6 }];
  
  // Add random co-authors
  while (authors.length < authorCount) {
    const name = pick(pool);
    if (!authors.find(a => a.name === name)) {
      authors.push({ name, isCorresponding: false });
    }
  }
  
  // Ensure at least one corresponding author
  if (!authors.some(a => a.isCorresponding)) {
    authors[randomInt(0, authors.length - 1)].isCorresponding = true;
  }
  
  return authors;
}

function makeStudentScholars() {
  if (Math.random() < 0.7) return { isStudentScholar: 'no', studentScholars: [] };
  
  const count = randomInt(1, 3);
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      name: pick(diverseCoAuthorPool),
      id: `STU-${randomInt(100000, 999999)}`
    });
  }
  return { isStudentScholar: 'yes', studentScholars: list };
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (RESET_PAPERS) {
      await Paper.deleteMany({});
      console.log('🗑️ Cleared existing papers');
    }

    // Get both faculty and campus admin users
    const users = await User.find({ 
      role: { $in: ['faculty', 'campus_admin'] },
      facultyId: { $exists: true, $ne: 'N/A' }
    }).lean();

    if (!users.length) {
      console.log('❌ No faculty or campus admin users found. Seed users first.');
      return;
    }

    console.log(`👥 Found ${users.length} users (faculty + campus admins)`);
    
    // Separate by role for reporting
    const facultyUsers = users.filter(u => u.role === 'faculty');
    const campusAdminUsers = users.filter(u => u.role === 'campus_admin');
    
    console.log(`📊 Faculty: ${facultyUsers.length}, Campus Admins: ${campusAdminUsers.length}`);
    console.log(`🎲 Applying RANDOM subject areas with MATCHING categories to ALL users`);

    const docs = [];
    let totalPapers = 0;

    for (const user of users) {
      const userName = user.fullName || `${user.role === 'faculty' ? 'Faculty' : 'Campus Admin'} Member`;
      const userFacultyId = user.facultyId || 'FAC-000';
      const userDepartment = user.department || 'Unknown';
      const papersForUser = randomInt(MIN_PAPERS, MAX_PAPERS);
      
      console.log(`📝 Generating ${papersForUser} papers for ${userName} (${userFacultyId}) - ${user.role} - ${userDepartment}`);
      
      for (let i = 0; i < papersForUser; i++) {
        const year = randomInt(2020, 2025);
        const { journal, publisher } = generateUniqueJournal(userFacultyId, userName);
        
        // FIXED: Only use valid publication types (removed 'abdc')
        const pub = buildPublication(pick(['scopus', 'sci', 'webOfScience', 'pubmed']));
        
        const authors = makeAuthors(userName);
        const claimedByObj = pick(authors);
        const claimedBy = claimedByObj.name;
        const correspondingIndex = authors.findIndex(a => a.isCorresponding);
        const authorNo = Math.random() < 0.3 && correspondingIndex >= 0 ? 'C' : String(randomInt(1, authors.length));
        const studentScholars = makeStudentScholars();
        
        // RANDOM subject area with MATCHING categories - this is the key fix!
        const { subjectArea, subjectCategories } = getRandomSubjectAreaAndCategories();

        const doc = {
          authors,
          title: generateUniqueTitle(),
          journal,
          publisher,
          volume: String(randomInt(1, 60)),
          issue: String(randomInt(1, 12)),
          pageNo: `${randomInt(1, 100)}-${randomInt(101, 200)}`,
          doi: generateUniqueDoi(),
          publicationType: pub.type,
          facultyId: userFacultyId,
          publicationId: pub.id,
          year,
          claimedBy,
          authorNo,
          isStudentScholar: studentScholars.isStudentScholar,
          studentScholars: studentScholars.studentScholars,
          qRating: pick(['Q1', 'Q2', 'Q3', 'Q4']),
          typeOfIssue: Math.random() < 0.25 ? 'Special Issue' : 'Regular Issue',
          subjectArea,
          subjectCategories
        };

        docs.push(doc);
        totalPapers++;
      }
    }

    if (!docs.length) {
      console.log('❌ Nothing to insert.');
      return;
    }

    console.log(`\n📊 Total papers to insert: ${totalPapers}`);
    console.log(`📚 Unique titles generated: ${usedTitles.size}`);
    console.log(`📰 Unique journals generated: ${usedJournals.size}`);
    console.log(`🔗 Unique DOIs generated: ${usedDOIs.size}`);

    // Test one document first to make sure validation passes
    console.log('\n🧪 Testing first document validation...');
    const testDoc = docs[0];
    try {
      const paperTest = new Paper(testDoc);
      await paperTest.validate();
      console.log('✅ Test document validation PASSED');
      console.log(`   Subject Area: ${testDoc.subjectArea}`);
      console.log(`   Categories: ${testDoc.subjectCategories.join(', ')}`);
      console.log(`   Publication Type: ${testDoc.publicationType}`);
    } catch (testError) {
      console.error('❌ Test document validation FAILED:', testError.message);
      return;
    }

    // Insert in smaller batches to handle large datasets better
    const batchSize = 1000;
    let insertedCount = 0;
    
    console.log(`\n🔄 Inserting papers in batches of ${batchSize}...`);
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      try {
        const result = await Paper.insertMany(batch, { ordered: false });
        insertedCount += result.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Inserted ${result.length} papers (Total: ${insertedCount})`);
      } catch (error) {
        console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        
        // Try inserting one by one to identify problematic documents
        console.log(`🔍 Attempting individual inserts for batch ${Math.floor(i/batchSize) + 1}...`);
        for (const doc of batch) {
          try {
            await Paper.create(doc);
            insertedCount++;
          } catch (singleError) {
            console.error(`❌ Failed to insert paper: "${doc.title}"`);
            console.error(`   Subject Area: ${doc.subjectArea}`);
            console.error(`   Categories: ${doc.subjectCategories.join(', ')}`);
            console.error(`   Publication Type: ${doc.publicationType}`);
            console.error(`   Error: ${singleError.message}`);
          }
        }
      }
    }

    console.log(`\n✅ Successfully inserted ${insertedCount} paper documents out of ${totalPapers} generated`);

    // Get final count from database
    const finalCount = await Paper.countDocuments();
    console.log(`📊 Final paper count in database: ${finalCount}`);

    if (finalCount > 0) {
      // Statistics for successfully inserted papers
      const created = await Paper.find().lean();
      
      // Papers by user role
      const facultyPapers = created.filter(p => {
        const user = users.find(u => u.facultyId === p.facultyId);
        return user?.role === 'faculty';
      }).length;
      
      const campusAdminPapers = created.filter(p => {
        const user = users.find(u => u.facultyId === p.facultyId);
        return user?.role === 'campus_admin';
      }).length;
      
      console.log('\n📈 Paper Distribution:');
      console.log('======================');
      console.log(`Faculty Papers: ${facultyPapers}`);
      console.log(`Campus Admin Papers: ${campusAdminPapers}`);
      console.log(`Total Papers: ${created.length}`);
      
      // Unique journals in database
      const uniqueJournalsInDB = new Set(created.map(p => p.journal));
      console.log(`📰 Unique journals in database: ${uniqueJournalsInDB.size}`);
      
      // Papers by subject area (showing random distribution)
      console.log('\n🎲 Papers by Subject Area (Random Distribution):');
      console.log('================================================');
      const subjectAreaMap = new Map();
      created.forEach(paper => {
        const area = paper.subjectArea;
        subjectAreaMap.set(area, (subjectAreaMap.get(area) || 0) + 1);
      });
      
      // Sort by count to see distribution
      const sortedSubjectAreas = Array.from(subjectAreaMap.entries()).sort((a, b) => b[1] - a[1]);
      sortedSubjectAreas.forEach(([area, count]) => {
        console.log(`${area}: ${count} papers`);
      });

      // Papers by publication type
      console.log('\n📊 Papers by Publication Type:');
      console.log('==============================');
      const pubTypes = ['scopus', 'sci', 'webOfScience', 'pubmed'];
      pubTypes.forEach(type => {
        const count = created.filter(p => p.publicationType === type).length;
        console.log(`${type}: ${count} papers`);
      });

      // Q-rating distribution
      console.log('\n🏆 Q-Rating Distribution:');
      console.log('========================');
      const qRatings = ['Q1', 'Q2', 'Q3', 'Q4'];
      qRatings.forEach(rating => {
        const count = created.filter(p => p.qRating === rating).length;
        console.log(`${rating}: ${count} papers (${((count/created.length)*100).toFixed(1)}%)`);
      });

      // Sample papers showing random nature
      console.log('\n📋 Sample Papers (Showing Random Subject Assignment):');
      console.log('====================================================');
      created.slice(0, 5).forEach((paper, index) => {
        const user = users.find(u => u.facultyId === paper.facultyId);
        console.log(`${index + 1}. "${paper.title}"`);
        console.log(`   Faculty: ${user?.fullName} (${user?.department} Dept.)`);
        console.log(`   Journal: ${paper.journal}`);
        console.log(`   Subject Area: ${paper.subjectArea} (Random!)`);
        console.log(`   Categories: ${paper.subjectCategories.join(', ')}`);
        console.log(`   Publication Type: ${paper.publicationType}`);
        console.log(`   Year: ${paper.year}, Q-Rating: ${paper.qRating}`);
        console.log('');
      });
    }

    console.log('✨ Paper seeding completed with VALID random subject areas and matching categories!');
    console.log('🎯 Result: Faculty from any department can have papers in any subject area');
    console.log('🔐 Validation: All subject areas have matching categories as required by schema');
    console.log('📋 Publication Types: Using only valid types (scopus, sci, webOfScience, pubmed)');

  } catch (err) {
    console.error('❌ Error seeding papers:', err.message);
    if (err.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(err.errors).forEach(error => {
        console.error(`  - ${error.path}: ${error.message}`);
      });
    }
    console.error('Stack trace:', err.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

run();
import mongoose from "mongoose";
import dotenv from "dotenv";
import ConferencePaper from "../models/ConferencePaper.js";
import User from "../models/User.js";
import { SUBJECT_AREAS } from "../utils/subjectAreas.js";

dotenv.config();

// -------- configuration --------
const RESET_PAPERS = true; // set false if you don't want to clear the collection
const MIN_PAPERS = 4; // minimum mock papers per user
const MAX_PAPERS = 10; // maximum mock papers per user
// --------------------------------

// Conference name components
const CONFERENCE_COMPONENTS = {
  prefixes: [
    "International Conference on",
    "IEEE International Conference on",
    "ACM International Conference on",
    "Annual Conference on",
    "International Symposium on",
    "World Congress on",
    "Asia-Pacific Conference on",
    "European Conference on",
    "National Conference on",
    "Workshop on",
  ],
  subjects: [
    "Machine Learning",
    "Artificial Intelligence",
    "Data Science",
    "Computer Vision",
    "Natural Language Processing",
    "Deep Learning",
    "Cloud Computing",
    "Internet of Things",
    "Cybersecurity",
    "Blockchain",
    "Big Data Analytics",
    "Software Engineering",
    "Information Systems",
    "Signal Processing",
    "Communication Systems",
    "Embedded Systems",
    "Robotics and Automation",
    "Sustainable Technologies",
    "Smart Systems",
    "Biomedical Engineering",
    "Renewable Energy",
    "Manufacturing Technologies",
    "Materials Science",
    "Nanotechnology",
    "Environmental Engineering",
  ],
  suffixes: [
    "and Applications",
    "and Technologies",
    "and Innovations",
    "Systems",
    "Research",
    "Advances",
    "Engineering",
    "",
  ],
};

// Conference short names
const CONFERENCE_SHORT_NAMES = [
  "ICML",
  "NeurIPS",
  "CVPR",
  "ICCV",
  "AAAI",
  "IJCAI",
  "ACL",
  "EMNLP",
  "ICSE",
  "FSE",
  "ASE",
  "ISSTA",
  "SIGMOD",
  "VLDB",
  "ICDE",
  "KDD",
  "WWW",
  "WSDM",
  "CIKM",
  "ICDM",
  "SDM",
  "PAKDD",
  "ECML",
  "AISTATS",
  "UAI",
  "ICRA",
  "IROS",
  "RSS",
  "CoRL",
  "ICAPS",
  "HPCC",
  "SC",
  "IPDPS",
  "CLUSTER",
  "CCGrid",
  "IC2E",
  "EDGE",
  "SEC",
  "ICSOC",
  "SCC",
  "ICWS",
  "COMPSAC",
  "ICSME",
  "SANER",
  "ESEM",
  "EASE",
  "ICST",
  "ISSTA",
  "",
];

// Organizers/Institutions
const ORGANIZERS = [
  "IEEE",
  "ACM",
  "Springer",
  "Elsevier",
  "IET",
  "IFIP",
  "MIT",
  "Stanford University",
  "Carnegie Mellon University",
  "University of California",
  "Georgia Tech",
  "ETH Zurich",
  "IIT Delhi",
  "IIT Bombay",
  "IISc Bangalore",
  "NIT Trichy",
  "SRM Institute of Science and Technology",
  "VIT University",
  "Anna University",
  "BITS Pilani",
  "Jadavpur University",
];

// Proceedings publishers
const PROCEEDINGS_PUBLISHERS = [
  "IEEE Xplore",
  "ACM Digital Library",
  "Springer",
  "Elsevier",
  "IOP Publishing",
  "CEUR-WS",
  "MDPI",
  "Atlantis Press",
  "EDP Sciences",
  "AIP Publishing",
  "World Scientific",
];

// Cities with countries
const LOCATIONS = [
  { city: "New York", country: "USA" },
  { city: "San Francisco", country: "USA" },
  { city: "Los Angeles", country: "USA" },
  { city: "Boston", country: "USA" },
  { city: "Seattle", country: "USA" },
  { city: "Chicago", country: "USA" },
  { city: "London", country: "UK" },
  { city: "Cambridge", country: "UK" },
  { city: "Paris", country: "France" },
  { city: "Berlin", country: "Germany" },
  { city: "Munich", country: "Germany" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Singapore", country: "Singapore" },
  { city: "Tokyo", country: "Japan" },
  { city: "Sydney", country: "Australia" },
  { city: "Melbourne", country: "Australia" },
  { city: "Toronto", country: "Canada" },
  { city: "Vancouver", country: "Canada" },
  { city: "Zurich", country: "Switzerland" },
  { city: "Barcelona", country: "Spain" },
  { city: "Milan", country: "Italy" },
  { city: "Seoul", country: "South Korea" },
  { city: "Beijing", country: "China" },
  { city: "Shanghai", country: "China" },
  { city: "Hong Kong", country: "Hong Kong" },
  { city: "Dubai", country: "UAE" },
  { city: "New Delhi", country: "India" },
  { city: "Mumbai", country: "India" },
  { city: "Bangalore", country: "India" },
  { city: "Chennai", country: "India" },
  { city: "Hyderabad", country: "India" },
];

const diverseCoAuthorPool = [
  // Indian Names
  "Bharath K",
  "Priya S",
  "Rahul M",
  "Meera N",
  "Karthik P",
  "Divya R",
  "Arun V",
  "Sneha T",
  "Vikram J",
  "Nisha L",
  "Harish B",
  "Anjali C",
  "Suresh Kumar",
  "Lakshmi Devi",
  "Ravi Shankar",
  "Kavitha M",
  "Srinivas R",
  "Padmavathi S",
  "Venkatesh N",
  "Deepika Rao",

  // International Names
  "John Smith",
  "Maria Garcia",
  "Chen Wei",
  "Ahmed Hassan",
  "Sarah Johnson",
  "Michael Brown",
  "Lisa Anderson",
  "David Wilson",
  "Anna Kowalski",
  "Pierre Dubois",
  "Yuki Tanaka",
  "Elena Rossi",
  "James Miller",
  "Sophie Martin",
  "Alexander Petrov",
  "Isabella Lopez",
];

const titlePrefixes = [
  "Advanced",
  "Novel",
  "Intelligent",
  "Efficient",
  "Optimized",
  "Enhanced",
  "Robust",
  "Scalable",
  "Adaptive",
  "Dynamic",
  "Hybrid",
  "Multi-objective",
  "Real-time",
  "Distributed",
  "Secure",
  "Energy-efficient",
  "High-performance",
  "Smart",
  "Automated",
  "Integrated",
  "Collaborative",
  "Predictive",
];

const researchActions = [
  "Analysis of",
  "Design and Implementation of",
  "A Comprehensive Study on",
  "Performance Evaluation of",
  "Optimization Techniques for",
  "Investigation of",
  "Development of",
  "Comparative Analysis of",
  "Experimental Study on",
  "Theoretical Framework for",
  "Empirical Analysis of",
  "Case Study on",
];

const ALL_RESEARCH_TOPICS = [
  "Machine Learning Algorithms",
  "Deep Neural Networks",
  "Natural Language Processing",
  "Computer Vision",
  "Distributed Systems",
  "Cloud Computing",
  "Edge Computing",
  "Blockchain Technology",
  "Cybersecurity Protocols",
  "Data Mining Techniques",
  "IoT Edge Devices",
  "Microservices Architecture",
  "DevOps Practices",
  "VLSI Design",
  "Signal Processing",
  "Communication Systems",
  "Embedded Systems",
  "Renewable Energy Systems",
  "Environmental Sustainability",
  "Robotics",
  "Human-Computer Interaction",
  "Data Analytics",
  "Wireless Networks",
];

const usedTitles = new Set();
const usedConferences = new Set();

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function generateUniqueConferenceName() {
  let conf;
  let attempts = 0;

  do {
    const prefix = pick(CONFERENCE_COMPONENTS.prefixes);
    const subject = pick(CONFERENCE_COMPONENTS.subjects);
    const suffix =
      Math.random() < 0.5 ? pick(CONFERENCE_COMPONENTS.suffixes) : "";

    conf = `${prefix} ${subject}${suffix ? " " + suffix : ""}`;
    attempts++;
  } while (usedConferences.has(conf) && attempts < 100);

  if (usedConferences.has(conf)) {
    conf = `${conf} ${randomInt(2020, 2025)}`;
  }

  usedConferences.add(conf);
  return conf;
}

function generateUniqueTitle() {
  let title;
  let attempts = 0;

  do {
    const prefix = pick(titlePrefixes);
    const action = pick(researchActions);
    const topic = pick(ALL_RESEARCH_TOPICS);

    const variations = [
      `${prefix} ${action} ${topic}`,
      `${action} ${prefix} ${topic}`,
      `${prefix} ${topic}: ${action}`,
      `${topic} using ${prefix} Approaches`,
    ];

    title = pick(variations);
    attempts++;
  } while (usedTitles.has(title) && attempts < 100);

  if (usedTitles.has(title)) {
    title = `${title} - Study ${randomInt(1, 1000)}`;
  }

  usedTitles.add(title);
  return title;
}

function generateConferenceDates(year) {
  const month = randomInt(1, 11);
  const day = randomInt(1, 25);
  const duration = randomInt(2, 5); // 2-5 days conference

  const startDate = new Date(year, month - 1, day);
  const endDate = new Date(year, month - 1, day + duration);

  return { conferenceStartDate: startDate, conferenceEndDate: endDate };
}

function generateDoi() {
  if (Math.random() < 0.3) return ""; // 30% no DOI
  const publisher = randomInt(1000, 9999);
  const conf = randomInt(100, 999);
  const year = randomInt(2020, 2025);
  const paper = randomInt(1000, 9999);
  return `10.${publisher}/${conf}.${year}.${paper}`;
}

function generateISBN() {
  if (Math.random() < 0.4) return ""; // 40% no ISBN
  const prefix = pick(["978", "979"]);
  const group = randomInt(0, 9);
  const publisher = randomInt(10000, 99999);
  const title = randomInt(100, 999);
  const check = randomInt(0, 9);
  return `${prefix}-${group}-${publisher}-${title}-${check}`;
}

function getRandomSubjectAreaAndCategories() {
  const allSubjectAreas = Object.keys(SUBJECT_AREAS);
  const subjectArea = pick(allSubjectAreas);
  const availableCategories = SUBJECT_AREAS[subjectArea];

  const numCategories = randomInt(1, Math.min(3, availableCategories.length));
  const selectedCategories = [];

  while (selectedCategories.length < numCategories) {
    const category = pick(availableCategories);
    if (!selectedCategories.includes(category)) {
      selectedCategories.push(category);
    }
  }

  return { subjectArea, subjectCategories: selectedCategories };
}

function makeAuthors(primaryAuthor) {
  const authorCount = randomInt(2, 5);
  const pool = diverseCoAuthorPool.filter((n) => n !== primaryAuthor);
  const authors = [
    { name: primaryAuthor, isCorresponding: Math.random() < 0.6 },
  ];

  while (authors.length < authorCount) {
    const name = pick(pool);
    if (!authors.find((a) => a.name === name)) {
      authors.push({ name, isCorresponding: false });
    }
  }

  if (!authors.some((a) => a.isCorresponding)) {
    authors[randomInt(0, authors.length - 1)].isCorresponding = true;
  }

  return authors;
}

function makeStudentScholars() {
  if (Math.random() < 0.7)
    return { isStudentScholar: "no", studentScholars: [] };

  const count = randomInt(1, 3);
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      name: pick(diverseCoAuthorPool),
      id: `STU-${randomInt(100000, 999999)}`,
    });
  }
  return { isStudentScholar: "yes", studentScholars: list };
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    if (RESET_PAPERS) {
      await ConferencePaper.deleteMany({});
      console.log("🗑️ Cleared existing conference papers");
    }

    const users = await User.find({
      role: { $in: ["faculty", "campus_admin"] },
      facultyId: { $exists: true, $ne: "N/A" },
    }).lean();

    if (!users.length) {
      console.log(
        "❌ No faculty or campus admin users found. Seed users first."
      );
      return;
    }

    console.log(`👥 Found ${users.length} users (faculty + campus admins)`);

    const facultyUsers = users.filter((u) => u.role === "faculty");
    const campusAdminUsers = users.filter((u) => u.role === "campus_admin");

    console.log(
      `📊 Faculty: ${facultyUsers.length}, Campus Admins: ${campusAdminUsers.length}`
    );
    console.log(
      `🎤 Generating ${MIN_PAPERS}-${MAX_PAPERS} conference papers per user`
    );

    const docs = [];
    let totalPapers = 0;

    for (const user of users) {
      const userName =
        user.fullName ||
        `${user.role === "faculty" ? "Faculty" : "Campus Admin"} Member`;
      const userFacultyId = user.facultyId || "FAC-000";
      const papersForUser = randomInt(MIN_PAPERS, MAX_PAPERS);

      console.log(
        `📝 Generating ${papersForUser} conference papers for ${userName} (${userFacultyId})`
      );

      for (let i = 0; i < papersForUser; i++) {
        const year = randomInt(2020, 2025);
        const { conferenceStartDate, conferenceEndDate } =
          generateConferenceDates(year);
        const authors = makeAuthors(userName);
        const claimedByObj = pick(authors);
        const claimedBy = claimedByObj.name;
        const correspondingIndex = authors.findIndex((a) => a.isCorresponding);
        const authorNo =
          Math.random() < 0.3 && correspondingIndex >= 0
            ? "C"
            : String(randomInt(1, authors.length));
        const studentScholars = makeStudentScholars();
        const { subjectArea, subjectCategories } =
          getRandomSubjectAreaAndCategories();
        const location = pick(LOCATIONS);
        const conferenceName = generateUniqueConferenceName();

        // Determine conference type based on location
        const conferenceType =
          ["India"].includes(location.country) && Math.random() < 0.4
            ? "National"
            : "International";

        const doc = {
          title: generateUniqueTitle(),
          authors,
          year,
          conferenceName,
          conferenceShortName:
            Math.random() < 0.7 ? pick(CONFERENCE_SHORT_NAMES) : "",
          conferenceType,
          conferenceMode: pick(["Online", "Offline", "Hybrid"]),
          conferenceLocation: location,
          conferenceStartDate,
          conferenceEndDate,
          organizer: pick(ORGANIZERS),
          proceedingsTitle:
            Math.random() < 0.6 ? `Proceedings of ${conferenceName}` : "",
          proceedingsPublisher: pick(PROCEEDINGS_PUBLISHERS),
          isbn: generateISBN(),
          doi: generateDoi(),
          pageNo:
            Math.random() < 0.7
              ? `${randomInt(1, 500)}-${randomInt(501, 1000)}`
              : "",
          presentationType: Math.random() < 0.8 ? pick(["Oral", "Poster"]) : "",
          acceptanceRate: Math.random() < 0.4 ? `${randomInt(15, 35)}%` : "",
          indexedIn:
            Math.random() < 0.5 ? pick(["Scopus", "Web of Science"]) : "",
          facultyId: userFacultyId,
          claimedBy,
          authorNo,
          isStudentScholar: studentScholars.isStudentScholar,
          studentScholars: studentScholars.studentScholars,
          subjectArea,
          subjectCategories,
        };

        docs.push(doc);
        totalPapers++;
      }
    }

    if (!docs.length) {
      console.log("❌ Nothing to insert.");
      return;
    }

    console.log(`\n📊 Total conference papers to insert: ${totalPapers}`);
    console.log(`📚 Unique titles: ${usedTitles.size}`);
    console.log(`🎤 Unique conferences: ${usedConferences.size}`);

    // Test validation
    console.log("\n🧪 Testing first document validation...");
    const testDoc = docs[0];
    try {
      const paperTest = new ConferencePaper(testDoc);
      await paperTest.validate();
      console.log("✅ Test document validation PASSED");
      console.log(`   Title: ${testDoc.title}`);
      console.log(`   Conference: ${testDoc.conferenceName}`);
      console.log(`   Type: ${testDoc.conferenceType}`);
      console.log(`   Mode: ${testDoc.conferenceMode}`);
    } catch (testError) {
      console.error("❌ Test document validation FAILED:", testError.message);
      return;
    }

    // Insert in batches
    const batchSize = 500;
    let insertedCount = 0;

    console.log(
      `\n🔄 Inserting conference papers in batches of ${batchSize}...`
    );

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      try {
        const result = await ConferencePaper.insertMany(batch, {
          ordered: false,
        });
        insertedCount += result.length;
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${
            result.length
          } papers (Total: ${insertedCount})`
        );
      } catch (error) {
        console.error(
          `❌ Error in batch ${Math.floor(i / batchSize) + 1}:`,
          error.message
        );

        for (const doc of batch) {
          try {
            await ConferencePaper.create(doc);
            insertedCount++;
          } catch (singleError) {
            console.error(`❌ Failed: "${doc.title}" - ${singleError.message}`);
          }
        }
      }
    }

    console.log(
      `\n✅ Successfully inserted ${insertedCount} conference papers out of ${totalPapers} generated`
    );

    const finalCount = await ConferencePaper.countDocuments();
    console.log(`📊 Final count in database: ${finalCount}`);

    if (finalCount > 0) {
      const created = await ConferencePaper.find().lean();

      console.log("\n📈 Conference Paper Distribution:");
      console.log("==================================");

      // By conference type
      const intlCount = created.filter(
        (p) => p.conferenceType === "International"
      ).length;
      const natCount = created.filter(
        (p) => p.conferenceType === "National"
      ).length;
      console.log(`\n🌍 Conference Type:`);
      console.log(`International: ${intlCount}`);
      console.log(`National: ${natCount}`);

      // By mode
      console.log(`\n💻 Conference Mode:`);
      ["Online", "Offline", "Hybrid"].forEach((mode) => {
        const count = created.filter((p) => p.conferenceMode === mode).length;
        console.log(`${mode}: ${count}`);
      });

      // By presentation type
      console.log(`\n🎯 Presentation Type:`);
      ["Oral", "Poster"].forEach((type) => {
        const count = created.filter((p) => p.presentationType === type).length;
        console.log(`${type}: ${count}`);
      });

      // By indexing
      const scopusCount = created.filter(
        (p) => p.indexedIn === "Scopus"
      ).length;
      const wosCount = created.filter(
        (p) => p.indexedIn === "Web of Science"
      ).length;
      console.log(`\n📑 Indexing:`);
      console.log(`Scopus: ${scopusCount}`);
      console.log(`Web of Science: ${wosCount}`);

      // Sample papers
      console.log("\n📋 Sample Conference Papers:");
      console.log("=============================");
      created.slice(0, 3).forEach((paper, index) => {
        const user = users.find((u) => u.facultyId === paper.facultyId);
        console.log(`${index + 1}. "${paper.title}"`);
        console.log(
          `   Conference: ${paper.conferenceName} (${paper.conferenceType})`
        );
        console.log(
          `   Location: ${paper.conferenceLocation.city}, ${paper.conferenceLocation.country}`
        );
        console.log(`   Mode: ${paper.conferenceMode}`);
        console.log(`   Faculty: ${user?.fullName}`);
        console.log(`   Year: ${paper.year}`);
        console.log("");
      });
    }

    console.log("✨ Conference paper seeding completed!");
  } catch (err) {
    console.error("❌ Error seeding conference papers:", err.message);
    if (err.name === "ValidationError") {
      Object.values(err.errors).forEach((error) => {
        console.error(`  - ${error.path}: ${error.message}`);
      });
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

run();

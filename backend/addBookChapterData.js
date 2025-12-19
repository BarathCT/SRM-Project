import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BookChapter from './models/BookChapter.js';
import User from './models/User.js';
import { SUBJECT_AREAS } from './utils/subjectAreas.js';

dotenv.config();

// -------- configuration --------
const RESET_CHAPTERS = true;       // set false if you don't want to clear the collection
const MIN_CHAPTERS = 3;            // minimum mock chapters per user
const MAX_CHAPTERS = 8;            // maximum mock chapters per user
// --------------------------------

// Academic publishers for book chapters
const BOOK_PUBLISHERS = [
    'Springer', 'Elsevier', 'Wiley', 'CRC Press', 'Academic Press',
    'Cambridge University Press', 'Oxford University Press', 'MIT Press',
    'World Scientific', 'Routledge', 'Taylor & Francis', 'IGI Global',
    'Palgrave Macmillan', 'Nova Science Publishers', 'IntechOpen',
    'Apple Academic Press', 'Chapman and Hall', 'Pearson', 'McGraw-Hill',
    'Sage Publications'
];

// Book series names
const BOOK_SERIES = [
    'Lecture Notes in Computer Science', 'Studies in Computational Intelligence',
    'Advances in Intelligent Systems and Computing', 'Communications in Computer and Information Science',
    'Springer Series in Advanced Manufacturing', 'Studies in Big Data',
    'Advances in Sustainability Science and Technology', 'Smart Innovation, Systems and Technologies',
    'Learning and Analytics in Intelligent Systems', 'Algorithms for Intelligent Systems',
    'Studies in Systems, Decision and Control', 'Lecture Notes in Electrical Engineering',
    'Research in Computing Science', 'Advances in Chemical Engineering',
    'Progress in Biotechnology', 'Developments in Applied Artificial Intelligence',
    'Frontiers in Artificial Intelligence and Applications', ''
];

// Book title components for dynamic generation
const BOOK_TITLE_COMPONENTS = {
    prefixes: [
        'Handbook of', 'Advances in', 'Fundamentals of', 'Introduction to',
        'Modern', 'Advanced', 'Applied', 'Computational', 'Emerging Trends in',
        'Recent Advances in', 'Principles of', 'Encyclopedia of', 'Innovations in',
        'Sustainable', 'Smart', 'Digital', 'Intelligent', 'Contemporary'
    ],
    subjects: [
        'Machine Learning', 'Artificial Intelligence', 'Data Science', 'Computer Vision',
        'Natural Language Processing', 'Deep Learning', 'Cloud Computing', 'IoT',
        'Cybersecurity', 'Blockchain', 'Big Data', 'Software Engineering',
        'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering',
        'Biotechnology', 'Nanotechnology', 'Materials Science', 'Renewable Energy',
        'Environmental Science', 'Healthcare Informatics', 'Business Analytics',
        'Sustainable Development', 'Smart Cities', 'Industry 4.0', 'Robotics'
    ],
    suffixes: [
        'and Applications', 'Theory and Practice', 'Techniques and Methods',
        'Research and Development', 'Foundations and Frontiers', 'Systems and Technologies',
        'Concepts and Technologies', 'Principles and Applications', 'Tools and Techniques',
        'Methods and Algorithms', 'Design and Implementation', ''
    ]
};

// Chapter title components
const CHAPTER_PREFIXES = [
    'A Comprehensive Survey on', 'Analysis of', 'Design and Implementation of',
    'Novel Approach to', 'Optimization Techniques for', 'Performance Evaluation of',
    'Machine Learning Based', 'Deep Learning for', 'AI-Driven', 'Smart',
    'Efficient', 'Robust', 'Scalable', 'Hybrid', 'Multi-objective',
    'Comparative Study of', 'Review of', 'Framework for', 'Architecture for',
    'Modeling and Simulation of', 'Assessment of', 'Integrated Approach to'
];

const CHAPTER_TOPICS = [
    'Predictive Analytics', 'Pattern Recognition', 'Feature Extraction',
    'Classification Methods', 'Clustering Algorithms', 'Optimization Strategies',
    'Network Security', 'Data Privacy', 'Edge Computing', 'Fog Computing',
    'Distributed Systems', 'Parallel Processing', 'Real-time Systems',
    'Sentiment Analysis', 'Recommendation Systems', 'Anomaly Detection',
    'Quality Assurance', 'Process Automation', 'Resource Management',
    'Energy Efficiency', 'Sustainable Manufacturing', 'Green Computing',
    'Smart Grid', 'Autonomous Systems', 'Precision Medicine', 'Drug Discovery'
];

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

// Editor names pool
const EDITOR_POOL = [
    'Dr. A. Kumar', 'Prof. R. Sharma', 'Dr. S. Patel', 'Prof. M. Gupta',
    'Dr. J. Anderson', 'Prof. L. Chen', 'Dr. K. Williams', 'Prof. T. Garcia',
    'Dr. P. Martinez', 'Prof. N. Brown', 'Dr. H. Kim', 'Prof. Y. Yamamoto',
    'Dr. A. Müller', 'Prof. F. Schmidt', 'Dr. R. Johnson', 'Prof. S. Davis'
];

const usedChapterTitles = new Set();
const usedISBNs = new Set();
const usedBookTitles = new Set();

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateUniqueISBN() {
    let isbn;
    let attempts = 0;
    do {
        // Generate ISBN-13 format
        const prefix = pick(['978', '979']);
        const group = randomInt(0, 9);
        const publisher = randomInt(10000, 99999);
        const title = randomInt(100, 999);
        const check = randomInt(0, 9);
        isbn = `${prefix}-${group}-${publisher}-${title}-${check}`;
        attempts++;
    } while (usedISBNs.has(isbn) && attempts < 100);

    usedISBNs.add(isbn);
    return isbn;
}

function generateUniqueDoi() {
    const publisher = randomInt(1000, 9999);
    const book = randomInt(100, 999);
    const year = randomInt(2020, 2025);
    const chapter = randomInt(1, 50);
    return Math.random() < 0.7 ? `10.${publisher}/${book}.${year}.ch${chapter}` : '';
}

function generateUniqueBookTitle() {
    let bookTitle;
    let attempts = 0;

    do {
        const prefix = pick(BOOK_TITLE_COMPONENTS.prefixes);
        const subject = pick(BOOK_TITLE_COMPONENTS.subjects);
        const suffix = Math.random() < 0.6 ? pick(BOOK_TITLE_COMPONENTS.suffixes) : '';

        const patterns = [
            `${prefix} ${subject}${suffix ? ': ' + suffix : ''}`,
            `${subject}: ${prefix} Perspective`,
            `${prefix} ${subject}`,
            `${subject} ${suffix || 'Handbook'}`,
        ];

        bookTitle = pick(patterns);
        attempts++;
    } while (usedBookTitles.has(bookTitle) && attempts < 100);

    if (usedBookTitles.has(bookTitle)) {
        bookTitle = `${bookTitle} - Volume ${randomInt(1, 10)}`;
    }

    usedBookTitles.add(bookTitle);
    return bookTitle;
}

function generateUniqueChapterTitle() {
    let title;
    let attempts = 0;

    do {
        const prefix = pick(CHAPTER_PREFIXES);
        const topic = pick(CHAPTER_TOPICS);

        const variations = [
            `${prefix} ${topic}`,
            `${topic}: ${prefix}`,
            `${prefix} Modern ${topic}`,
            `${topic} using Advanced Techniques`
        ];

        title = pick(variations);
        attempts++;
    } while (usedChapterTitles.has(title) && attempts < 100);

    if (usedChapterTitles.has(title)) {
        title = `${title} - Part ${randomInt(1, 100)}`;
    }

    usedChapterTitles.add(title);
    return title;
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
    const pool = diverseCoAuthorPool.filter(n => n !== primaryAuthor);
    const authors = [{ name: primaryAuthor }];

    while (authors.length < authorCount) {
        const name = pick(pool);
        if (!authors.find(a => a.name === name)) {
            authors.push({ name });
        }
    }

    return authors;
}

function makeEditors() {
    const editorCount = randomInt(1, 3);
    const editors = [];

    while (editors.length < editorCount) {
        const editor = pick(EDITOR_POOL);
        if (!editors.includes(editor)) {
            editors.push(editor);
        }
    }

    return editors;
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

        if (RESET_CHAPTERS) {
            await BookChapter.deleteMany({});
            console.log('🗑️ Cleared existing book chapters');
        }

        const users = await User.find({
            role: { $in: ['faculty', 'campus_admin'] },
            facultyId: { $exists: true, $ne: 'N/A' }
        }).lean();

        if (!users.length) {
            console.log('❌ No faculty or campus admin users found. Seed users first.');
            return;
        }

        console.log(`👥 Found ${users.length} users (faculty + campus admins)`);

        const facultyUsers = users.filter(u => u.role === 'faculty');
        const campusAdminUsers = users.filter(u => u.role === 'campus_admin');

        console.log(`📊 Faculty: ${facultyUsers.length}, Campus Admins: ${campusAdminUsers.length}`);
        console.log(`📚 Generating ${MIN_CHAPTERS}-${MAX_CHAPTERS} book chapters per user`);

        const docs = [];
        let totalChapters = 0;

        for (const user of users) {
            const userName = user.fullName || `${user.role === 'faculty' ? 'Faculty' : 'Campus Admin'} Member`;
            const userFacultyId = user.facultyId || 'FAC-000';
            const userDepartment = user.department || 'Unknown';
            const chaptersForUser = randomInt(MIN_CHAPTERS, MAX_CHAPTERS);

            console.log(`📖 Generating ${chaptersForUser} chapters for ${userName} (${userFacultyId}) - ${user.role}`);

            for (let i = 0; i < chaptersForUser; i++) {
                const year = randomInt(2020, 2025);
                const authors = makeAuthors(userName);
                const claimedByObj = pick(authors);
                const claimedBy = claimedByObj.name;
                const authorNo = String(randomInt(1, authors.length));
                const studentScholars = makeStudentScholars();
                const { subjectArea, subjectCategories } = getRandomSubjectAreaAndCategories();

                const startPage = randomInt(1, 400);
                const endPage = startPage + randomInt(15, 40);

                const doc = {
                    chapterTitle: generateUniqueChapterTitle(),
                    bookTitle: generateUniqueBookTitle(),
                    authors,
                    editors: makeEditors(),
                    chapterNumber: String(randomInt(1, 30)),
                    year,
                    publisher: pick(BOOK_PUBLISHERS),
                    edition: Math.random() < 0.7 ? pick(['1st', '2nd', '3rd', '4th', '5th']) : '',
                    volume: Math.random() < 0.5 ? String(randomInt(1, 10)) : '',
                    isbn: generateUniqueISBN(),
                    doi: generateUniqueDoi(),
                    pageRange: `${startPage}-${endPage}`,
                    bookSeries: Math.random() < 0.6 ? pick(BOOK_SERIES) : '',
                    indexedIn: Math.random() < 0.5 ? pick(['Scopus', 'Web of Science']) : '',
                    facultyId: userFacultyId,
                    claimedBy,
                    authorNo,
                    isStudentScholar: studentScholars.isStudentScholar,
                    studentScholars: studentScholars.studentScholars,
                    subjectArea,
                    subjectCategories
                };

                docs.push(doc);
                totalChapters++;
            }
        }

        if (!docs.length) {
            console.log('❌ Nothing to insert.');
            return;
        }

        console.log(`\n📊 Total chapters to insert: ${totalChapters}`);
        console.log(`📚 Unique chapter titles: ${usedChapterTitles.size}`);
        console.log(`📖 Unique book titles: ${usedBookTitles.size}`);
        console.log(`🔗 Unique ISBNs: ${usedISBNs.size}`);

        // Test validation
        console.log('\n🧪 Testing first document validation...');
        const testDoc = docs[0];
        try {
            const chapterTest = new BookChapter(testDoc);
            await chapterTest.validate();
            console.log('✅ Test document validation PASSED');
            console.log(`   Chapter: ${testDoc.chapterTitle}`);
            console.log(`   Book: ${testDoc.bookTitle}`);
            console.log(`   Subject Area: ${testDoc.subjectArea}`);
        } catch (testError) {
            console.error('❌ Test document validation FAILED:', testError.message);
            return;
        }

        // Insert in batches
        const batchSize = 500;
        let insertedCount = 0;

        console.log(`\n🔄 Inserting chapters in batches of ${batchSize}...`);

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            try {
                const result = await BookChapter.insertMany(batch, { ordered: false });
                insertedCount += result.length;
                console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${result.length} chapters (Total: ${insertedCount})`);
            } catch (error) {
                console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);

                for (const doc of batch) {
                    try {
                        await BookChapter.create(doc);
                        insertedCount++;
                    } catch (singleError) {
                        console.error(`❌ Failed: "${doc.chapterTitle}" - ${singleError.message}`);
                    }
                }
            }
        }

        console.log(`\n✅ Successfully inserted ${insertedCount} book chapters out of ${totalChapters} generated`);

        const finalCount = await BookChapter.countDocuments();
        console.log(`📊 Final count in database: ${finalCount}`);

        if (finalCount > 0) {
            const created = await BookChapter.find().lean();

            console.log('\n📈 Chapter Distribution:');
            console.log('========================');

            // By indexing
            const scopusCount = created.filter(c => c.indexedIn === 'Scopus').length;
            const wosCount = created.filter(c => c.indexedIn === 'Web of Science').length;
            const notIndexed = created.filter(c => !c.indexedIn).length;

            console.log(`\n📑 Indexing Distribution:`);
            console.log(`Scopus: ${scopusCount}`);
            console.log(`Web of Science: ${wosCount}`);
            console.log(`Not Indexed: ${notIndexed}`);

            // Sample chapters
            console.log('\n📋 Sample Book Chapters:');
            console.log('========================');
            created.slice(0, 3).forEach((chapter, index) => {
                const user = users.find(u => u.facultyId === chapter.facultyId);
                console.log(`${index + 1}. "${chapter.chapterTitle}"`);
                console.log(`   Book: ${chapter.bookTitle}`);
                console.log(`   Publisher: ${chapter.publisher}`);
                console.log(`   Faculty: ${user?.fullName}`);
                console.log(`   Year: ${chapter.year}`);
                console.log('');
            });
        }

        console.log('✨ Book chapter seeding completed!');

    } catch (err) {
        console.error('❌ Error seeding book chapters:', err.message);
        if (err.name === 'ValidationError') {
            Object.values(err.errors).forEach(error => {
                console.error(`  - ${error.path}: ${error.message}`);
            });
        }
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();

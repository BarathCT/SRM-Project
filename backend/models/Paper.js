import mongoose from 'mongoose';

const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isCorresponding: { type: Boolean, default: false }
}, { _id: false });

const StudentScholarSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  id:   { type: String, required: true, trim: true }
}, { _id: false });

const PaperSchema = new mongoose.Schema({
  authors: {
    type: [AuthorSchema],
    validate: [v => v.length > 0 && v.length <= 15, 'Authors must be 1–15']
  },
  title: { type: String, required: true, trim: true },
  journal: { type: String, required: true, trim: true },
  publisher: { type: String, required: true, trim: true },
  volume: { type: String, default: '' },
  issue:  { type: String, default: '' },
  pageNo: { type: String, default: '' },
  doi: { type: String, required: true, trim: true, unique: true, index: true },
  publicationType: { 
    type: String, 
    enum: ['scopus','sci','webOfScience'],
    required: true
  },
  facultyId: { type: String, required: true, index: true },
  publicationId: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1900, max: 3000 },
  claimedBy: { type: String, required: true, trim: true },
  authorNo: { type: String, required: true, trim: true }, // keep string to allow "C"
  isStudentScholar: { type: String, enum: ['yes','no'], required: true },
  studentScholars: {
    type: [StudentScholarSchema],
    default: [],
    validate: {
      validator: function (arr) {
        if (this.isStudentScholar === 'yes') return Array.isArray(arr) && arr.length > 0;
        return true;
      },
      message: 'At least one student scholar must be added.'
    }
  },
  qRating: { type: String, enum: ['Q1','Q2','Q3','Q4'], required: true },
  typeOfIssue: { type: String, enum: ['Regular Issue','Special Issue'], required: true },
  
  // Subject Area and Categories
  subjectArea: {
    type: String,
    enum: [
      'Agricultural and Biological Sciences',
      'Arts and Humanities',
      'Biochemistry, Genetics and Molecular Biology',
      'Business, Management and Accounting',
      'Chemical Engineering',
      'Chemistry',
      'Computer Science',
      'Decision Sciences',
      'Earth and Planetary Sciences',
      'Economics, Econometrics and Finance',
      'Energy',
      'Engineering',
      'Environmental Science',
      'Immunology and Microbiology',
      'Materials Science',
      'Mathematics',
      'Medicine',
      'Neuroscience',
      'Nursing',
      'Pharmacology, Toxicology and Pharmaceutics',
      'Physics and Astronomy',
      'Psychology',
      'Social Sciences',
      'Veterinary',
      'Dentistry',
      'Health Professions',
      'Multidisciplinary'
    ],
    required: true
  },
  
  subjectCategories: {
    type: [String],
    validate: {
      validator: function(categories) {
        // Check if at least one category is selected
        if (!Array.isArray(categories) || categories.length === 0) {
          return false;
        }
        
        // Define valid categories for each subject area
        const validCategories = {
          'Agricultural and Biological Sciences': [
            'Agronomy and Crop Science', 'Animal Science and Zoology', 'Aquatic Science',
            'Ecology, Evolution, Behavior and Systematics', 'Food Science', 'Forestry',
            'Horticulture', 'Insect Science', 'Plant Science', 'Soil Science',
            'Agricultural and Biological Sciences (miscellaneous)'
          ],
          'Arts and Humanities': [
            'Archeology', 'Arts and Humanities (miscellaneous)', 'Classics', 'Conservation',
            'History', 'History and Philosophy of Science', 'Language and Linguistics',
            'Literature and Literary Theory', 'Music', 'Philosophy', 'Religious Studies',
            'Visual Arts and Performing Arts'
          ],
          'Biochemistry, Genetics and Molecular Biology': [
            'Aging', 'Biochemistry', 'Biochemistry, Genetics and Molecular Biology (miscellaneous)',
            'Biophysics', 'Biotechnology', 'Cancer Research', 'Cell Biology', 'Clinical Biochemistry',
            'Developmental Biology', 'Endocrinology', 'Genetics', 'Molecular Biology',
            'Molecular Medicine', 'Structural Biology'
          ],
          'Business, Management and Accounting': [
            'Accounting', 'Business and International Management', 'Business, Management and Accounting (miscellaneous)',
            'Industrial and Manufacturing Engineering', 'Management Information Systems',
            'Management of Technology and Innovation', 'Marketing',
            'Organizational Behavior and Human Resource Management', 'Strategy and Management',
            'Tourism, Leisure and Hospitality Management'
          ],
          'Chemical Engineering': [
            'Bioengineering', 'Catalysis', 'Chemical Engineering (miscellaneous)',
            'Chemical Health and Safety', 'Colloid and Surface Chemistry', 'Filtration and Separation',
            'Fluid Flow and Transfer Processes', 'Process Chemistry and Technology'
          ],
          'Chemistry': [
            'Analytical Chemistry', 'Chemistry (miscellaneous)', 'Electrochemistry',
            'Inorganic Chemistry', 'Organic Chemistry', 'Physical and Theoretical Chemistry', 'Spectroscopy'
          ],
          'Computer Science': [
            'Artificial Intelligence', 'Computational Theory and Mathematics',
            'Computer Graphics and Computer-Aided Design', 'Computer Networks and Communications',
            'Computer Science Applications', 'Computer Science (miscellaneous)',
            'Computer Vision and Pattern Recognition', 'Hardware and Architecture',
            'Human-Computer Interaction', 'Information Systems', 'Signal Processing', 'Software'
          ],
          'Decision Sciences': [
            'Decision Sciences (miscellaneous)', 'Information Systems and Management',
            'Management Science and Operations Research'
          ],
          'Earth and Planetary Sciences': [
            'Atmospheric Science', 'Computers in Earth Sciences', 'Earth and Planetary Sciences (miscellaneous)',
            'Earth-Surface Processes', 'Economic Geology', 'Geochemistry and Petrology', 'Geology',
            'Geophysics', 'Geotechnical Engineering and Engineering Geology', 'Oceanography',
            'Paleontology', 'Space and Planetary Science', 'Stratigraphy'
          ],
          'Economics, Econometrics and Finance': [
            'Economics and Econometrics', 'Economics, Econometrics and Finance (miscellaneous)', 'Finance'
          ],
          'Energy': [
            'Energy Engineering and Power Technology', 'Energy (miscellaneous)', 'Fuel Technology',
            'Nuclear Energy and Engineering', 'Renewable Energy, Sustainability and the Environment'
          ],
          'Engineering': [
            'Aerospace Engineering', 'Automotive Engineering', 'Biomedical Engineering',
            'Civil and Structural Engineering', 'Control and Systems Engineering',
            'Electrical and Electronic Engineering', 'Engineering (miscellaneous)',
            'Industrial and Manufacturing Engineering', 'Mechanical Engineering',
            'Ocean Engineering', 'Safety, Risk, Reliability and Quality'
          ],
          'Environmental Science': [
            'Ecological Modeling', 'Ecology', 'Environmental Chemistry', 'Environmental Engineering',
            'Environmental Science (miscellaneous)', 'Global and Planetary Change',
            'Health, Toxicology and Mutagenesis', 'Management, Monitoring, Policy and Law',
            'Nature and Landscape Conservation', 'Pollution', 'Waste Management and Disposal',
            'Water Science and Technology'
          ],
          'Immunology and Microbiology': [
            'Applied Microbiology and Biotechnology', 'Immunology',
            'Immunology and Microbiology (miscellaneous)', 'Microbiology', 'Parasitology', 'Virology'
          ],
          'Materials Science': [
            'Biomaterials', 'Ceramics and Composites', 'Electronic, Optical and Magnetic Materials',
            'Materials Chemistry', 'Materials Science (miscellaneous)', 'Metals and Alloys',
            'Polymers and Plastics', 'Surfaces, Coatings and Films'
          ],
          'Mathematics': [
            'Algebra and Number Theory', 'Analysis', 'Applied Mathematics', 'Computational Mathematics',
            'Control and Optimization', 'Discrete Mathematics and Combinatorics', 'Geometry and Topology',
            'Logic', 'Mathematical Physics', 'Mathematics (miscellaneous)', 'Modeling and Simulation',
            'Numerical Analysis', 'Statistics and Probability', 'Theoretical Computer Science'
          ],
          'Medicine': [
            'Anesthesiology and Pain Medicine', 'Biochemistry (medical)', 'Cardiology and Cardiovascular Medicine',
            'Critical Care and Intensive Care Medicine', 'Complementary and Alternative Medicine',
            'Dermatology', 'Drug Discovery', 'Emergency Medicine', 'Endocrinology, Diabetes and Metabolism',
            'Epidemiology', 'Family Practice', 'Gastroenterology', 'Geriatrics and Gerontology',
            'Health Informatics', 'Health Policy', 'Hematology', 'Hepatology', 'Histology and Pathology',
            'Immunology and Allergy', 'Internal Medicine', 'Medicine (miscellaneous)',
            'Microbiology (medical)', 'Nephrology', 'Neurology (clinical)', 'Obstetrics and Gynecology',
            'Oncology', 'Ophthalmology', 'Orthopedics and Sports Medicine', 'Otorhinolaryngology',
            'Pathology and Forensic Medicine', 'Pediatrics, Perinatology and Child Health',
            'Pharmacology (medical)', 'Physiology (medical)', 'Psychiatry and Mental Health',
            'Public Health, Environmental and Occupational Health', 'Pulmonary and Respiratory Medicine',
            'Radiology, Nuclear Medicine and Imaging', 'Rehabilitation', 'Reproductive Medicine',
            'Reviews and References (medical)', 'Rheumatology', 'Surgery', 'Transplantation', 'Urology'
          ],
          'Neuroscience': [
            'Behavioral Neuroscience', 'Biological Psychiatry', 'Cellular and Molecular Neuroscience',
            'Cognitive Neuroscience', 'Developmental Neuroscience', 'Endocrine and Autonomic Systems',
            'Neurology', 'Neuroscience (miscellaneous)', 'Sensory Systems'
          ],
          'Nursing': [
            'Advanced and Specialized Nursing', 'Assessment and Diagnosis', 'Care Planning',
            'Community and Home Care', 'Critical Care Nursing', 'Emergency Nursing',
            'Fundamentals and Skills', 'Gerontology', 'Issues, Ethics and Legal Aspects',
            'Leadership and Management', 'Maternity and Midwifery', 'Nurse Assisting',
            'Nursing (miscellaneous)', 'Nutrition and Dietetics', 'Oncology (nursing)',
            'Pathophysiology', 'Pediatric Nursing', 'Pharmacology (nursing)',
            'Psychiatric Mental Health', 'Public Health, Environmental and Occupational Health',
            'Research and Theory', 'Review and Exam Preparation'
          ],
          'Pharmacology, Toxicology and Pharmaceutics': [
            'Drug Discovery', 'Pharmaceutical Science', 'Pharmacology',
            'Pharmacology, Toxicology and Pharmaceutics (miscellaneous)', 'Toxicology'
          ],
          'Physics and Astronomy': [
            'Acoustics and Ultrasonics', 'Astronomy and Astrophysics', 'Atomic and Molecular Physics, and Optics',
            'Condensed Matter Physics', 'Instrumentation', 'Nuclear and High Energy Physics',
            'Physics and Astronomy (miscellaneous)', 'Radiation', 'Statistical and Nonlinear Physics',
            'Surfaces and Interfaces'
          ],
          'Psychology': [
            'Applied Psychology', 'Clinical Psychology', 'Developmental and Educational Psychology',
            'Experimental and Cognitive Psychology', 'Neuropsychology and Physiological Psychology',
            'Psychology (miscellaneous)', 'Social Psychology'
          ],
          'Social Sciences': [
            'Anthropology', 'Archeology', 'Communication', 'Cultural Studies', 'Demography',
            'Development', 'Education', 'Gender Studies', 'Geography, Planning and Development',
            'Health (social science)', 'Human Factors and Ergonomics', 'Law',
            'Library and Information Sciences', 'Linguistics and Language',
            'Political Science and International Relations', 'Public Administration', 'Safety Research',
            'Social Sciences (miscellaneous)', 'Social Work', 'Sociology and Political Science',
            'Transportation', 'Urban Studies'
          ],
          'Veterinary': [
            'Equine', 'Food Animals', 'Small Animals', 'Veterinary (miscellaneous)'
          ],
          'Dentistry': [
            'Dental Assisting', 'Dental Hygiene', 'Dentistry (miscellaneous)',
            'Oral Surgery', 'Orthodontics', 'Periodontics'
          ],
          'Health Professions': [
            'Chiropractics', 'Complementary and Manual Therapy', 'Emergency Medical Services',
            'Health Information Management', 'Health Professions (miscellaneous)',
            'Medical Assisting and Transcription', 'Medical Laboratory Technology',
            'Occupational Therapy', 'Optometry', 'Pharmacy',
            'Physical Therapy, Sports Therapy and Rehabilitation', 'Podiatry',
            'Radiological and Ultrasound Technology', 'Respiratory Care', 'Speech and Hearing'
          ],
          'Multidisciplinary': ['Multidisciplinary']
        };
        
        // Get valid categories for the selected subject area
        const allowedCategories = validCategories[this.subjectArea] || [];
        
        // Check if all selected categories are valid for the subject area
        return categories.every(category => allowedCategories.includes(category));
      },
      message: 'Selected categories must be valid for the chosen subject area and at least one category must be selected.'
    },
    required: true
  }
}, { timestamps: true });

// Index for better query performance
PaperSchema.index({ subjectArea: 1, subjectCategories: 1 });

export default mongoose.model('Paper', PaperSchema);
// backend/models/Paper.js
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
    enum: ['scopus','sci','webOfScience','pubmed','abdc'],
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
  typeOfIssue: { type: String, enum: ['Regular Issue','Special Issue'], required: true }
}, { timestamps: true });

export default mongoose.model('Paper', PaperSchema);

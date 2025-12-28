import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const StudentScholarSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    id: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const BookChapterSchema = new mongoose.Schema(
  {
    // Core
    chapterTitle: { type: String, required: true, trim: true },
    bookTitle: { type: String, required: true, trim: true },

    authors: {
      type: [AuthorSchema],
      validate: [v => v.length > 0, "At least one author required"]
    },

    editors: {
      type: [String],
      required: true
    },

    chapterNumber: { type: String, default: "" },

    year: { type: Number, required: true, min: 1900, max: 3000 },

    publisher: { type: String, required: true, trim: true },

    edition: { type: String, default: "" },
    volume: { type: String, default: "" },

    isbn: { type: String, required: true, trim: true },
    doi: { type: String, default: "" },

    pageRange: { type: String, required: true },

    bookSeries: { type: String, default: "" },

    indexedIn: {
      type: String,
      enum: ["Scopus", "Web of Science", ""],
      default: ""
    },

    // Ownership
    facultyId: { type: String, required: true, index: true },
    claimedBy: { type: String, required: true },
    authorNo: { type: String, required: true },

    // Student Scholar
    isStudentScholar: {
      type: String,
      enum: ["yes", "no"],
      required: true
    },

    studentScholars: {
      type: [StudentScholarSchema],
      default: [],
      validate: {
        validator: function (arr) {
          if (this.isStudentScholar === "yes") return arr.length > 0;
          return true;
        },
        message: "Student scholar details required"
      }
    },

    // Classification
    subjectArea: { type: String, required: true },
    subjectCategories: {
      type: [String],
      validate: [v => v.length > 0, "At least one category required"]
    }
  },
  { timestamps: true }
);

// Indexes for pagination and filtering optimization
BookChapterSchema.index({ facultyId: 1, createdAt: -1 });
BookChapterSchema.index({ year: 1 });
BookChapterSchema.index({ subjectArea: 1 });
BookChapterSchema.index({ createdAt: -1 });

export default mongoose.model("BookChapter", BookChapterSchema);

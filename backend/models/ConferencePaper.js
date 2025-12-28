import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isCorresponding: { type: Boolean, default: false }
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

const ConferencePaperSchema = new mongoose.Schema(
  {
    // Core
    title: { type: String, required: true, trim: true },
    authors: {
      type: [AuthorSchema],
      validate: [v => v.length > 0, "At least one author required"]
    },

    year: { type: Number, required: true, min: 1900, max: 3000 },

    // Conference details
    conferenceName: { type: String, required: true, trim: true },
    conferenceShortName: { type: String, default: "" },

    conferenceType: {
      type: String,
      enum: ["International", "National"],
      required: true
    },

    conferenceMode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      required: true
    },

    conferenceLocation: {
      city: { type: String, required: true },
      country: { type: String, required: true }
    },

    conferenceStartDate: { type: Date, required: true },
    conferenceEndDate: { type: Date, required: true },

    organizer: { type: String, required: true, trim: true },

    proceedingsTitle: { type: String, default: "" },
    proceedingsPublisher: { type: String, required: true },

    isbn: { type: String, default: "" },
    doi: { type: String, default: "" },
    pageNo: { type: String, default: "" },

    presentationType: {
      type: String,
      enum: ["Oral", "Poster", ""],
      default: ""
    },

    acceptanceRate: { type: String, default: "" },

    indexedIn: {
      type: String,
      enum: ["Scopus", "Web of Science", ""],
      default: ""
    },

    // Ownership & academic
    facultyId: { type: String, required: true, index: true },
    claimedBy: { type: String, required: true },
    authorNo: { type: String, required: true },

    // Student scholar
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

// Indexes for pagination queries
ConferencePaperSchema.index({ createdAt: -1 });
ConferencePaperSchema.index({ facultyId: 1, createdAt: -1 });

export default mongoose.model("ConferencePaper", ConferencePaperSchema);

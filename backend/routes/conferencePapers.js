import express from "express";
import ConferencePaper from "../models/ConferencePaper.js";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// CREATE conference paper
router.post("/", verifyToken, async (req, res) => {
  try {
    const body = req.body;

    const paper = new ConferencePaper({
      ...body,
      year: Number(body.year),
      facultyId: req.user.facultyId
    });

    await paper.save();

    res.status(201).json({
      message: "Conference paper uploaded successfully",
      paper
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: err.message || "Conference paper validation failed"
    });
  }
});

// GET logged-in user's conference papers
router.get("/my", verifyToken, async (req, res) => {
  try {
    const papers = await ConferencePaper.find({
      facultyId: req.user.facultyId
    }).sort({ createdAt: -1 });

    res.json(papers);
  } catch (err) {
    console.error("Error fetching conference papers:", err);
    res.status(500).json({ error: "Server error while fetching conference papers" });
  }
});

// Helper function to check access
const canAccessInstitute = (user, college, institute) => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'campus_admin') {
    return user.college === college && user.institute === institute;
  }
  return false;
};

// GET /api/conference-papers/institute - Get conference papers for specific college/institute
router.get("/institute", verifyToken, async (req, res) => {
  try {
    const { college, institute } = req.query;

    if (!canAccessInstitute(req.user, college, institute)) {
      return res.status(403).json({ error: "Access denied to institute data" });
    }

    // Get all faculty from the specified college and institute
    const facultyUsers = await User.find({
      college: college,
      institute: institute,
      role: { $in: ["faculty", "campus_admin"] },
      isActive: true
    }).select("facultyId fullName department email");

    if (!facultyUsers.length) {
      return res.json([]);
    }

    const facultyIds = facultyUsers.map(user => user.facultyId);

    // Get papers from these faculty members
    const papers = await ConferencePaper.find({
      facultyId: { $in: facultyIds }
    }).sort({ createdAt: -1 });

    // Enhance papers with faculty information
    const enhancedPapers = papers.map(paper => {
      const faculty = facultyUsers.find(user => user.facultyId === paper.facultyId);
      return {
        ...paper.toObject(),
        facultyName: faculty?.fullName || "Unknown Faculty",
        facultyDepartment: faculty?.department || "Unknown Department",
        facultyEmail: faculty?.email || ""
      };
    });

    res.json(enhancedPapers);
  } catch (err) {
    console.error("Institute conference papers fetch error:", err);
    res.status(500).json({ error: "Server error while fetching institute conference papers" });
  }
});

// PUT /api/conference-papers/:id - Update conference paper
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid conference paper ID" });
    }

    const paper = await ConferencePaper.findById(id);
    if (!paper) {
      return res.status(404).json({ error: "Conference paper not found" });
    }

    // Check permissions
    let canEdit = false;
    if (req.user?.role === "super_admin") {
      canEdit = true;
    } else if (req.user?.role === "campus_admin") {
      const paperAuthor = await User.findOne({ facultyId: paper.facultyId });
      if (paperAuthor &&
        paperAuthor.college === req.user.college &&
        paperAuthor.institute === req.user.institute) {
        canEdit = true;
      }
    } else if (req.user?.facultyId === paper.facultyId) {
      canEdit = true;
    }

    if (!canEdit) {
      return res.status(403).json({ error: "Not authorized to edit this conference paper" });
    }

    const updateData = {
      title: req.body.title,
      authors: req.body.authors,
      year: Number.parseInt(req.body.year, 10),
      conferenceName: req.body.conferenceName,
      conferenceShortName: req.body.conferenceShortName || "",
      conferenceType: req.body.conferenceType,
      conferenceMode: req.body.conferenceMode,
      conferenceLocation: req.body.conferenceLocation,
      conferenceStartDate: req.body.conferenceStartDate,
      conferenceEndDate: req.body.conferenceEndDate,
      organizer: req.body.organizer,
      proceedingsTitle: req.body.proceedingsTitle || "",
      proceedingsPublisher: req.body.proceedingsPublisher,
      isbn: req.body.isbn || "",
      doi: req.body.doi || "",
      pageNo: req.body.pageNo || "",
      presentationType: req.body.presentationType || "",
      acceptanceRate: req.body.acceptanceRate || "",
      indexedIn: req.body.indexedIn || "",
      claimedBy: req.body.claimedBy,
      authorNo: String(req.body.authorNo),
      isStudentScholar: req.body.isStudentScholar,
      studentScholars: req.body.isStudentScholar === "yes" ? (req.body.studentScholars || []) : [],
      subjectArea: req.body.subjectArea,
      subjectCategories: req.body.subjectCategories,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedPaper = await ConferencePaper.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({
      message: "Conference paper updated successfully",
      paper: updatedPaper
    });
  } catch (err) {
    console.error("Conference paper update error:", err);
    if (err?.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: "Validation failed", details: messages });
    }
    return res.status(500).json({ error: "Server error while updating conference paper" });
  }
});

// DELETE /api/conference-papers/:id
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid conference paper ID" });
    }

    const paper = await ConferencePaper.findById(id);
    if (!paper) {
      return res.status(404).json({ error: "Conference paper not found" });
    }

    // Check permissions
    let canDelete = false;
    if (req.user?.role === "super_admin") {
      canDelete = true;
    } else if (req.user?.role === "campus_admin") {
      const paperAuthor = await User.findOne({ facultyId: paper.facultyId });
      if (paperAuthor &&
        paperAuthor.college === req.user.college &&
        paperAuthor.institute === req.user.institute) {
        canDelete = true;
      }
    } else if (req.user?.facultyId === paper.facultyId) {
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ error: "Not authorized to delete this conference paper" });
    }

    await ConferencePaper.findByIdAndDelete(id);
    return res.json({
      message: "Conference paper deleted successfully",
      id,
      deletedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error deleting conference paper:", err);
    return res.status(500).json({ error: "Server error while deleting conference paper" });
  }
  const papers = await ConferencePaper.find({
    facultyId: req.user.facultyId
  }).sort({ createdAt: -1 });

  res.json(papers);
});

export default router;

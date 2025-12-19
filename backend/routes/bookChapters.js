import express from "express";
import BookChapter from "../models/BookChapter.js";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// CREATE book chapter
router.post("/", verifyToken, async (req, res) => {
  try {
    const body = req.body;

    const chapter = new BookChapter({
      ...body,
      year: Number(body.year),
      facultyId: req.user.facultyId
    });

    await chapter.save();

    res.status(201).json({
      message: "Book chapter uploaded successfully",
      chapter
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: err.message || "Book chapter validation failed"
    });
  }
});

// GET logged-in user's book chapters
router.get("/my", verifyToken, async (req, res) => {
  try {
    const chapters = await BookChapter.find({
      facultyId: req.user.facultyId
    }).sort({ createdAt: -1 });

    res.json(chapters);
  } catch (err) {
    console.error("Error fetching book chapters:", err);
    res.status(500).json({ error: "Server error while fetching book chapters" });
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

// GET /api/book-chapters/institute - Get book chapters for specific college/institute
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

    // Get chapters from these faculty members
    const chapters = await BookChapter.find({
      facultyId: { $in: facultyIds }
    }).sort({ createdAt: -1 });

    // Enhance chapters with faculty information
    const enhancedChapters = chapters.map(chapter => {
      const faculty = facultyUsers.find(user => user.facultyId === chapter.facultyId);
      return {
        ...chapter.toObject(),
        facultyName: faculty?.fullName || "Unknown Faculty",
        facultyDepartment: faculty?.department || "Unknown Department",
        facultyEmail: faculty?.email || ""
      };
    });

    res.json(enhancedChapters);
  } catch (err) {
    console.error("Institute book chapters fetch error:", err);
    res.status(500).json({ error: "Server error while fetching institute book chapters" });
  }
});

// PUT /api/book-chapters/:id - Update book chapter
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid book chapter ID" });
    }

    const chapter = await BookChapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ error: "Book chapter not found" });
    }

    // Check permissions
    let canEdit = false;
    if (req.user?.role === "super_admin") {
      canEdit = true;
    } else if (req.user?.role === "campus_admin") {
      const chapterAuthor = await User.findOne({ facultyId: chapter.facultyId });
      if (chapterAuthor &&
        chapterAuthor.college === req.user.college &&
        chapterAuthor.institute === req.user.institute) {
        canEdit = true;
      }
    } else if (req.user?.facultyId === chapter.facultyId) {
      canEdit = true;
    }

    if (!canEdit) {
      return res.status(403).json({ error: "Not authorized to edit this book chapter" });
    }

    const updateData = {
      chapterTitle: req.body.chapterTitle,
      bookTitle: req.body.bookTitle,
      authors: req.body.authors,
      editors: req.body.editors,
      chapterNumber: req.body.chapterNumber || "",
      year: Number.parseInt(req.body.year, 10),
      publisher: req.body.publisher,
      edition: req.body.edition || "",
      volume: req.body.volume || "",
      isbn: req.body.isbn,
      doi: req.body.doi || "",
      pageRange: req.body.pageRange,
      bookSeries: req.body.bookSeries || "",
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

    const updatedChapter = await BookChapter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({
      message: "Book chapter updated successfully",
      chapter: updatedChapter
    });
  } catch (err) {
    console.error("Book chapter update error:", err);
    if (err?.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: "Validation failed", details: messages });
    }
    return res.status(500).json({ error: "Server error while updating book chapter" });
  }
});

// DELETE /api/book-chapters/:id
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid book chapter ID" });
    }

    const chapter = await BookChapter.findById(id);
    if (!chapter) {
      return res.status(404).json({ error: "Book chapter not found" });
    }

    // Check permissions
    let canDelete = false;
    if (req.user?.role === "super_admin") {
      canDelete = true;
    } else if (req.user?.role === "campus_admin") {
      const chapterAuthor = await User.findOne({ facultyId: chapter.facultyId });
      if (chapterAuthor &&
        chapterAuthor.college === req.user.college &&
        chapterAuthor.institute === req.user.institute) {
        canDelete = true;
      }
    } else if (req.user?.facultyId === chapter.facultyId) {
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ error: "Not authorized to delete this book chapter" });
    }

    await BookChapter.findByIdAndDelete(id);
    return res.json({
      message: "Book chapter deleted successfully",
      id,
      deletedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error deleting book chapter:", err);
    return res.status(500).json({ error: "Server error while deleting book chapter" });
  }
});

export default router;

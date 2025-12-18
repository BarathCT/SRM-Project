import express from "express";
import BookChapter from "../models/BookChapter.js";
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
  const chapters = await BookChapter.find({
    facultyId: req.user.facultyId
  }).sort({ createdAt: -1 });

  res.json(chapters);
});

export default router;

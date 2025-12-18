import express from "express";
import ConferencePaper from "../models/ConferencePaper.js";
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
  const papers = await ConferencePaper.find({
    facultyId: req.user.facultyId
  }).sort({ createdAt: -1 });

  res.json(papers);
});

export default router;

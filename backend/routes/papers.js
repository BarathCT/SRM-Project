import express from 'express';
import Paper from '../models/Paper.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// DELETE /api/papers/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid paper ID' });
    }

    // Find paper
    const paper = await Paper.findById(id);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Role-based deletion: only owner (facultyId) or super_admin or campus_admin
    if (
      req.user?.facultyId !== paper.facultyId &&
      req.user?.role !== 'super_admin' &&
      req.user?.role !== 'campus_admin'
    ) {
      return res.status(403).json({ error: 'Not authorized to delete this paper' });
    }

    await Paper.findByIdAndDelete(id);
    return res.json({ message: 'Paper deleted', id });
  } catch (err) {
    console.error('Error deleting paper:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/doi/:doi', verifyToken, async (req, res) => {
  try {
    const doi = req.params.doi;
    if (!doi) return res.status(400).json({ error: 'DOI is required' });
    const exists = await Paper.exists({ doi: doi.trim() });
    res.json({ exists: !!exists });
  } catch (e) {
    console.error('DOI check error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const b = req.body;
    const payload = {
      authors: b.authors,
      title: b.title,
      journal: b.journalName,
      publisher: b.publisherName,
      volume: b.volume || '',
      issue: b.issue || '',
      pageNo: b.pageNo || '',
      doi: b.doi,
      publicationType: b.publication,
      facultyId: req.user?.facultyId,
      publicationId: b.publicationId,
      year: Number.parseInt(b.year, 10),
      claimedBy: b.claimedBy,
      authorNo: String(b.authorNo),
      isStudentScholar: b.isStudentScholar,
      studentScholars: b.isStudentScholar === 'yes' ? (b.studentScholars || []) : [],
      qRating: b.qRating?.toUpperCase(),
      typeOfIssue: b.issueType
    };

    if (!payload.facultyId) {
      return res.status(401).json({ error: 'Invalid token: facultyId missing' });
    }

    const paper = new Paper(payload);
    const saved = await paper.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('Paper submission error:', err);
    if (err?.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    if (err?.code === 11000 && err?.keyPattern?.doi) {
      return res.status(409).json({ error: 'Duplicate DOI' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    if (!req.user?.facultyId) {
      return res.status(401).json({ error: 'Invalid token: facultyId missing' });
    }
    const papers = await Paper.find({ facultyId: req.user.facultyId }).sort({ createdAt: -1 });
    res.json(papers);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
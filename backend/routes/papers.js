import express from 'express';
import Paper from '../models/Paper.js';
import User from '../models/User.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Helper function to check if user can access institute data
const canAccessInstitute = (user, targetCollege, targetInstitute) => {
  if (user.role === 'super_admin') return true;
  if (user.role === 'campus_admin') {
    return user.college === targetCollege && user.institute === targetInstitute;
  }
  return false;
};

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

    // Enhanced role-based deletion with institute check for campus admin
    let canDelete = false;

    if (req.user?.role === 'super_admin') {
      canDelete = true;
    } else if (req.user?.role === 'campus_admin') {
      // Campus admin can delete papers from their institute
      const paperAuthor = await User.findOne({ facultyId: paper.facultyId });
      if (paperAuthor && 
          paperAuthor.college === req.user.college && 
          paperAuthor.institute === req.user.institute) {
        canDelete = true;
      }
    } else if (req.user?.facultyId === paper.facultyId) {
      // Faculty can delete their own papers
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this paper' });
    }

    await Paper.findByIdAndDelete(id);
    return res.json({ 
      message: 'Paper deleted successfully', 
      id,
      deletedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error deleting paper:', err);
    return res.status(500).json({ error: 'Server error while deleting paper' });
  }
});

// PUT /api/papers/:id - Update paper
router.put('/:id', verifyToken, async (req, res) => {
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

    // Check permissions (same logic as delete)
    let canEdit = false;

    if (req.user?.role === 'super_admin') {
      canEdit = true;
    } else if (req.user?.role === 'campus_admin') {
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
      return res.status(403).json({ error: 'Not authorized to edit this paper' });
    }

    // Update paper with provided data
    const updateData = {
      title: req.body.title,
      journal: req.body.journal,
      publisher: req.body.publisher,
      year: Number.parseInt(req.body.year, 10),
      qRating: req.body.qRating?.toUpperCase(),
      doi: req.body.doi,
      volume: req.body.volume || '',
      issue: req.body.issue || '',
      pageNo: req.body.pageNo || '',
      publicationType: req.body.publicationType,
      subjectArea: req.body.subjectArea,
      subjectCategories: req.body.subjectCategories,
      publicationId: req.body.publicationId || '',
      typeOfIssue: req.body.typeOfIssue || 'Regular Issue',
      claimedBy: req.body.claimedBy,
      authorNo: String(req.body.authorNo),
      isStudentScholar: req.body.isStudentScholar,
      authors: req.body.authors,
      studentScholars: req.body.isStudentScholar === 'yes' ? (req.body.studentScholars || []) : [],
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedPaper = await Paper.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    return res.json({
      message: 'Paper updated successfully',
      paper: updatedPaper
    });

  } catch (err) {
    console.error('Paper update error:', err);
    if (err?.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    if (err?.code === 11000 && err?.keyPattern?.doi) {
      return res.status(409).json({ error: 'DOI already exists' });
    }
    return res.status(500).json({ error: 'Server error while updating paper' });
  }
});

// GET /api/papers/institute - Get papers for specific college/institute (Campus Admin)
router.get('/institute', verifyToken, async (req, res) => {
  try {
    const { college, institute } = req.query;
    
    // Validate user permissions
    if (!canAccessInstitute(req.user, college, institute)) {
      return res.status(403).json({ error: 'Access denied to institute data' });
    }

    // Get all faculty from the specified college and institute
    const facultyUsers = await User.find({
      college: college,
      institute: institute,
      role: { $in: ['faculty', 'campus_admin'] }, // Include campus_admin papers too
      isActive: true
    }).select('facultyId fullName department email');

    if (!facultyUsers.length) {
      return res.json([]);
    }

    const facultyIds = facultyUsers.map(user => user.facultyId);

    // Get papers from these faculty members
    const papers = await Paper.find({
      facultyId: { $in: facultyIds }
    }).sort({ createdAt: -1 });

    // Enhance papers with faculty information
    const enhancedPapers = papers.map(paper => {
      const faculty = facultyUsers.find(user => user.facultyId === paper.facultyId);
      return {
        ...paper.toObject(),
        facultyName: faculty?.fullName || 'Unknown Faculty',
        facultyDepartment: faculty?.department || 'Unknown Department',
        facultyEmail: faculty?.email || ''
      };
    });

    res.json(enhancedPapers);
  } catch (err) {
    console.error('Institute papers fetch error:', err);
    res.status(500).json({ error: 'Server error while fetching institute papers' });
  }
});

// GET /api/papers/doi/:doi - Check if DOI exists
router.get('/doi/:doi', verifyToken, async (req, res) => {
  try {
    const doi = req.params.doi;
    if (!doi) return res.status(400).json({ error: 'DOI is required' });
    
    const exists = await Paper.exists({ doi: doi.trim() });
    res.json({ exists: !!exists });
  } catch (e) {
    console.error('DOI check error:', e);
    res.status(500).json({ error: 'Server error while checking DOI' });
  }
});

// POST /api/papers - Create new paper
router.post('/', verifyToken, async (req, res) => {
  try {
    const b = req.body;
    
    // Enhanced validation
    if (!b.title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!b.journalName?.trim()) {
      return res.status(400).json({ error: 'Journal name is required' });
    }
    if (!b.publisherName?.trim()) {
      return res.status(400).json({ error: 'Publisher name is required' });
    }
    if (!b.doi?.trim()) {
      return res.status(400).json({ error: 'DOI is required' });
    }

    const payload = {
      authors: b.authors || [],
      title: b.title.trim(),
      journal: b.journalName.trim(),
      publisher: b.publisherName.trim(),
      volume: b.volume || '',
      issue: b.issue || '',
      pageNo: b.pageNo || '',
      doi: b.doi.trim(),
      publicationType: b.publication,
      facultyId: req.user?.facultyId,
      publicationId: b.publicationId || '',
      year: Number.parseInt(b.year, 10),
      claimedBy: b.claimedBy || req.user?.fullName || '',
      authorNo: String(b.authorNo || '1'),
      isStudentScholar: b.isStudentScholar || 'no',
      studentScholars: b.isStudentScholar === 'yes' ? (b.studentScholars || []) : [],
      qRating: b.qRating?.toUpperCase() || 'Q4',
      typeOfIssue: b.issueType || 'Regular Issue',
      subjectArea: b.subjectArea || '',
      subjectCategories: b.subjectCategories || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!payload.facultyId) {
      return res.status(401).json({ error: 'Invalid token: facultyId missing' });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (payload.year < 1900 || payload.year > currentYear + 1) {
      return res.status(400).json({ error: 'Invalid publication year' });
    }

    // Check for duplicate DOI
    const existingPaper = await Paper.findOne({ doi: payload.doi });
    if (existingPaper) {
      return res.status(409).json({ error: 'A paper with this DOI already exists' });
    }

    const paper = new Paper(payload);
    const saved = await paper.save();
    
    return res.status(201).json({
      message: 'Paper created successfully',
      paper: saved
    });
  } catch (err) {
    console.error('Paper submission error:', err);
    if (err?.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    if (err?.code === 11000 && err?.keyPattern?.doi) {
      return res.status(409).json({ error: 'DOI already exists' });
    }
    return res.status(500).json({ error: 'Server error while creating paper' });
  }
});

// GET /api/papers/my - Get current user's papers
router.get('/my', verifyToken, async (req, res) => {
  try {
    if (!req.user?.facultyId) {
      return res.status(401).json({ error: 'Invalid token: facultyId missing' });
    }

    const papers = await Paper.find({ 
      facultyId: req.user.facultyId 
    }).sort({ createdAt: -1 });

    res.json(papers);
  } catch (e) {
    console.error('Error fetching user papers:', e);
    res.status(500).json({ error: 'Server error while fetching papers' });
  }
});

// GET /api/papers/stats/institute - Get institute publication statistics (Campus Admin)
router.get('/stats/institute', verifyToken, async (req, res) => {
  try {
    const { college, institute } = req.query;
    
    if (!canAccessInstitute(req.user, college, institute)) {
      return res.status(403).json({ error: 'Access denied to institute statistics' });
    }

    // Get faculty from institute
    const facultyUsers = await User.find({
      college: college,
      institute: institute,
      role: { $in: ['faculty', 'campus_admin'] },
      isActive: true
    }).select('facultyId fullName department');

    const facultyIds = facultyUsers.map(user => user.facultyId);

    // Get papers and generate statistics
    const papers = await Paper.find({
      facultyId: { $in: facultyIds }
    });

    // Calculate various statistics
    const stats = {
      totalPapers: papers.length,
      totalFaculty: facultyUsers.length,
      activeFaculty: [...new Set(papers.map(p => p.facultyId))].length,
      
      // Q-rating distribution
      qDistribution: papers.reduce((acc, paper) => {
        acc[paper.qRating] = (acc[paper.qRating] || 0) + 1;
        return acc;
      }, {}),

      // Year-wise distribution
      yearDistribution: papers.reduce((acc, paper) => {
        acc[paper.year] = (acc[paper.year] || 0) + 1;
        return acc;
      }, {}),

      // Subject area distribution
      subjectDistribution: papers.reduce((acc, paper) => {
        acc[paper.subjectArea] = (acc[paper.subjectArea] || 0) + 1;
        return acc;
      }, {}),

      // Publication type distribution
      typeDistribution: papers.reduce((acc, paper) => {
        acc[paper.publicationType] = (acc[paper.publicationType] || 0) + 1;
        return acc;
      }, {}),

      // Department-wise statistics
      departmentStats: facultyUsers.reduce((acc, user) => {
        const userPapers = papers.filter(p => p.facultyId === user.facultyId);
        if (!acc[user.department]) {
          acc[user.department] = {
            faculty: 0,
            papers: 0,
            q1Papers: 0,
            recentPapers: 0
          };
        }
        acc[user.department].faculty++;
        acc[user.department].papers += userPapers.length;
        acc[user.department].q1Papers += userPapers.filter(p => p.qRating === 'Q1').length;
        acc[user.department].recentPapers += userPapers.filter(p => p.year >= new Date().getFullYear() - 1).length;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (err) {
    console.error('Institute stats error:', err);
    res.status(500).json({ error: 'Server error while fetching institute statistics' });
  }
});

export default router;
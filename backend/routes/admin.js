import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// ✅ Middleware: Authenticate and attach user info from JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains userId, role, email, college, category
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Helper: Check if the creator has permission to create the specified role
function canCreateRole(creatorRole, targetRole) {
  const rolePermissions = {
    super_admin: ['super_admin', 'campus_admin', 'admin', 'faculty', 'scholar'],
    campus_admin: ['admin', 'faculty', 'scholar'],
    admin: ['faculty', 'scholar']
  };
  return rolePermissions[creatorRole]?.includes(targetRole);
}

// GET: Get all users (filtered by access)
router.get('/users', authenticate, async (req, res) => {
  try {
    const { role, college } = req.user;

    let filter = {};
    if (role === 'super_admin') {
      filter = {}; // see all users
    } else if (role === 'campus_admin' || role === 'admin') {
      filter.college = college;
      if (role === 'admin') {
        filter.role = { $in: ['faculty', 'scholar'] }; // admin only sees faculty & scholar
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Create a new user
router.post('/users', authenticate, async (req, res) => {
  const { email, password, role, college, category } = req.body;
  const creator = req.user;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Permission checks
    if (!canCreateRole(creator.role, role)) {
      return res.status(403).json({ message: `You are not allowed to create a '${role}'` });
    }

    // Campus check
    if (creator.role !== 'super_admin' && college !== creator.college) {
      return res.status(403).json({ message: 'You can only create users in your campus' });
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      college,
      category,
      createdBy: creator.userId
    });

    await newUser.save();

    const responseUser = newUser.toObject();
    delete responseUser.password;

    res.status(201).json({ message: 'User created successfully', user: responseUser });
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

// PUT: Update a user
// PUT: Update a user
router.put('/users/:id', authenticate, async (req, res) => {
  const { role: updaterRole, college: updaterCollege, userId: updaterId } = req.user;

  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    // Prevent self-update of role/college/category
    if (userToUpdate._id.toString() === updaterId) {
      return res.status(403).json({ message: 'You cannot modify your own role, college or category' });
    }

    // Access restriction
    if (updaterRole !== 'super_admin') {
      if (userToUpdate.college !== updaterCollege) {
        return res.status(403).json({ message: 'You can only update users in your campus' });
      }
      if (updaterRole === 'admin' && !['faculty', 'scholar'].includes(userToUpdate.role)) {
        return res.status(403).json({ message: 'Admins can only update faculty or scholar' });
      }
    }

    // Prevent role escalation
    if (req.body.role && !canCreateRole(updaterRole, req.body.role)) {
      return res.status(403).json({ message: `You are not allowed to set role to '${req.body.role}'` });
    }

    // Hash new password if provided
    if (req.body.password) {
      const bcrypt = await import('bcrypt');
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

router.delete('/users/:id', authenticate, async (req, res) => {
  const { role: deleterRole, college: deleterCollege, userId: deleterId } = req.user;

  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (userToDelete._id.toString() === deleterId) {
      return res.status(403).json({ message: 'You cannot delete yourself' });
    }

    // Access restriction
    if (deleterRole !== 'super_admin') {
      if (userToDelete.college !== deleterCollege) {
        return res.status(403).json({ message: 'You can only delete users in your campus' });
      }
      if (deleterRole === 'admin' && !['faculty', 'scholar'].includes(userToDelete.role)) {
        return res.status(403).json({ message: 'Admins can only delete faculty or scholar' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});


export default router;

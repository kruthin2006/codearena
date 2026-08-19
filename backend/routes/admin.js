const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const User = require('../models/User');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { validateProblem } = require('../middleware/validator');
const logger = require('../utils/logger');

// Create problem (Admin/Setter only)
router.post('/problems', auth, adminOnly, validateProblem, async (req, res) => {
  try {
    const problem = new Problem({
      ...req.body,
      setter: req.user.userId
    });

    await problem.save();
    
    logger.info(`Problem created by user ${req.user.userId}`, {
      problemId: problem._id,
      title: problem.title
    });

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      problem
    });
  } catch (error) {
    logger.error('Problem creation error', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update problem (Admin/Setter only)
router.put('/problems/:id', auth, adminOnly, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ 
        success: false,
        message: 'Problem not found' 
      });
    }

    // Check if user is setter of this problem or admin
    if (problem.setter.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'You can only edit your own problems' 
      });
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    logger.info(`Problem updated by user ${req.user.userId}`, {
      problemId: updatedProblem._id
    });

    res.json({
      success: true,
      message: 'Problem updated successfully',
      problem: updatedProblem
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Delete problem (Admin only)
router.delete('/problems/:id', auth, adminOnly, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ 
        success: false,
        message: 'Problem not found' 
      });
    }

    // Delete associated submissions
    await Submission.deleteMany({ problem: req.params.id });
    
    await Problem.findByIdAndDelete(req.params.id);

    logger.info(`Problem deleted by user ${req.user.userId}`, {
      problemId: req.params.id
    });

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all users (Admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get user stats (Admin only)
router.get('/users/:id/stats', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username stats');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const submissions = await Submission.find({ user: req.params.id });
    const accepted = submissions.filter(s => s.status === 'accepted');

    const stats = {
      ...user.stats,
      totalSubmissions: submissions.length,
      acceptedSubmissions: accepted.length,
      acceptanceRate: submissions.length > 0 ? (accepted.length / submissions.length) * 100 : 0,
      languages: submissions.reduce((acc, s) => {
        acc[s.language] = (acc[s.language] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      username: user.username,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get system stats (Admin only)
router.get('/system-stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProblems = await Problem.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const acceptedSubmissions = await Submission.countDocuments({ status: 'accepted' });

    // Get user roles distribution
    const roles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const stats = {
      totalUsers,
      totalProblems,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate: totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0,
      roles: roles.reduce((acc, r) => {
        acc[r._id] = r.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
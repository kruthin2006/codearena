const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all problems
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find()
      .select('title description difficulty sampleInput sampleOutput constraints createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: problems.length,
      problems
    });
  } catch (error) {
    logger.error('Error fetching problems', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get specific problem
router.get('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('setter', 'username email');
    
    if (!problem) {
      return res.status(404).json({ 
        success: false,
        message: 'Problem not found' 
      });
    }
    
    res.json({
      success: true,
      problem
    });
  } catch (error) {
    logger.error('Error fetching problem', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get problems by difficulty
router.get('/filter/:difficulty', auth, async (req, res) => {
  try {
    const { difficulty } = req.params;
    const problems = await Problem.find({ difficulty })
      .select('title description difficulty sampleInput sampleOutput')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: problems.length,
      problems
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
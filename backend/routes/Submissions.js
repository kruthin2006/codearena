const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const auth = require('../middleware/auth');
const executor = require('../utils/pistonExecutor');
const codeHelper = require('../utils/codeHelper');
const logger = require('../utils/logger');

// Run code (test with sample input)
router.post('/run', auth, async (req, res) => {
  try {
    const { problemId, code, language, input } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ 
        success: false,
        message: 'Code and language are required' 
      });
    }

    // Validate language
    if (!['java', 'cpp'].includes(language)) {
      return res.status(400).json({ 
        success: false,
        message: 'Only Java and C++ are supported' 
      });
    }

    // Validate code
    const validation = codeHelper.validateCode(code, language);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Code validation failed',
        errors: validation.errors
      });
    }

    // Get input
    let testInput = input;
    if (!testInput && problemId) {
      const problem = await Problem.findById(problemId);
      if (problem) testInput = problem.sampleInput;
    }

    // Sanitize code
    const sanitizedCode = codeHelper.sanitizeCode(code);

    // Execute
    const result = await executor.executeCode(sanitizedCode, language, testInput || '');
    
    // Format output
    if (result.output) {
      result.output = codeHelper.formatOutput(result.output);
    }

    logger.info(`Code run by user ${req.user.userId}`, {
      language,
      problemId,
      status: result.status
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Run error', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Submit solution (run against all test cases)
router.post('/submit', auth, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    
    if (!problemId || !code || !language) {
      return res.status(400).json({ 
        success: false,
        message: 'Problem ID, code, and language are required' 
      });
    }

    // Validate language
    if (!['java', 'cpp'].includes(language)) {
      return res.status(400).json({ 
        success: false,
        message: 'Only Java and C++ are supported' 
      });
    }

    // Get problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ 
        success: false,
        message: 'Problem not found' 
      });
    }

    // Validate code
    const validation = codeHelper.validateCode(code, language);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Code validation failed',
        errors: validation.errors
      });
    }

    // Create submission record
    const submission = new Submission({
      problem: problemId,
      user: req.user.userId,
      code,
      language,
      status: 'running'
    });

    await submission.save();

    // Sanitize code
    const sanitizedCode = codeHelper.sanitizeCode(code);

    // Run against all test cases
    const results = [];
    let passedCount = 0;
    let totalTestCases = problem.testCases.length;

    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      
      const result = await executor.executeCode(
        sanitizedCode,
        language,
        testCase.input
      );
      
      const passed = result.status === 'success' && 
                    result.output.trim() === testCase.output.trim();
      
      if (passed) passedCount++;

      results.push({
        testCase: testCase._id,
        passed,
        output: result.output || '',
        expected: testCase.output || '',
        executionTime: result.executionTime || 0,
        error: result.error || ''
      });
    }

    // Calculate score
    const score = totalTestCases > 0 ? (passedCount / totalTestCases) * 100 : 0;
    const status = passedCount === totalTestCases ? 'accepted' : 'wrong_answer';

    // Update submission
    submission.results = results;
    submission.totalTestCases = totalTestCases;
    submission.passedTestCases = passedCount;
    submission.score = score;
    submission.status = status;
    
    await submission.save();

    // Update user stats if all tests passed
    if (status === 'accepted') {
      // Check if user has already solved this problem
      const existingSubmission = await Submission.findOne({
        user: req.user.userId,
        problem: problemId,
        status: 'accepted'
      });

      if (!existingSubmission) {
        await User.findByIdAndUpdate(req.user.userId, {
          $inc: { 'stats.problemsSolved': 1 }
        });
      }
    }

    // Update total attempts
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'stats.totalAttempts': 1 }
    });

    logger.info(`Submission by user ${req.user.userId}`, {
      problemId,
      language,
      status,
      score
    });

    res.json({
      success: true,
      submissionId: submission._id,
      status,
      score,
      passedTestCases: passedCount,
      totalTestCases,
      results
    });

  } catch (error) {
    logger.error('Submit error', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get user submissions
router.get('/user', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user.userId })
      .populate('problem', 'title difficulty')
      .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    logger.error('Error fetching submissions', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get specific submission
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title description difficulty')
      .populate('user', 'username email');
    
    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }

    // Check if user owns this submission or is admin
    if (submission.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get statistics for a problem
router.get('/stats/:problemId', auth, async (req, res) => {
  try {
    const { problemId } = req.params;
    
    const submissions = await Submission.find({ problem: problemId });
    const accepted = submissions.filter(s => s.status === 'accepted');
    
    const stats = {
      totalSubmissions: submissions.length,
      acceptedSubmissions: accepted.length,
      acceptanceRate: submissions.length > 0 ? (accepted.length / submissions.length) * 100 : 0,
      averageScore: submissions.length > 0 ? 
        submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length : 0
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
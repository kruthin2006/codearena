const { body, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Validates incoming request data
 */

// Validate registration
exports.validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscore')
    .notEmpty()
    .withMessage('Username is required'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('role')
    .optional()
    .isIn(['student', 'setter', 'admin'])
    .withMessage('Invalid role. Must be student, setter, or admin'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validate login
exports.validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validate problem creation
exports.validateProblem = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters')
    .notEmpty()
    .withMessage('Title is required'),
  
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters')
    .notEmpty()
    .withMessage('Description is required'),
  
  body('sampleInput')
    .trim()
    .notEmpty()
    .withMessage('Sample input is required'),
  
  body('sampleOutput')
    .trim()
    .notEmpty()
    .withMessage('Sample output is required'),
  
  body('constraints')
    .trim()
    .notEmpty()
    .withMessage('Constraints are required'),
  
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  
  body('testCases')
    .isArray({ min: 1 })
    .withMessage('At least one test case is required'),
  
  body('testCases.*.input')
    .notEmpty()
    .withMessage('Test case input is required'),
  
  body('testCases.*.output')
    .notEmpty()
    .withMessage('Test case output is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validate submission
exports.validateSubmission = [
  body('problemId')
    .notEmpty()
    .withMessage('Problem ID is required')
    .isMongoId()
    .withMessage('Invalid problem ID format'),
  
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 100000 })
    .withMessage('Code must be between 1 and 100,000 characters'),
  
  body('language')
    .notEmpty()
    .withMessage('Language is required')
    .isIn(['java', 'cpp'])
    .withMessage('Language must be java or cpp'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validate run request
exports.validateRun = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 100000 })
    .withMessage('Code must be between 1 and 100,000 characters'),
  
  body('language')
    .notEmpty()
    .withMessage('Language is required')
    .isIn(['java', 'cpp'])
    .withMessage('Language must be java or cpp'),
  
  body('problemId')
    .optional()
    .isMongoId()
    .withMessage('Invalid problem ID format'),
  
  body('input')
    .optional()
    .isString()
    .withMessage('Input must be a string'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];
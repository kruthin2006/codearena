/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting request frequency
 */

const rateLimit = require('express-rate-limit');

// General rate limiter - 100 requests per 15 minutes
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter - 5 attempts per hour
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Submission rate limiter - 20 submissions per hour
exports.submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'Too many submissions, please wait before submitting again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API key based rate limiter
exports.apiKeyLimiter = (max, windowMs) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000,
    max: max || 100,
    keyGenerator: (req) => {
      return req.headers['x-api-key'] || req.ip;
    },
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
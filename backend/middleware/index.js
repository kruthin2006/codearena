/**
 * Middleware Index
 * Export all middleware for easy importing
 */

const auth = require('./auth');
const adminOnly = require('./adminOnly');
const errorHandler = require('./errorHandler');
const validator = require('./validator');
const rateLimiter = require('./rateLimiter');
const upload = require('./upload');
const cors = require('./cors');
const logger = require('./logger');

module.exports = {
  auth,
  adminOnly,
  errorHandler,
  validator,
  rateLimiter,
  upload,
  cors,
  logger
};
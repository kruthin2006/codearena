/**
 * Admin/Setter Only Middleware
 * Restricts access to admin and setter roles only
 */
module.exports = (req, res, next) => {
  // Check if user exists in request (set by auth middleware)
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  // Check if user is admin or setter
  if (req.user.role !== 'admin' && req.user.role !== 'setter') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin or Setter privileges required.' 
    });
  }
  
  next();
};
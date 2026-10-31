/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'manager')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorised to access this resource`
    });
  }
  next();
};

module.exports = { authorize };

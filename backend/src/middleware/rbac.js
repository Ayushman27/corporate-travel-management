const Company = require('../models/Company');

/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'manager')
 */
const authorize = (...roles) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userRole = (req.user.role || '').toLowerCase();
  const hasRole = roles.some(r => {
    const roleLower = r.toLowerCase();
    return userRole === roleLower || userRole.startsWith(roleLower) || (roleLower === 'finance' && userRole.includes('finance'));
  });
  if (hasRole) {
    return next();
  }

  // Fallback: If 'admin' is allowed, verify if user is the registered company head
  if (roles.includes('admin') && req.user.companyId && req.user.email) {
    try {
      const company = await Company.findOne({ companyId: req.user.companyId });
      if (company && company.headEmail && req.user.email.toLowerCase().trim() === company.headEmail.toLowerCase().trim()) {
        req.user.role = 'admin';
        return next();
      }
    } catch (_) {}
  }

  return res.status(403).json({
    success: false,
    message: `Role '${req.user.role}' is not authorised to access this resource`
  });
};

module.exports = { authorize };

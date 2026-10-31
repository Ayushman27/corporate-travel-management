const { body, param, validationResult } = require('express-validator');

// Middleware to collect validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const tripRequestRules = [
  body('fromCity').notEmpty().withMessage('fromCity is required'),
  body('toCity').notEmpty().withMessage('toCity is required'),
  body('travelDate').isISO8601().withMessage('travelDate must be a valid ISO date'),
  body('purpose').notEmpty().withMessage('purpose is required'),
];

const approvalRules = [
  param('tripId').notEmpty(),
  body('status').isIn(['approved', 'rejected']).withMessage('status must be approved or rejected'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
];

const companyRegisterRules = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('headName').notEmpty().withMessage('Head name is required'),
  body('headEmail').isEmail().withMessage('Valid email required'),
  body('headPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('hrmsSheetUrl').notEmpty().withMessage('HRMS Google Sheet URL is required'),
  body('financeSheetUrl').notEmpty().withMessage('Finance Google Sheet URL is required'),
];

module.exports = { handleValidation, tripRequestRules, approvalRules, loginRules, companyRegisterRules };

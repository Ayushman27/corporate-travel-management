const router = require('express').Router();
const {
  registerCompany, employeeLogin, adminLogin,
  listCompanies, syncSheets,
  getMe, updateMe, reactivateAdmin, requestReactivation,
  emailDiagnostic,
  emailEnv
} = require('../controllers/authController');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/rbac');

// Public routes — no auth required
router.post('/register-company', registerCompany);
router.post('/employee-login',   employeeLogin);
router.post('/admin-login',      adminLogin);
router.post('/reactivate-admin', reactivateAdmin);
router.post('/request-reactivation', requestReactivation);
router.get ('/companies',        listCompanies);
router.get('/email-diagnostic', emailDiagnostic);
router.get('/email-env', emailEnv);

// Protected routes
router.get ('/me',           protect, getMe);
router.put ('/me',           protect, updateMe);
router.post('/sync-sheets',  protect, authorize('admin'), syncSheets);

module.exports = router;

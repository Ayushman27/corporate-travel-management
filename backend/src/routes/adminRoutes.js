const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect, authorize('admin'));

router.get  ('/dashboard',              ctrl.getDashboard);
router.get  ('/users',                  ctrl.getAllUsers);
router.patch('/users/:id/role',         ctrl.updateUserRole);
router.patch('/users/:id/toggle',       ctrl.toggleUserActive);
router.get  ('/trips',                  ctrl.getAllTrips);
router.get  ('/audit-logs',             ctrl.getAuditLogs);

module.exports = router;

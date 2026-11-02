const router = require('express').Router();
const ctrl   = require('../controllers/financeController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/report',               authorize('finance', 'admin'), ctrl.getReport);
router.post('/sync-sheets',         authorize('finance', 'admin'), ctrl.syncSheets);
router.post('/budget/set',           authorize('finance', 'admin'), ctrl.setMonthlyBudget);
router.get('/budget/check',         authorize('finance', 'admin'), ctrl.checkBudget);
router.get('/monthly-spend',        authorize('finance', 'admin'), ctrl.getMonthlySpend);
router.get('/department-summary',   authorize('finance', 'admin', 'manager'), ctrl.getDepartmentSummary);
router.get('/trips-summary',        authorize('finance', 'admin'), ctrl.getTripsSummary);
router.get('/employee-history/:employeeId', ctrl.getEmployeeHistory);

module.exports = router;

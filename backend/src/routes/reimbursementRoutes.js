const express = require('express');
const router = express.Router();
const {
  scanBill,
  submitReimbursement,
  getEmployeeReimbursements,
  getFinanceReimbursements,
  processBill
} = require('../controllers/reimbursementController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Employee routes
router.post('/scan', scanBill);
router.post('/', submitReimbursement);
router.get('/employee', getEmployeeReimbursements);

// Finance routes
router.get('/finance', authorize('admin', 'finance'), getFinanceReimbursements);
router.put('/finance/:reimbursementId/bills/:billId', authorize('admin', 'finance'), processBill);

module.exports = router;

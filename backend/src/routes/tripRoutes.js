const router = require('express').Router();
const ctrl   = require('../controllers/tripController');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/rbac');
const { tripRequestRules, handleValidation } = require('../utils/validators');

// All routes require authentication
router.use(protect);

// Employee
router.post('/request',  tripRequestRules, handleValidation, ctrl.requestTrip);
router.get ('/my',       ctrl.getMyTrips);
router.post('/chat',     ctrl.chatWithAgent);
router.get ('/plans/:tripId',  ctrl.getPlans);
router.get ('/:tripId',        ctrl.getTripById);
router.delete('/:tripId',      ctrl.cancelTrip);
router.patch('/:tripId/select-plan', ctrl.selectPlan);
router.get ('/hotels/:city',   ctrl.getHotels);
router.patch('/:tripId/select-hotel', ctrl.selectHotel);
router.post('/:tripId/send-approval', ctrl.sendForApproval);

// Manager
router.post('/approve/manager', authorize('manager', 'admin'), ctrl.managerApprove);
router.get ('/pending/manager', authorize('manager', 'admin'), ctrl.getPendingManagerApprovals);

// Finance
router.post('/approve/finance', authorize('finance', 'admin'), ctrl.financeApprove);
router.get ('/pending/finance', authorize('finance', 'admin'), ctrl.getPendingFinanceApprovals);

// Booking — employee books their own approved trip
router.post('/book', ctrl.bookTrip);

module.exports = router;

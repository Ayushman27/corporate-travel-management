const Reimbursement = require('../models/Reimbursement');
const logger = require('../utils/logger');

// Simulate AI scanning of a bill image
exports.scanBill = async (req, res, next) => {
  try {
    const { billBase64 } = req.body;
    if (!billBase64) {
      return res.status(400).json({ success: false, message: 'No bill image provided' });
    }

    logger.info(`[Reimbursement] AI scanning bill image...`);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI extracted data
    const extractedAmount = Math.floor(Math.random() * 4500) + 500;
    const categories = ['Food', 'Transport', 'Hotel', 'Miscellaneous'];
    const extractedCategory = categories[Math.floor(Math.random() * categories.length)];
    const merchants = ['Uber', 'Local Restaurant', 'Airport Cafe', 'Marriott', 'Indigo'];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const extractedDate = new Date().toISOString().split('T')[0];

    return res.json({
      success: true,
      data: {
        extractedAmount,
        extractedCategory,
        extractedDate,
        merchant
      }
    });
  } catch (err) {
    next(err);
  }
};

// Employee submits a reimbursement request
exports.submitReimbursement = async (req, res, next) => {
  try {
    const { title, bills } = req.body;
    const { companyId, _id: employeeId } = req.user;

    if (!title || !bills || bills.length === 0) {
      return res.status(400).json({ success: false, message: 'Title and at least one bill are required' });
    }

    const totalRequestedAmount = bills.reduce((sum, b) => sum + (b.extractedAmount || 0), 0);

    const reimbursement = await Reimbursement.create({
      employeeId,
      companyId,
      title,
      status: 'pending_finance',
      bills,
      totalRequestedAmount
    });

    logger.info(`[Reimbursement] Employee ${employeeId} submitted reimbursement for ₹${totalRequestedAmount}`);
    
    res.status(201).json({ success: true, data: reimbursement });
  } catch (err) {
    next(err);
  }
};

// Employee gets their own reimbursements
exports.getEmployeeReimbursements = async (req, res, next) => {
  try {
    const reimbursements = await Reimbursement.find({ employeeId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reimbursements });
  } catch (err) {
    next(err);
  }
};

// Finance gets all pending reimbursements for the company
exports.getFinanceReimbursements = async (req, res, next) => {
  try {
    const reimbursements = await Reimbursement.find({ companyId: req.user.companyId })
      .populate('employeeId', 'name email employeeId department')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reimbursements });
  } catch (err) {
    next(err);
  }
};

// Finance approves/rejects a specific bill inside a reimbursement
exports.processBill = async (req, res, next) => {
  try {
    const { reimbursementId, billId } = req.params;
    const { status, rejectReason } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const reimbursement = await Reimbursement.findOne({ _id: reimbursementId, companyId: req.user.companyId });
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    const bill = reimbursement.bills.id(billId);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Process the bill
    if (bill.status === 'pending') {
      bill.status = status;
      if (status === 'rejected') {
        bill.rejectReason = rejectReason;
      } else {
        reimbursement.totalApprovedAmount += bill.extractedAmount;
      }

      // Check if all bills are processed
      const allProcessed = reimbursement.bills.every(b => b.status !== 'pending');
      if (allProcessed) {
        reimbursement.status = 'processed';
      }

      await reimbursement.save();
      logger.info(`[Reimbursement] Finance ${status} bill ${billId} in ${reimbursementId}`);
    }

    res.json({ success: true, data: reimbursement });
  } catch (err) {
    next(err);
  }
};

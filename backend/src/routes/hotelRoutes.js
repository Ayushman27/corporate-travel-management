const express = require('express');
const router = express.Router();
const { getHotelsByCityEndpoint } = require('../controllers/hotelController');
const { protect } = require('../middleware/auth');

// Make it protected if you only want logged-in users to search
// For now, attaching the protect middleware based on standard CTM patterns
router.use(protect);

// GET /api/hotels/:city
router.get('/:city', getHotelsByCityEndpoint);

module.exports = router;

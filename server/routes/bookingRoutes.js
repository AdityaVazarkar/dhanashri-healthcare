const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateUser, authenticateAdmin, optionalAuth } = require('../middleware/auth');

router.get('/time-slots', bookingController.getTimeSlots);
router.post('/', optionalAuth, bookingController.createBooking);
router.get('/my-bookings', authenticateUser, bookingController.getUserBookings);
router.get('/admin', authenticateAdmin, bookingController.getAllBookings);
router.get('/:id', optionalAuth, bookingController.getBookingById);
router.put('/:id/status', authenticateAdmin, bookingController.updateBookingStatus);
router.put('/:id', authenticateUser, bookingController.updateBooking);
router.delete('/:id', authenticateUser, bookingController.deleteBooking);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  partnerLogin,
  getPartnerProfile,
  getPartnerAssignedBookings,
  updatePartnerCollectionStatus,
  getAllPartnersAdmin,
  createPartnerAdmin,
  updatePartnerAdmin,
  deletePartnerAdmin,
  assignBookingToPartner,
  getPartnersListQuick
} = require('../controllers/partnerController');
const { authenticatePartner, authenticateAdmin } = require('../middleware/auth');

// ==================== PARTNER PORTAL ROUTES ====================
router.post('/login', partnerLogin);
router.get('/profile', authenticatePartner, getPartnerProfile);
router.get('/assigned-bookings', authenticatePartner, getPartnerAssignedBookings);
router.put('/bookings/:id/status', authenticatePartner, updatePartnerCollectionStatus);
router.patch('/bookings/:id/status', authenticatePartner, updatePartnerCollectionStatus);

// ==================== ADMIN PARTNER MANAGEMENT ROUTES ====================
router.get('/quick-list', authenticateAdmin, getPartnersListQuick);
router.get('/admin', authenticateAdmin, getAllPartnersAdmin);
router.post('/admin', authenticateAdmin, createPartnerAdmin);
router.put('/admin/:id', authenticateAdmin, updatePartnerAdmin);
router.delete('/admin/:id', authenticateAdmin, deletePartnerAdmin);
router.post('/admin/assign', authenticateAdmin, assignBookingToPartner);

module.exports = router;

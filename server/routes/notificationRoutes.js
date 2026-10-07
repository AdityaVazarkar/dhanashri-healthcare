const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

router.get('/my-notifications', authenticateUser, notificationController.getUserNotifications);
router.patch('/:id/read', authenticateUser, notificationController.markAsRead);
router.patch('/read-all', authenticateUser, notificationController.markAllAsRead);
router.get('/admin', authenticateAdmin, notificationController.getAdminNotifications);

module.exports = router;

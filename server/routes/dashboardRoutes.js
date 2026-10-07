const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

router.get('/user', authenticateUser, dashboardController.getUserDashboard);
router.get('/admin', authenticateAdmin, dashboardController.getAdminDashboard);

module.exports = router;

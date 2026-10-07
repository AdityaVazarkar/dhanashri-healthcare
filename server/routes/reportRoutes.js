const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateUser, authenticateAdmin, optionalAuth } = require('../middleware/auth');
const { uploadReportFile } = require('../middleware/upload');

router.get('/my-reports', authenticateUser, reportController.getUserReports);
router.get('/admin', authenticateAdmin, reportController.getAllReports);
router.get('/:id', optionalAuth, reportController.getReportById);
router.get('/:id/download', optionalAuth, reportController.downloadReportFile);
router.post('/upload', authenticateAdmin, uploadReportFile.single('pdf'), reportController.uploadReport);
router.post('/:id/notify', authenticateAdmin, reportController.notifyUserReport);

module.exports = router;

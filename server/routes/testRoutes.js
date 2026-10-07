const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticateAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, testController.getTests);
router.get('/:id', optionalAuth, testController.getTestById);
router.post('/', authenticateAdmin, testController.createTest);
router.put('/:id', authenticateAdmin, testController.updateTest);
router.delete('/:id', authenticateAdmin, testController.deleteTest);
router.patch('/:id/toggle-status', authenticateAdmin, testController.toggleTestStatus);

module.exports = router;

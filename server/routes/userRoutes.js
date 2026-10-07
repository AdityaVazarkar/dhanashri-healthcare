const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateAdmin } = require('../middleware/auth');

router.get('/', authenticateAdmin, userController.getAllUsers);
router.get('/:id', authenticateAdmin, userController.getUserDetails);
router.patch('/:id/status', authenticateAdmin, userController.toggleUserStatus);

module.exports = router;

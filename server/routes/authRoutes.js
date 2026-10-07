const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser, optionalAuth } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.get('/me', optionalAuth, authController.getMe);
router.put('/profile', authenticateUser, authController.updateProfile);
router.put('/change-password', authenticateUser, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

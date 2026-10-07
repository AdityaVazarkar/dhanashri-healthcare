const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, packageController.getPackages);
router.get('/:id', optionalAuth, packageController.getPackageById);
router.post('/', authenticateAdmin, packageController.createPackage);
router.put('/:id', authenticateAdmin, packageController.updatePackage);
router.delete('/:id', authenticateAdmin, packageController.deletePackage);
router.patch('/:id/toggle-status', authenticateAdmin, packageController.togglePackageStatus);

module.exports = router;

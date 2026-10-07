const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, categoryController.getCategories);
router.post('/', authenticateAdmin, categoryController.createCategory);
router.put('/:id', authenticateAdmin, categoryController.updateCategory);
router.delete('/:id', authenticateAdmin, categoryController.deleteCategory);

module.exports = router;

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.delete('/:categoryId', categoryController.deleteCategory);

module.exports = router;
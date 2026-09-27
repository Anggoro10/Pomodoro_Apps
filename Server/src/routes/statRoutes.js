const express = require('express');
const router = express.Router();
const statController = require('../controllers/statController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/dashboard', statController.getDashboardStats);
router.get('/sessions', statController.getSessionStatistics);

module.exports = router;
const express = require('express');
const router = express.Router();
const focusController = require('../controllers/focusController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', focusController.startSession);
router.get('/history', focusController.getHistory);
router.post('/break', focusController.takeBreak);

module.exports = router;
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/sessions', sessionController.getSessions);
router.post('/sessions', sessionController.createSession);
router.post('/complete-focus-session', sessionController.completeFocusSession);
router.post('/cancel-focus-session', sessionController.cancelFocusSession);
router.post('/break-energy', sessionController.updateBreakEnergy);

module.exports = router;
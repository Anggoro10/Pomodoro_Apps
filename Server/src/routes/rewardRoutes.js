const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', rewardController.getRewards);
router.post('/redeem', rewardController.redeemReward);

module.exports = router;

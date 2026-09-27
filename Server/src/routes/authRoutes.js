const express = require('express');
const router = express.Router();
const { register, login, checkEmailExists, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmailExists);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
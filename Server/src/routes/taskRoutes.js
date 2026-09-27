const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.patch('/:taskId', taskController.updateTask); // Sesuai dengan panggilan toggleTaskCompleted
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;
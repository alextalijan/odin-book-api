const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');

// Import controller
const controller = require('../controllers/userController');

router.post('/', controller.register);
router.get('/me', authenticateToken, controller.returnUser);
router.get('/:userId/feed', authenticateToken, controller.getFeed);

module.exports = router;

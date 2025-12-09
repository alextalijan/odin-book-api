const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');

// Import controller
const controller = require('../controllers/userController');

router.post('/', controller.register);
router.get('/search', authenticateToken, controller.findUser);
router.get('/me', authenticateToken, controller.returnUser);
router.get('/:userId/feed', authenticateToken, controller.getFeed);
router.post(
  '/:userId/follow-requests',
  authenticateToken,
  controller.sendFollowRequest
);

module.exports = router;

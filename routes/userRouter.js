const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');

// Import controller
const controller = require('../controllers/userController');

router.post('/', controller.register);
router.get('/search', authenticateToken, controller.findUser);
router.get('/me', authenticateToken, controller.returnUser);
router.get('/:username', authenticateToken, controller.getAccount);
router.get('/:userId/posts', authenticateToken, controller.getAccountPosts);
router.get('/:userId/feed', authenticateToken, controller.getFeed);
router.delete('/:userId/followers', authenticateToken, controller.unfollowUser);
router.post(
  '/:userId/follow-requests',
  authenticateToken,
  controller.sendFollowRequest
);
router.put(
  '/:userId/follow-requests',
  authenticateToken,
  controller.cancelRequest
);

module.exports = router;

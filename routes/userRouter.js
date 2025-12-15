const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');
const multer = require('multer');

// Import controller
const controller = require('../controllers/userController');

// Set up multer storage for files
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', controller.register);
router.get('/search', authenticateToken, controller.findUser);
router.get('/me', authenticateToken, controller.returnUser);
router.get('/:username', authenticateToken, controller.getAccount);
router.get('/:userId/posts', authenticateToken, controller.getAccountPosts);
router.get('/:userId/feed', authenticateToken, controller.getFeed);
router.get('/:userId/followers', authenticateToken, controller.getFollowers);
router.delete('/:userId/followers', authenticateToken, controller.unfollowUser);
router.get('/:userId/followings', authenticateToken, controller.getFollowings);
router.get(
  '/:userId/follow-requests',
  authenticateToken,
  controller.getRequests
);
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
router.put(
  '/:userId/avatar',
  authenticateToken,
  upload.single('avatar'),
  controller.changeAvatar
);

module.exports = router;

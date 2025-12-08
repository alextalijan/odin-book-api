const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');

// Import controller
const controller = require('../controllers/postController');

router.get('/:postId', authenticateToken, controller.getPost);
router.get('/:postId/comments', authenticateToken, controller.getComments);
router.post('/:postId/likes', authenticateToken, controller.likePost);
router.delete('/:postId/likes', authenticateToken, controller.unlikePost);

module.exports = router;

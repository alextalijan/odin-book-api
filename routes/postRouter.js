const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');
const multer = require('multer');

// Import controller
const controller = require('../controllers/postController');

// Set up multer storage for files
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticateToken, upload.single('image'), controller.post);
router.get('/:postId', authenticateToken, controller.getPost);
router.get('/:postId/comments', authenticateToken, controller.getComments);
router.post('/:postId/comments', authenticateToken, controller.sendComment);
router.post('/:postId/likes', authenticateToken, controller.likePost);
router.delete('/:postId/likes', authenticateToken, controller.unlikePost);

module.exports = router;

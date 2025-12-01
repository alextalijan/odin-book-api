const { Router } = require('express');
const router = Router();

// Import controller
const controller = require('../controllers/userController');

router.post('/', controller.register);
router.get('/me', controller.returnUser);
router.get('/login', controller.login);

module.exports = router;

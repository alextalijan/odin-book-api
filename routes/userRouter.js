const { Router } = require('express');
const router = Router();

// Import controller
const controller = require('../controllers/userController');

router.post('/', controller.register);
router.get('/me', controller.returnUser);
router.post('/login', controller.login);

module.exports = router;

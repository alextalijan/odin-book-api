const { Router } = require('express');
const router = Router();

// Import controller
const controller = require('../controllers/userController');

router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;

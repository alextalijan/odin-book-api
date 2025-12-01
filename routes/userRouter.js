const { Router } = require('express');
const router = Router();

// Import controller
const controller = require('../controllers/userController');

router.post('/', controller.register);

module.exports = router;

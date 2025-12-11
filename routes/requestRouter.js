const { Router } = require('express');
const router = Router();
const authenticateToken = require('../utils/authenticateToken');

// Import controller
const controller = require('../controllers/requestController');

router.put('/:requestId', authenticateToken, controller.respondToRequest);

module.exports = router;

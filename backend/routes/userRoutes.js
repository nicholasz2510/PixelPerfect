const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define routes
router.get('/', userController.getAllUsers);
router.post('/auth/', userController.authUser);
router.post('/board', userController.addRoom);
router.get('/:userId/boards', userController.getAllRooms);

module.exports = router;

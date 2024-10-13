const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define routes
router.get('/', userController.getAllUsers);
router.post('/auth/', userController.authUser);
router.post('/board', userController.addRoom);
router.post('/board/pixels', userController.setPixels);
router.get('/:userId/boards', userController.getAllRooms);
router.get('/:userId/:boardId/', userController.getPixels)

module.exports = router;

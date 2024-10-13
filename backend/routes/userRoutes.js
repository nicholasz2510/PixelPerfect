const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define routes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:userId/boards', userController.getAllRooms);
router.post('/:userId/:boardId', userController.addRoom);

module.exports = router;

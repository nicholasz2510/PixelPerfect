// routes/boardRoutes.js
const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

// Define the route for creating a board
router.post('/', boardController.createBoard);
router.put('/:boardId', boardController.updateBoard);
router.get('/:boardId', boardController.getBoardById);
router.get('/:boardId/tasks', boardController.getTasks);
router.post('/tasks/add', boardController.addTask);
router.post('/tasks/remove', boardController.removeTask);

module.exports = router;
// routes/boardRoutes.js
const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

// Define the route for creating a board
router.post('/board', boardController.createBoard);
router.put('/board/:boardId', boardController.updateBoard);
router.get('/board/:boardId', boardController.getBoard);

module.exports = router;
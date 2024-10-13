const Board = require('../models/boardModel');

exports.createBoard = async (req, res) => {
  try {
    // const userId = req.userId;
    // const newBoard = new Board(
    //   {
    //     creator: userId,
    //     status: "active",
    //     createdAt: new Date()
    //   } 
    // );

    const newBoard = new Board();

    await newBoard.save(); 

    res.status(201).json({ message: 'board created', boardId: newBoard._id });
  } catch (error) {
    res.status(500).json({ error: 'cooked board error ' + error });
  }
};


// controllers/boardController.js
exports.updateBoard = async (req, res) => {
  const { boardId } = req.params;

  const gridX = req.body.gridX;
  const gridY = req.body.gridY;
  const color = req.body.color;

  // const { board } = req.body; // The new state of the board (e.g., updated 2D array)


  try {

    const oldBoard = await Board.findById(boardId);

    if(!oldBoard) {
      return res.status(404).json({message: 'Board not found'});
    }

    oldBoard.board[gridY][gridX] = color;

    await oldBoard.save();

    res.status(200).json({ 
      message: 'Board updated successfully',
      gridX: gridX,
      gridY: gridY,
      color: color

     });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update board because of ' + error });
  }
};

// controllers/boardController.js
exports.getBoardById = async (req, res) => {
  const { boardId } = req.params;

  try {
    const board = await Board.findById(boardId); // Find the board by ID
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.status(200).json({ board });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve board' });
  }
};

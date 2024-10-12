const User = require('../models/userModel');

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

    await newBoard.save(); // Save to MongoDB

    // Return the board ID to the client
    res.status(201).json({ message: 'Board created successfully', boardId: newBoard._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create board' });
  }
};


// controllers/boardController.js
exports.updateBoard = async (req, res) => {
  const { boardId } = req.params;
  const { board } = req.body; // The new state of the board (e.g., updated 2D array)

  try {
    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,          // Find the board by ID
      { board },        // Update the board array with the new state
      { new: true }     // Return the updated document
    );

    if (!updatedBoard) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.status(200).json({ message: 'Board updated successfully', board: updatedBoard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update board' });
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

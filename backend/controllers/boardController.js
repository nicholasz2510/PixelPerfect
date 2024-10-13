const Board = require('../models/boardModel');

let pixelBoard = Array(100).fill().map(() => Array(100).fill("#FFFFFF"));

exports.handlePixelUpdate = (socket, io) => {
  socket.on('updatePixel', async ({ x, y, color }) => {
    console.log('updatePixel', x, y, color);
    try {
      pixelBoard[y][x] = color;
      io.emit('pixelUpdated', { x, y, color });
      socket.emit('updateSuccess', { x, y, color });
    } catch (error) {
      socket.emit('updateError', { message: 'Failed to update pixel', error });
    }
  });
};

exports.handleNewConnection = (socket) => {
  socket.emit('initialBoard', pixelBoard);
  console.log('board connected');
};

exports.handleDisconnection = (socket) => {
  socket.on('disconnect', () => {
    console.log('board died');
  });
};



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

const Board = require('../models/boardModel');
console.log("top of board controller");


exports.handlePixelUpdate = (socket, io) => {
  socket.on('updatePixel', async ({ boardId, x, y, color }) => {
    console.log('updatePixel', x, y, color);
    try {
      console.log("Baka");
      console.log(boardId);
      const boardData = await Board.findById(boardId);
      boardData.toObject().board[y][x] = color;
      
      await board.save();
      io.to(boardId).emit('pixelUpdated', { x, y, color });
      socket.emit('updateSuccess', { x, y, color });
    } catch (error) {
      socket.emit('updateError', { message: 'Failed to update board or pixel', error });
    }
  });
};

exports.handleNewConnection = (socket) => {
  console.log("top of handle connection");

  socket.on('roomJoin', (boardId) => {
    const boardFound = Board.findById(boardId);
    if(boardFound) {
      socket.join(boardId);
      socket.emit('gameBoard', boardFound.board);
      socket.emit('joinSuccess', "Connected to room  " + boardId);
      console.log('Connected to room ' + boardId);
    } else {
      socket.emit('failureJoin', "failed to join room");
      console.log("ROOM IS COOKED");
    }
  });
};

exports.handleDisconnection = (socket) => {
  socket.on('disconnect', (boardId) => {
    socket.leave(boardId);
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

const Board = require('../models/boardModel');
console.log("top of board controller");


exports.handlePixelUpdate = (socket, io) => {
  socket.on('updatePixel', async ({boardId, x, y, color }) => {
    console.log('updatePixel', boardId, x, y, color);
    try {

      const boardData = await Board.findById(boardId);
      const boardDataObj = boardData.toObject().board;
      boardDataObj[y][x] = color;
     
      boardData.board = boardDataObj;
      console.log("NOOOO!");

      await Board.findByIdAndUpdate(boardId, boardData, { new: true });

      console.log("SUCCESS!");

      io.to(boardId).emit('pixelUpdated', { x, y, color });
      console.log(boardId);
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

      const rooms = [...socket.rooms]; // Get a copy of all rooms this socket has joined
      rooms.forEach((room) => {
          if (room !== boardId) { // Don't remove the socket from its own room (default room)
              socket.leave(room);
              console.log(`Socket removed from room: ${room}`);
          }
      });


      socket.join(boardId);
      socket.emit('gameBoard', boardFound.board, boardFound._id, boardFound.title);
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
    const newBoard = new Board(
      {"creator" : req.body.creator,
        "title" : req.body.title
      }
    );

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

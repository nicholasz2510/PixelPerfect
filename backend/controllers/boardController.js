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

  socket.on('roomJoin', async (boardId) => {
    const boardFound = await Board.findById(boardId);
    console.log(boardId);
    if(boardFound) {

      const rooms = [...socket.rooms]; // Get a copy of all rooms this socket has joined
      rooms.forEach((room) => {
          if (room !== boardId) { // Don't remove the socket from its own room (default room)
              socket.leave(room);
              console.log(`Socket removed from room: ${room}`);
          }
      });

      socket.join(boardId);
      console.log("ROOM IS NOT COOKED HOPEFULLY " + boardFound);
      socket.emit('gameBoard', boardFound.board, boardFound._id, boardFound.title);
      socket.emit('joinSuccess', boardId);
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

exports.addTask = async (req, res) => {
  let board = await Board.findById(req.body.boardId);
  if(!board) {
    res.status(404).json({message: "Board not found"});
  } else {
    const task = req.body.task;
    const points = req.body.points;
    try {
      board.tasks.push({
          task: task,
          points: points
      })

      await board.save();

  
      res.status(200).json({ "tasks": board.tasks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save board' });
    }

  }

};

exports.getTasks = async (req, res) => {
  let board = await Board.findById(req.body.boardId);
  if(!board) {
    res.status(404).json({message: "Board not found"});
  } else {
    res.status(200).json({ "tasks": board.tasks });
  }
  
    
};

exports.removeTask = async (req, res) => {
  let board = await Board.findById(req.body.boardId);

  if(!board) {
    res.status(404).json({message: "Board not found"});
  }

  await Room.findByIdAndUpdate(
    roomId,
    {
      $pull: { tasks: { task: req.body.task } }
    },
    { new: true }  
  )
  if (updatedRoom) {
    res.status(200).json({tasks : updatedRoom.tasks});
  } else {
    res.status(404).json({message: "Board not found"});
  }

};


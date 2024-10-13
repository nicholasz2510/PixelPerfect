const express = require('express');
const http = require('http');

const boardController = require('./controllers/boardController');
const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');
const Board = require('./models/boardModel');

const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const GLOBAL_ROOM = "670b583bacdb17a8c5c211af";

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // Allow requests from the frontend
    methods: ['GET', 'POST'],
  },
});

// json
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

io.on('connection', async (socket) => {
  console.log('A user connected');

  const initBoard = await Board.findById(GLOBAL_ROOM);
  
  socket.emit('gameBoard', initBoard.toObject().board, GLOBAL_ROOM, initBoard.title);
  console.log("GLOBAL ROOM: " + GLOBAL_ROOM);
  console.log("INIT BOARD: " + initBoard);
  socket.join(GLOBAL_ROOM);

  boardController.handleNewConnection(socket);
  boardController.handlePixelUpdate(socket, io);
  boardController.handleDisconnection(socket);
});

const uri = "mongodb+srv://pixelperfect:5k1b1d1Chungu5%21@cluster0.3jg7z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// ango
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



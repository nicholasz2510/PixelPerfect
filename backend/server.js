const express = require('express');
const http = require('http');
const boardController = require('./controllers/boardController');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'], // Allow requests from the frontend
    methods: ['GET', 'POST'],
  },
});

// json
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  // board connections
  boardController.handleNewConnection(socket);
  boardController.handlePixelUpdate(socket, io);
  boardController.handleDisconnection(socket);
});


// // mongo
// mongoose.connect('mongodb://localhost:27017/testDb', { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error(err));

// // Routes
// app.use('/api/users', userRoutes);
// app.use('/api/boards', boardRoutes);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

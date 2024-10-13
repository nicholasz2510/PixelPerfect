// require statements and imports
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const boardController = require('./controllers/boardController');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);


// json
app.use(express.json());
app.use(express.static('public'));

io.on('connection', (socket) => {
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

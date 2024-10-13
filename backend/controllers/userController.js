const User = require('../models/userModel');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const currUser = User.findById(req.body.userId);
    if(currUser) {
      currUser.rooms.push(req.body.boardId);
      const rooms = [...socket.rooms]; // Get a copy of all rooms this socket has joined
        rooms.forEach((room) => {
            if (room !== socket.id) { // Don't remove the socket from its own room (default room)
                socket.leave(room);
                console.log(`Socket removed from room: ${room}`);
            }
        });
      await currUser.save();
      res.status(201).json(currUser.rooms); 
    }
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const user = User.findById(req.params.userId);
    if(user) {
      res.status(200).json(user.rooms);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.authUser = async (req, res) => {
  const _id = req.body._id;

  try {
    const user = User.findById(_id);
      if(!user) {
        user = new User({
          _id: _id
        });
      
        // Save the user to the database
        await user.save();
    }
    
  
    res.status(201).send('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user' + error);
  }
  
};
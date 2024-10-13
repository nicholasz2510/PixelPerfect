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
    const currUser = User.findById(req.params.userId);
    if(currUser) {
      currUser.rooms.push(req.params.boardId);
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

exports.createUser = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const _id = req.body._id;

  try {
    const user = new User({
      username: username,
      password: password, 
      _id: id
    });
  
    // Save the user to the database
    await user.save();
  
    res.status(201).send('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user' + error);
  }
  
};
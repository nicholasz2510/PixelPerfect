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
    const currUser = await User.findById(req.body.userId);
    if(currUser) {
      currUser.rooms.push(req.body.boardId);
      currUser.pixels.push(10);
      await currUser.save();
      res.status(201).json(currUser.rooms); 
    }
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
};

exports.getPixels = async (req, res) => {
  try {
    let boardId = req.params.boardId;
    let userId = req.params.userId;
    const currUser = await User.findById(userId);
    if(currUser) {
      res.status(201).json(currUser.pixels[currUser.rooms.indexOf(boardId)]); 
    } 
  } catch (error) {
    res.status(400).json({error: 'Bad request'});
  }
}

exports.setPixels = async (req, res) => {
  try {
    const currUser = await User.findById(req.body.userId);
    if(currUser) {
      currUser.pixels[currUser.rooms.indexOf(boardId)] = req.body.pixels;
      await currUser.save();
      res.status(200).json({
        "room":  boardId,
        "pixels": req.body.pixels
       });
    }
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const user = User.findById(req.params.userId);
    if(user) {
      res.status(200).json({
       "rooms":  user.rooms,
       "pixels": user.pixels
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.authUser = async (req, res) => {
  const _id = req.body._id;

  try {
    let user = await User.findOne({ _id: _id });
    console.log(user);
    console.log("IDDDDD " + _id);
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
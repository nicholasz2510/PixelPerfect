const User = require('../models/userModel');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
};

exports.addUser = async (req, res) => {
  try {
    const uniqueSub = req.body.sub;
    const email = req.body.email;
    const newUser = {"name": uniqueSub, "email": email};
    res.status(200).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
};
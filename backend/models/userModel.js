const mongoose = require('mongoose');
const GLOBAL_ROOM = "670b583bacdb17a8c5c211af";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  rooms: {
    type: [String],
    required: true,
    default: () => [GLOBAL_ROOM]
  }

  
});

module.exports = mongoose.model('User', userSchema);

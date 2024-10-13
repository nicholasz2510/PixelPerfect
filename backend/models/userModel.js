const mongoose = require('mongoose');
const GLOBAL_ROOM = "670c015a8088c398caa65eb4";

const userSchema = new mongoose.Schema({
  _id : {
    type: String,
    required: true
  },
  rooms: {
    type: [String],
    required: true,
    default: () => [GLOBAL_ROOM]
  },
  
  pixels: {
    type: [Number],
    required: true,
    default: () => [10]
  },
});

module.exports = mongoose.model('User', userSchema);

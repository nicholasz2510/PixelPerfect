const mongoose = require('mongoose');
const GLOBAL_ROOM = "670b583bacdb17a8c5c211af";

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

const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    board: {
      type: [[String]], // Array representing the board
      default: () => Array(100).fill(Array(100).fill("#FFFFFF")), // Default 5x5 empty board
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    
    status: {
      type: String,
      default: 'active',
    },
   
    creator: {
      type: String,
      default: 'active',
      required: true
    }
  });

  module.exports = mongoose.model('Board', boardSchema);

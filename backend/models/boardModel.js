const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    board: {
      type: [[String]], // Array representing the board
      default: () => Array(100).fill(Array(100).fill("#FFFFFF"))
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
      default: 'sbkiditi',
      required: true
    },

    title: {
      type: String,
      default: 'Untitled board',
      required: true
    },

    tasks: [
      {
        task: { type: String, required: true }, 
        points: { type: Number, required: true }       
      }
    ]


  });

  module.exports = mongoose.model('Board', boardSchema);

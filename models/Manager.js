const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  // Add other fields as necessary
}, {
  timestamps: true
});

module.exports = mongoose.model('Manager', managerSchema); 

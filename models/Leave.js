const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['casual', 'sick', 'annual'],
    required: true
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: String
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema); 
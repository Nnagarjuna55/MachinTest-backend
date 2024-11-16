const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave', 'holiday'],
    default: 'present'
  },
  clockIn: String,
  clockOut: String,
  totalHours: Number,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema); 
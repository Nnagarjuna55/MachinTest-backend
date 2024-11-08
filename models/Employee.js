const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  designation: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  courses: [{
    type: String
  }],
  image: {
    type: String
  },
  role: {
    type: String,
    required: true,
    enum: ['employee', 'HR', 'Manager', 'CEO'],
    default: 'employee'
  }
}, {
  timestamps: true
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified or is new
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add method to compare passwords
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Employee', employeeSchema); 
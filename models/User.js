const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'hr', 'manager', 'ceo', 'employee'],
    default: 'employee'
  },
  mobile:{
    type: String,
    required: true
  },
  designation:{
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  image:{
    type: String,
    required: true
  },

}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User; 
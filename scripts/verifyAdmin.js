const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const verifyAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      console.log('Admin user exists:', {
        username: adminUser.username,
        id: adminUser._id,
        isAdmin: adminUser.isAdmin
      });
    } else {
      console.log('Admin user not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

verifyAdmin(); 
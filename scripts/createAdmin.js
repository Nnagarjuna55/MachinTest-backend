const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      // Delete existing admin for fresh creation
      await User.deleteOne({ username: 'admin' });
      console.log('Deleted existing admin user');
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      isAdmin: true
    });

    await adminUser.save();
    console.log('New admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');

    // Verify the created user
    const verifyAdmin = await User.findOne({ username: 'admin' });
    console.log('Verified admin user:', {
      username: verifyAdmin.username,
      isAdmin: verifyAdmin.isAdmin,
      id: verifyAdmin._id
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

createAdminUser(); 
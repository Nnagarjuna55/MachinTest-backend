const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // List all collections
    const collections = await mongoose.connection.db.collections();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.collectionName}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 
const mongoose = require('mongoose');
require('dotenv').config();

async function initDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the database instance
    const db = mongoose.connection.db;
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    // Create indexes if needed
    await db.collection('employees').createIndex({ email: 1 }, { unique: true });
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

initDatabase(); 
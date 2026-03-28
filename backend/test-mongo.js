const mongoose = require('mongoose');
require('dotenv').config();

const testMongo = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('URL:', process.env.MONGO_URL.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGO_URL, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✓ MongoDB connected successfully!');
    console.log('Connected to:', mongoose.connection.name);
    process.exit(0);
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
};

testMongo();

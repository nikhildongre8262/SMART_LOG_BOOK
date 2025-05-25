require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const groupRoutes = require('./routes/group');
const studentRoutes = require('./routes/student');
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments', require('./routes/assignment'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/resources', require('./routes/studyResource'));
app.use('/api/student', studentRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File size too large. Maximum size is 10MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Maximum 5 files allowed.' 
      });
    }
    return res.status(400).json({ 
      message: err.message 
    });
  }

  // Handle file type errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      message: err.message 
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    // Try to start server, handle port in use error gracefully
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop other processes using this port or change the PORT in your .env file.`);
        process.exit(1);
      } else {
        console.error(err);
      }
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

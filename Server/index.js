const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeSocket } = require('./socket/socketServer');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check for Render
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/lawyers', require('./routes/lawyerRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/resources', require('./routes/resourcesRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));

// MongoDB Connection
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shakti-setu';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB Connected to:', uri);
  } catch (error) {
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      console.log('Local MongoDB not running. Trying to spin up mongodb-memory-server...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create({
          binary: {
            version: '4.4.24'
          }
        });
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected to in-memory database:', mongoUri);
      } catch (memError) {
        console.error('Failed to start mongodb-memory-server:', memError);
        console.error('Original connection error:', error);
        process.exit(1);
      }
    } else {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

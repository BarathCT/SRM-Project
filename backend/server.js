import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Routers
import adminRoutes from './routes/admin.js';
import bulkRoutes from './routes/bulk.js'; // NEW: bulk upload routes split from admin
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import paperRoutes from './routes/papers.js';
import conferencePaperRoutes from "./routes/conferencePapers.js";


dotenv.config();

const app = express();

// Trust proxy (useful if behind reverse proxy)
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsers and logging
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', bulkRoutes); // NEW: mounts POST /api/admin/bulk-upload-users
app.use('/api/settings', settingsRoutes);
app.use('/api/papers', paperRoutes);
app.use("/api/conference-papers", conferencePaperRoutes);


// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`${signal} received: closing server...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server and DB connections closed. Bye!');
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (e) {
    console.error('Startup Error:', e.message);
    process.exit(1);
  }
};

start();
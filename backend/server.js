import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js'; // ✅ Add this

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Register routes
app.use('/admin', adminRoutes);
app.use('/api', authRoutes); // ✅ /api/login now works

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import { sendSuccess, sendError } from './utils/response.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  return sendSuccess(res, 'PackLoop Backend API is running smoothly!', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  return sendError(res, `Route ${req.originalUrl} tidak ditemukan.`, null, 404);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 PackLoop Backend Server is running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
});

export default app;

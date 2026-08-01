import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiReference } from '@scalar/express-api-reference';
import { generateOpenAPISpec } from './docs/openapi-registry.js';

// Import skema agar otomatis teregistrasi ke OpenAPI Registry
import './schemas/auth.schema.js';
import './schemas/user.schema.js';
import './schemas/station.schema.js';
import './schemas/deposit.schema.js';
import './schemas/reward.schema.js';
import './schemas/notification.schema.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import stationRoutes from './routes/station.routes.js';
import depositRoutes from './routes/deposit.routes.js';
import rewardRoutes from './routes/reward.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { sendSuccess, sendError } from './utils/response.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Generate OpenAPI spec sekali saat server start (cached)
const openapiSpec = generateOpenAPISpec();

// Raw OpenAPI JSON Specification Endpoint (untuk Postman Import & Code Generator)
app.get(['/docs/openapi.json', '/openapi.json'], (_req: Request, res: Response) => {
  return res.json(openapiSpec);
});

// Scalar API Reference OpenAPI Documentation UI (Auto-Generated)
app.use(
  '/docs',
  apiReference({
    spec: {
      content: openapiSpec,
    },
    theme: 'purple',
    pageTitle: 'PackLoop Core API Reference & Documentation',
    layout: 'modern',
    showSidebar: true,
    metaData: {
      title: 'PackLoop API Reference',
      description: 'Dokumentasi Resmi OpenAPI 3.0 & Reference untuk Mobile Client dan IoT Station PackLoop.',
    },
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'fetch',
    },
  })
);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  return sendSuccess(res, 'PackLoop Backend API is running smoothly!', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    documentation: `${baseUrl}/docs`,
    openapi_spec: `${baseUrl}/docs/openapi.json`,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  return sendError(res, `Route ${req.originalUrl} tidak ditemukan.`, null, 404);
});

// Centralized Error Handler (harus di paling bawah)
app.use(errorHandler);

// Start Server (hanya saat running lokal, Vercel serverless mengelola listener otomatis)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 PackLoop Backend Server is running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/`);
    console.log(`📚 Scalar API Reference Docs: http://localhost:${PORT}/docs`);
    console.log(`📄 OpenAPI JSON Spec: http://localhost:${PORT}/docs/openapi.json`);
  });
}

export default app;

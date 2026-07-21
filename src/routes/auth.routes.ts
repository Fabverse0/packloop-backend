import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/auth/me (Protected route)
router.get('/me', requireAuth, AuthController.getMe);

// POST /api/auth/verify-token (Public route)
router.post('/verify-token', AuthController.verifyToken);

export default router;

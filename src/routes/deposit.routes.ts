import { Router } from 'express';
import { DepositController } from '../controllers/deposit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

// POST /api/deposits/analyze - AI Scan Packaging (Gemini Vision)
router.post('/analyze', DepositController.analyzePackaging);

router.post('/', DepositController.createDeposit);
router.get('/', DepositController.getUserDeposits);
router.get('/:id', DepositController.getDepositById);
router.delete('/:id', DepositController.deleteDeposit);

export default router;

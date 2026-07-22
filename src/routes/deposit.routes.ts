import { Router } from 'express';
import { DepositController } from '../controllers/deposit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', DepositController.createDeposit);
router.get('/', DepositController.getUserDeposits);
router.get('/:id', DepositController.getDepositById);
router.delete('/:id', DepositController.deleteDeposit);

export default router;

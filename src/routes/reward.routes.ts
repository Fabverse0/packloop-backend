import { Router } from 'express';
import { RewardController } from '../controllers/reward.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/rules', RewardController.getRules);

router.use(requireAuth);
router.post('/redeem', RewardController.redeem);
router.get('/history', RewardController.getUserRedemptions);
router.delete('/history/:id', RewardController.cancelRedemption);

export default router;

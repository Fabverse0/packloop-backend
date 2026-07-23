import { Request, Response } from 'express';
import { RewardService } from '../services/reward.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isPositiveNumber, isValidEWalletProvider, isValidUUID } from '../utils/validation.js';

export class RewardController {
  static async getRules(_req: Request, res: Response) {
    try {
      const rules = await RewardService.getRewardRules();
      return sendSuccess(res, 'Berhasil mengambil aturan reward poin', rules);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil aturan reward', null, 500);
    }
  }

  static async redeem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const { eWalletProvider, accountNumber, pointsRedeemed } = req.body;

      // Validasi kelengkapan field
      if (!eWalletProvider || !accountNumber || pointsRedeemed === undefined) {
        return sendError(res, 'Field eWalletProvider, accountNumber, dan pointsRedeemed wajib diisi', null, 400);
      }

      // Validasi provider e-wallet
      if (!isValidEWalletProvider(eWalletProvider)) {
        return sendError(res, 'Provider e-wallet tidak valid. Pilih: GOPAY, OVO, DANA, atau LINKAJA', null, 400);
      }

      // Validasi poin harus angka positif (> 0)
      if (!isPositiveNumber(pointsRedeemed)) {
        return sendError(res, 'Nilai pointsRedeemed harus berupa angka positif (lebih dari 0)', null, 400);
      }

      const redemption = await RewardService.redeemPoints({
        userId,
        eWalletProvider,
        accountNumber,
        pointsRedeemed: Number(pointsRedeemed),
      });

      return sendSuccess(res, 'Penukaran poin berhasil diproses!', redemption, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal memproses penukaran poin', null, 400);
    }
  }

  static async getUserRedemptions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const redemptions = await RewardService.getUserRedemptions(userId);
      return sendSuccess(res, 'Berhasil mengambil riwayat penukaran poin', redemptions);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil riwayat penukaran', null, 500);
    }
  }

  static async cancelRedemption(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const id = req.params.id as string;
      if (!isValidUUID(id)) {
        return sendError(res, 'Format ID penukaran tidak valid (harus UUID)', null, 400);
      }

      await RewardService.cancelRedemption(id, userId);
      return sendSuccess(res, 'Permintaan penukaran poin berhasil dibatalkan', null);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal membatalkan penukaran poin', null, 400);
    }
  }
}

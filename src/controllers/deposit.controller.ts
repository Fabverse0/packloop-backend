import { Request, Response } from 'express';
import { DepositService } from '../services/deposit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class DepositController {
  static async createDeposit(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const { stationId, compartmentId, wasteType, weightOrCount } = req.body;

      if (!stationId || !compartmentId || !wasteType || !weightOrCount) {
        return sendError(res, 'Field stationId, compartmentId, wasteType, dan weightOrCount wajib diisi', null, 400);
      }

      const deposit = await DepositService.createDeposit({
        userId,
        stationId,
        compartmentId,
        wasteType,
        weightOrCount: Number(weightOrCount),
      });

      return sendSuccess(res, 'Setoran kemasan berhasil dicatat!', deposit, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal membuat transaksi setoran', null, 500);
    }
  }

  static async getUserDeposits(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const deposits = await DepositService.getUserDeposits(userId);
      return sendSuccess(res, 'Berhasil mengambil riwayat setoran', deposits);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil riwayat setoran', null, 500);
    }
  }

  static async getDepositById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const id = req.params.id as string;
      const deposit = await DepositService.getDepositById(id, userId);
      return sendSuccess(res, 'Berhasil mengambil detail setoran', deposit);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil detail setoran', null, 404);
    }
  }

  static async deleteDeposit(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const id = req.params.id as string;
      await DepositService.deleteDeposit(id, userId);
      return sendSuccess(res, 'Transaksi setoran berhasil dibatalkan dan dihapus', null);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal membatalkan setoran', null, 400);
    }
  }
}

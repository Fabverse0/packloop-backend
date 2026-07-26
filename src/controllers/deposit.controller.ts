import { Request, Response } from 'express';
import { DepositService } from '../services/deposit.service.js';
import { AIService } from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isPositiveNumber, isValidWasteType, isValidUUID } from '../utils/validation.js';

export class DepositController {
  /**
   * POST /api/deposits/analyze
   * Menganalisis foto kemasan menggunakan Google Gemini Vision AI.
   * Mengembalikan jenis kemasan, kelayakan fisik, jumlah barang, dan skor kepastian.
   */
  static async analyzePackaging(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const { imageBase64, mimeType } = req.body;

      // Validasi kelengkapan field
      if (!imageBase64 || !mimeType) {
        return sendError(res, 'Field imageBase64 dan mimeType wajib diisi', null, 400);
      }

      // Validasi mimeType (hanya gambar yang diperbolehkan)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        return sendError(res, 'Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP', null, 400);
      }

      // Validasi ukuran Base64 (maks ~5MB = ~6.67MB Base64)
      const maxBase64Length = 7 * 1024 * 1024; // ~7MB Base64 string
      if (imageBase64.length > maxBase64Length) {
        return sendError(res, 'Ukuran gambar terlalu besar. Maksimal 5MB', null, 400);
      }

      // Panggil AI Service Gemini Vision
      const analysisResult = await AIService.analyzePackagingImage(imageBase64, mimeType);

      return sendSuccess(res, 'Analisis kemasan berhasil', analysisResult);
    } catch (error: any) {
      console.error('❌ [analyzePackaging Error]:', error);
      return sendError(res, error.message || 'Gagal menganalisis foto kemasan', null, 500);
    }
  }

  static async createDeposit(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const { stationId, compartmentId, wasteType, weightOrCount } = req.body;

      // Validasi kelengkapan field
      if (!stationId || !compartmentId || !wasteType || weightOrCount === undefined) {
        return sendError(res, 'Field stationId, compartmentId, wasteType, dan weightOrCount wajib diisi', null, 400);
      }

      // Validasi format UUID
      if (!isValidUUID(stationId)) {
        return sendError(res, 'Format stationId tidak valid (harus UUID)', null, 400);
      }
      if (!isValidUUID(compartmentId)) {
        return sendError(res, 'Format compartmentId tidak valid (harus UUID)', null, 400);
      }

      // Validasi jenis kemasan
      if (!isValidWasteType(wasteType)) {
        return sendError(res, 'Jenis kemasan tidak valid. Pilih: TOTE_BAG atau PAPER_BAG', null, 400);
      }

      // Validasi berat/jumlah harus angka positif (> 0)
      if (!isPositiveNumber(weightOrCount)) {
        return sendError(res, 'Nilai weightOrCount harus berupa angka positif (lebih dari 0)', null, 400);
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
      if (!isValidUUID(id)) {
        return sendError(res, 'Format ID setoran tidak valid (harus UUID)', null, 400);
      }

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
      if (!isValidUUID(id)) {
        return sendError(res, 'Format ID setoran tidak valid (harus UUID)', null, 400);
      }

      await DepositService.deleteDeposit(id, userId);
      return sendSuccess(res, 'Transaksi setoran berhasil dibatalkan dan dihapus', null);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal membatalkan setoran', null, 400);
    }
  }
}

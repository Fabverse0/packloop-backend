import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuthController {
  /**
   * Get currently authenticated user details (Protected)
   */
  static async getMe(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Data pengguna tidak ditemukan.', null, 404);
      }

      return sendSuccess(res, 'Berhasil mendapatkan data akun pengguna.', { user });
    } catch (error: any) {
      return sendError(res, 'Gagal mengambil profil pengguna.', error.message, 500);
    }
  }

  /**
   * Verify token manually (Public endpoint)
   */
  static async verifyToken(req: Request, res: Response): Promise<Response> {
    try {
      // Prioritas 1: Authorization Header (dari Scalar UI / Postman / Mobile App)
      let token: string | undefined;
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      // Prioritas 2: Body token (fallback untuk kasus tertentu)
      if (!token && req.body?.token) {
        token = req.body.token;
      }

      if (!token) {
        return sendError(res, 'Field token wajib diisi atau sertakan di Authorization Header.', null, 400);
      }

      const { user, error } = await AuthService.verifyAccessToken(token);

      if (error || !user) {
        return sendError(res, 'Token tidak valid atau kedaluwarsa.', error?.message || null, 401);
      }

      return sendSuccess(res, 'Token valid.', { user });
    } catch (error: any) {
      return sendError(res, 'Terjadi kesalahan saat memverifikasi token.', error.message, 500);
    }
  }
}

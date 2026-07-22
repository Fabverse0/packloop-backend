import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const profile = await UserService.getProfile(userId);
      return sendSuccess(res, 'Berhasil mengambil profil pengguna', profile);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil profil', null, 500);
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const { full_name, phone_number, avatar_url } = req.body;
      const updatedProfile = await UserService.updateProfile(userId, {
        full_name,
        phone_number,
        avatar_url,
      });

      return sendSuccess(res, 'Profil berhasil diperbarui', updatedProfile);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal memperbarui profil', null, 500);
    }
  }

  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      await UserService.deleteAccount(userId);
      return sendSuccess(res, 'Akun dan seluruh data pengguna berhasil dihapus.', null);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal menghapus akun', null, 500);
    }
  }
}

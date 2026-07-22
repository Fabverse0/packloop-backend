import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class NotificationController {
  static async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const notifications = await NotificationService.getUserNotifications(userId);
      return sendSuccess(res, 'Berhasil mengambil daftar notifikasi', notifications);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil notifikasi', null, 500);
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const id = req.params.id as string;
      const notification = await NotificationService.markAsRead(id, userId);
      return sendSuccess(res, 'Notifikasi ditandai telah dibaca', notification);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal memperbarui status notifikasi', null, 500);
    }
  }

  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      const id = req.params.id as string;
      await NotificationService.deleteNotification(id, userId);
      return sendSuccess(res, 'Notifikasi berhasil dihapus', null);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal menghapus notifikasi', null, 500);
    }
  }

  static async clearAllNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'User tidak terautentikasi', null, 401);
      }

      await NotificationService.clearAllNotifications(userId);
      return sendSuccess(res, 'Seluruh notifikasi berhasil dibersihkan', null);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal membersihkan notifikasi', null, 500);
    }
  }
}

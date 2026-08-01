/**
 * Midtrans Webhook Controller
 * Mengelola endpoint callback/notifikasi dari server Midtrans.
 *
 * ⚠️ Endpoint ini dipanggil oleh SERVER Midtrans (bukan oleh aplikasi mobile),
 *    sehingga tidak memerlukan autentikasi JWT pengguna.
 *    Keamanan dijaga via verifikasi Signature Key SHA512.
 */
import { Request, Response } from 'express';
import { MidtransService } from '../services/midtrans.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MidtransController {
  /**
   * POST /api/webhooks/midtrans
   * Menerima notifikasi status transaksi dari Midtrans secara real-time.
   * Dipanggil otomatis oleh server Midtrans ketika status transaksi berubah.
   */
  static async handleWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const notification = req.body as Record<string, string>;

      // Validasi bahwa body notification memiliki order_id
      if (!notification || !notification.order_id) {
        return sendError(res, 'Payload webhook Midtrans tidak valid (order_id wajib ada).', null, 400);
      }

      const result = await MidtransService.handleWebhookNotification(notification);

      return sendSuccess(res, 'Webhook Midtrans berhasil diproses.', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses webhook Midtrans.';

      // Jika signature tidak valid, balas 403 Forbidden
      if (message.includes('Signature Midtrans tidak valid')) {
        return sendError(res, message, null, 403);
      }

      return sendError(res, message, null, 500);
    }
  }

  /**
   * GET /api/webhooks/midtrans/status/:orderId
   * Mengecek status transaksi Midtrans secara on-demand berdasarkan Order ID.
   * Digunakan untuk debugging atau sinkronisasi manual status transaksi.
   */
  static async getTransactionStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { orderId } = req.params;
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : String(orderId);

      if (!orderIdStr) {
        return sendError(res, 'Order ID wajib diisi.', null, 400);
      }

      const status = await MidtransService.getPayoutStatus(orderIdStr);
      return sendSuccess(res, 'Status transaksi berhasil diambil.', status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengambil status transaksi.';
      return sendError(res, message, null, 500);
    }
  }
}

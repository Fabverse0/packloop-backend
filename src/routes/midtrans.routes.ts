/**
 * Midtrans Webhook Routes
 * Rute yang dipanggil oleh server Midtrans secara otomatis
 * ketika ada perubahan status transaksi pembayaran.
 */
import { Router } from 'express';
import { MidtransController } from '../controllers/midtrans.controller.js';

const router = Router();

/**
 * POST /api/webhooks/midtrans
 * Endpoint Webhook utama untuk menerima notifikasi dari server Midtrans.
 * ⚠️ Tidak memerlukan JWT Auth — security via Signature Key SHA512.
 */
router.post('/', MidtransController.handleWebhook);

/**
 * GET /api/webhooks/midtrans/status/:orderId
 * Cek status transaksi Midtrans secara on-demand berdasarkan Order ID.
 */
router.get('/status/:orderId', MidtransController.getTransactionStatus);

export default router;

/**
 * Schema Zod untuk Modul Midtrans Iris Payout API (Pencairan Saldo & Webhook).
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const IrisWebhookPayloadSchema = z
  .object({
    order_id: z
      .string()
      .openapi({ description: 'Reference No dari sistem PackLoop', example: 'PKL-REDEEM-a9cf726f-1722531600000' }),
    transaction_status: z
      .string()
      .openapi({ description: 'Status payout dari Midtrans Iris', example: 'completed' }),
    status_code: z.string().openapi({ example: '200' }),
    gross_amount: z.string().openapi({ example: '100' }),
    signature_key: z
      .string()
      .openapi({ description: 'Signature SHA512 dari Midtrans untuk verifikasi keamanan' }),
    payment_type: z.string().optional().openapi({ example: 'gopay' }),
    fraud_status: z.string().optional().openapi({ example: 'accept' }),
  })
  .openapi('IrisWebhookPayload');

export const OrderIdParamSchema = z
  .object({
    orderId: z
      .string()
      .min(1, 'Order ID tidak boleh kosong')
      .openapi({ example: 'PKL-REDEEM-a9cf726f-1722531600000' }),
  })
  .openapi('OrderIdParam');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/webhooks/midtrans',
  summary: 'Midtrans Iris Webhook Callback (Notifikasi Status Payout)',
  description: [
    'Endpoint yang dipanggil oleh **server Midtrans Iris** secara otomatis ketika status pencairan saldo berubah.',
    '',
    '### ⚠️ Catatan Penting:',
    '- Endpoint ini **TIDAK** dipanggil oleh aplikasi mobile, melainkan oleh server Midtrans Iris.',
    '- Keamanan dijaga via verifikasi **Signature Key SHA512**.',
    '- Tidak memerlukan JWT Bearer Token.',
    '',
    '### Status Payout Iris yang Diproses:',
    '- `completed` → Status Redemption → **SUCCESS** 🎉',
    '- `queued` / `processed` → Status Redemption → **PENDING** ⏳',
    '- `failed` → Status Redemption → **FAILED** ❌',
  ].join('\n'),
  tags: ['Midtrans Iris Payout Gateway'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: IrisWebhookPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Webhook berhasil diproses — status redemption diperbarui.' },
    400: { description: 'Payload webhook tidak valid / field wajib tidak ditemukan.' },
    403: { description: 'Signature Key Midtrans tidak valid — request ditolak.' },
    500: { description: 'Gagal memproses webhook.' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/webhooks/midtrans/status/{orderId}',
  summary: 'Cek Status Payout Iris (On-Demand)',
  description:
    'Mengambil status pencairan saldo terbaru langsung dari API Midtrans Iris berdasarkan Reference No.\nDigunakan untuk debugging atau sinkronisasi manual status payout.',
  tags: ['Midtrans Iris Payout Gateway'],
  request: {
    params: OrderIdParamSchema,
  },
  responses: {
    200: { description: 'Status payout berhasil diambil dari Midtrans Iris.' },
    400: { description: 'Order ID wajib diisi.' },
    500: { description: 'Gagal mengambil status dari API Midtrans Iris.' },
  },
});

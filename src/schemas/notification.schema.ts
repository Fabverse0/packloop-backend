/**
 * Schema Zod untuk Modul Notifikasi (Notifications).
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const NotificationIdParamSchema = z
  .object({
    id: z
      .string()
      .uuid('ID notifikasi harus berformat UUID v4')
      .openapi({ example: 'e1f83a21-9d10-4e51-8b20-74e92a11b015' }),
  })
  .openapi('NotificationIdParam');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/notifications',
  summary: 'Ambil Daftar Notifikasi Pengguna',
  description: 'Mengambil seluruh daftar notifikasi real-time milik pengguna (termasuk notifikasi siaran/broadcast).',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Berhasil mengambil daftar notifikasi.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal mengambil notifikasi.' },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/notifications/{id}/read',
  summary: 'Tandai Notifikasi Sebagai Telah Dibaca',
  description: 'Mengubah status notifikasi spesifik menjadi sudah dibaca (`is_read = true`).',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: NotificationIdParamSchema,
  },
  responses: {
    200: { description: 'Notifikasi ditandai telah dibaca.' },
    400: { description: 'Format ID notifikasi tidak valid.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal memperbarui status notifikasi.' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/notifications/{id}',
  summary: 'Hapus 1 Notifikasi Tertentu',
  description: 'Menghapus 1 entri notifikasi spesifik berdasarkan UUID notifikasinya.',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: NotificationIdParamSchema,
  },
  responses: {
    200: { description: 'Notifikasi berhasil dihapus.' },
    400: { description: 'Format ID notifikasi tidak valid.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal menghapus notifikasi.' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/notifications',
  summary: 'Bersihkan Seluruh Notifikasi (Clear All)',
  description: 'Menghapus seluruh daftar notifikasi pengguna sekaligus.',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Seluruh notifikasi berhasil dibersihkan.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal membersihkan notifikasi.' },
  },
});

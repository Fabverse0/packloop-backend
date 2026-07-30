/**
 * Schema Zod untuk Modul Setoran & AI Scan Packaging (Deposits).
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const AnalyzePackagingSchema = z
  .object({
    imageBase64: z
      .string()
      .min(10, 'imageBase64 tidak boleh kosong')
      .openapi({
        description: 'String Base64 dari foto kemasan (tanpa prefix data:image/...;base64,)',
        example: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP...',
      }),
    mimeType: z
      .enum(['image/jpeg', 'image/png', 'image/webp'], {
        error: 'mimeType harus image/jpeg, image/png, atau image/webp',
      })
      .openapi({ description: 'Tipe MIME gambar', example: 'image/jpeg' }),
  })
  .openapi('AnalyzePackagingRequest');

export const CreateDepositSchema = z
  .object({
    stationId: z
      .string()
      .uuid('stationId harus berformat UUID v4')
      .openapi({ example: 'b2f83a21-9d10-4e51-8b20-74e92a11b012' }),
    compartmentId: z
      .string()
      .uuid('compartmentId harus berformat UUID v4')
      .openapi({ example: 'a1f83a21-9d10-4e51-8b20-74e92a11b011' }),
    wasteType: z
      .enum(['TOTE_BAG', 'PAPER_BAG'], {
        error: 'wasteType harus TOTE_BAG atau PAPER_BAG',
      })
      .openapi({ example: 'TOTE_BAG' }),
    weightOrCount: z
      .number({ error: 'weightOrCount harus berupa angka' })
      .positive('weightOrCount harus angka positif (> 0)')
      .openapi({
        description: 'Jumlah unit/pcs kemasan (bukan berat gram)',
        example: 2,
      }),
  })
  .openapi('CreateDepositRequest');

export const DepositIdParamSchema = z
  .object({
    id: z
      .string()
      .uuid('ID setoran harus berformat UUID v4')
      .openapi({ example: 'c1f83a21-9d10-4e51-8b20-74e92a11b013' }),
  })
  .openapi('DepositIdParam');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/deposits/analyze',
  summary: 'AI Scan Analisis Foto Kemasan (Gemini Vision)',
  description:
    'Menganalisis foto kemasan menggunakan **Google Gemini Vision AI**.\nMengembalikan jenis kemasan (TOTE_BAG/PAPER_BAG), kelayakan fisik, jumlah unit, dan skor kepastian AI.',
  tags: ['Setor Kemasan (Drop-off)'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: AnalyzePackagingSchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Analisis kemasan berhasil.' },
    400: { description: 'Validasi input gagal / format gambar tidak didukung.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal memproses respons AI.' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/deposits',
  summary: 'Catat Transaksi Setoran Baru (Drop-off)',
  description:
    'Mencatat transaksi setoran kemasan daur ulang baru ke kompartemen stasiun.\nPoin reward dan carbon saved dikalkulasi otomatis berdasarkan konfigurasi master `waste_type_configs`.',
  tags: ['Setor Kemasan (Drop-off)'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateDepositSchema,
        },
      },
    },
  },
  responses: {
    201: { description: 'Setoran kemasan berhasil dicatat!' },
    400: { description: 'Input data tidak valid.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal membuat transaksi setoran.' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/deposits',
  summary: 'Ambil Riwayat Setoran Pengguna',
  description: 'Mengambil seluruh riwayat transaksi setoran daur ulang milik pengguna yang sedang login.',
  tags: ['Setor Kemasan (Drop-off)'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Berhasil mengambil riwayat setoran.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal mengambil riwayat setoran.' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/deposits/{id}',
  summary: 'Ambil Detail Setoran & Timeline Order Tracking',
  description:
    'Mengambil detail transaksi setoran spesifik beserta log timeline *Order Tracking* daur ulang.\n\nStatus tahapan: `DEPOSITED` → `SORTED` → `PICKED_UP` → `IN_TRANSIT` → `RECYCLED`.',
  tags: ['Setor Kemasan (Drop-off)'],
  security: [{ bearerAuth: [] }],
  request: {
    params: DepositIdParamSchema,
  },
  responses: {
    200: { description: 'Berhasil mengambil detail setoran.' },
    400: { description: 'Format ID setoran tidak valid.' },
    401: { description: 'Tidak terautentikasi.' },
    404: { description: 'Setoran tidak ditemukan.' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/deposits/{id}',
  summary: 'Batalkan / Hapus Transaksi Setoran',
  description: 'Membatalkan dan menghapus transaksi setoran (hanya berlaku jika status masih `DEPOSITED`).',
  tags: ['Setor Kemasan (Drop-off)'],
  security: [{ bearerAuth: [] }],
  request: {
    params: DepositIdParamSchema,
  },
  responses: {
    200: { description: 'Transaksi setoran berhasil dibatalkan.' },
    400: { description: 'Setoran tidak dapat dibatalkan / format ID tidak valid.' },
    401: { description: 'Tidak terautentikasi.' },
  },
});

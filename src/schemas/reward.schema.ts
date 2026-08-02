/**
 * Schema Zod untuk Modul Reward & E-Wallet.
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const RedeemPointsSchema = z
  .object({
    eWalletProvider: z
      .enum(['GOPAY', 'OVO', 'DANA', 'LINKAJA'], {
        error: 'eWalletProvider harus GOPAY, OVO, DANA, atau LINKAJA',
      })
      .openapi({ example: 'GOPAY' }),
    accountNumber: z
      .string()
      .min(8, 'Nomor akun minimal 8 karakter')
      .max(20, 'Nomor akun maksimal 20 karakter')
      .openapi({ description: 'Nomor akun / nomor HP e-wallet tujuan', example: '08123456789' }),
    pointsRedeemed: z
      .number({ error: 'pointsRedeemed harus berupa angka' })
      .int('pointsRedeemed harus bilangan bulat')
      .min(10, 'Penukaran poin minimal 10 poin (= Rp1)')
      .openapi({ example: 1000 }),
  })
  .openapi('RedeemPointsRequest');

export const RedemptionIdParamSchema = z
  .object({
    id: z
      .string()
      .uuid('ID penukaran harus berformat UUID v4')
      .openapi({ example: 'd1f83a21-9d10-4e51-8b20-74e92a11b014' }),
  })
  .openapi('RedemptionIdParam');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/rewards/rules',
  summary: 'Ambil Aturan Poin & Karbon per Jenis Kemasan',
  description:
    'Mengembalikan daftar aturan konversi poin reward dan rasio penyelamatan emisi karbon per unit kemasan (TOTE_BAG & PAPER_BAG).',
  tags: ['Reward & E-Wallet'],
  responses: {
    200: { description: 'Berhasil mengambil aturan reward poin.' },
    500: { description: 'Gagal mengambil aturan reward.' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/rewards/redeem',
  summary: 'Tukarkan Poin ke E-Wallet (Min. 500 Poin)',
  description:
    'Mengajukan penukaran poin reward pengguna menjadi saldo E-Wallet (GoPay, OVO, DANA, LinkAja).\nKonversi: **100 poin = Rp10**. Minimal penukaran: **500 poin (= Rp50)**.',
  tags: ['Reward & E-Wallet'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RedeemPointsSchema,
        },
      },
    },
  },
  responses: {
    201: { description: 'Penukaran poin berhasil diproses!' },
    400: { description: 'Input tidak valid / poin tidak mencukupi.' },
    401: { description: 'Tidak terautentikasi.' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/rewards/history',
  summary: 'Ambil Riwayat Penukaran Poin',
  description: 'Mengambil seluruh riwayat transaksi penukaran poin ke E-Wallet milik pengguna.',
  tags: ['Reward & E-Wallet'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Berhasil mengambil riwayat penukaran poin.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal mengambil riwayat penukaran.' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/rewards/history/{id}',
  summary: 'Batalkan Permintaan Penukaran Poin (Status PENDING)',
  description:
    'Membatalkan penukaran poin yang masih berstatus `PENDING`.\nPoin yang sebelumnya dipotong akan otomatis dikembalikan ke saldo pengguna.',
  tags: ['Reward & E-Wallet'],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedemptionIdParamSchema,
  },
  responses: {
    200: { description: 'Permintaan penukaran poin berhasil dibatalkan.' },
    400: { description: 'Penukaran tidak dapat dibatalkan / format ID tidak valid.' },
    401: { description: 'Tidak terautentikasi.' },
  },
});

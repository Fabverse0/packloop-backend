/**
 * Schema Zod untuk Modul Profil Pengguna (User Profile).
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Nama lengkap tidak boleh kosong')
      .max(100, 'Nama lengkap maksimal 100 karakter')
      .optional()
      .openapi({ example: 'Muhammad Fabian Rizky' }),
    phone_number: z
      .string()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor HP tidak valid (contoh: 08123456789)')
      .optional()
      .openapi({ example: '08123456789' }),
    avatar_url: z
      .string()
      .url('Format URL avatar tidak valid')
      .optional()
      .openapi({ example: 'https://example.com/avatar.jpg' }),
  })
  .openapi('UpdateProfileRequest');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/users/profile',
  summary: 'Ambil Profil & Statistik Pengguna',
  description:
    'Mengambil profil pengguna aktif beserta statistik akumulasi: total poin reward, total berat kemasan (kg), dan total karbon hemat (kg CO₂).',
  tags: ['User Profile & Dashboard'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Berhasil mengambil profil pengguna.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal mengambil profil.' },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/users/profile',
  summary: 'Perbarui Profil Pengguna',
  description: 'Memperbarui nama lengkap, nomor telepon, dan/atau URL foto avatar pengguna.',
  tags: ['User Profile & Dashboard'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateProfileSchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Profil berhasil diperbarui.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal memperbarui profil.' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/users/profile',
  summary: 'Hapus Akun & Seluruh Data Pengguna',
  description:
    'Menghapus akun pengguna secara permanen dari Supabase Auth beserta seluruh data profil, setoran, dan penukaran poin. **Aksi ini tidak dapat dibatalkan.**',
  tags: ['User Profile & Dashboard'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Akun dan seluruh data pengguna berhasil dihapus.' },
    401: { description: 'Tidak terautentikasi.' },
    500: { description: 'Gagal menghapus akun.' },
  },
});

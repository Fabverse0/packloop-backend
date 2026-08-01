/**
 * Schema Zod untuk Modul Autentikasi (Auth).
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const VerifyTokenBodySchema = z
  .object({
    token: z
      .string()
      .optional()
      .openapi({ description: 'JWT Token Supabase (opsional jika sudah di Authorization Header)' }),
  })
  .openapi('VerifyTokenRequest');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  summary: 'Ambil Data Akun Pengguna Aktif',
  description: 'Mengambil data lengkap pengguna yang saat ini sedang login berdasarkan JWT Token.',
  tags: ['Autentikasi'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Berhasil mendapatkan data akun pengguna.' },
    401: { description: 'Token autentikasi tidak ditemukan atau tidak valid.' },
    404: { description: 'Data pengguna tidak ditemukan.' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/verify-token',
  summary: 'Verifikasi JWT Token (Public)',
  description:
    'Memverifikasi keabsahan JWT Token Supabase.\nToken dapat dikirim melalui Authorization Header atau Body.\n\n**Testing Lokal:** Gunakan Bearer Token `test` untuk melewati autentikasi.',
  tags: ['Autentikasi'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VerifyTokenBodySchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Token valid.' },
    400: { description: 'Field token wajib diisi.' },
    401: { description: 'Token tidak valid atau kedaluwarsa.' },
  },
});

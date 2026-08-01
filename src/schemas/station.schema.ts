/**
 * Schema Zod untuk Modul Stasiun Drop-off IoT (Stations).
 * File ini mendaftarkan skema & rute ke OpenAPI Registry secara otomatis saat diimpor.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../docs/openapi-registry.js';

extendZodWithOpenApi(z);

// ── Schema ─────────────────────────────────────────────────────────────────

export const StationIdParamSchema = z
  .object({
    id: z
      .string()
      .uuid('ID stasiun harus berformat UUID v4')
      .openapi({ example: 'b2f83a21-9d10-4e51-8b20-74e92a11b012' }),
  })
  .openapi('StationIdParam');

// ── Route Registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/stations',
  summary: 'Ambil Daftar Semua Stasiun Drop-off',
  description:
    'Mengambil daftar seluruh stasiun fisik PackLoop yang aktif beserta data kompartemen di dalamnya (koordinat lat/lng, status kapasitas).',
  tags: ['Maps & Stasiun PackCycle'],
  responses: {
    200: { description: 'Berhasil mengambil daftar stasiun.' },
    500: { description: 'Gagal mengambil daftar stasiun.' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/stations/{id}',
  summary: 'Ambil Detail Stasiun Berdasarkan ID',
  description: 'Mengambil data lengkap stasiun tertentu berdasarkan UUID stasiunnya.',
  tags: ['Maps & Stasiun PackCycle'],
  request: {
    params: StationIdParamSchema,
  },
  responses: {
    200: { description: 'Berhasil mengambil detail stasiun.' },
    400: { description: 'Format ID stasiun tidak valid.' },
    404: { description: 'Stasiun tidak ditemukan.' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/stations/{id}/compartments',
  summary: 'Ambil Daftar Kompartemen Stasiun',
  description:
    'Mengambil daftar kompartemen di dalam stasiun tertentu beserta status kapasitasnya (AVAILABLE / ALMOST_FULL / FULL).',
  tags: ['Maps & Stasiun PackCycle'],
  request: {
    params: StationIdParamSchema,
  },
  responses: {
    200: { description: 'Berhasil mengambil daftar kompartemen.' },
    400: { description: 'Format ID stasiun tidak valid.' },
    500: { description: 'Gagal mengambil daftar kompartemen.' },
  },
});

import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

/**
 * Registri pusat untuk seluruh skema Zod & rute OpenAPI PackLoop.
 * Seluruh file di src/schemas/ mengimpor registry ini dan mendaftarkan
 * skema & rute mereka secara otomatis saat diimpor.
 */
export const registry = new OpenAPIRegistry();

// Registrasi Security Scheme Bearer Auth (JWT Supabase)
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description:
    'Masukkan Supabase JWT Access Token.\nFormat: Bearer <ACCESS_TOKEN>\n\nUntuk testing lokal, gunakan token shortcut: **test**',
});

/**
 * Menghasilkan objek spesifikasi OpenAPI 3.0.3 secara otomatis dari registry Zod.
 * Dipanggil saat server start — menghasilkan dokumen terbaru setiap kali ada perubahan skema.
 */
export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'PackLoop Backend Core API Documentation',
      version: '1.0.0',
      description: [
        'Dokumentasi resmi OpenAPI 3.0 & API Reference lengkap untuk aplikasi **PackLoop** (Mobile Client & IoT Stations).',
        '',
        '### 🌿 Tentang PackLoop:',
        'PackLoop adalah platform daur ulang kemasan belanja bekas (tote bag, paper bag) berbasis IoT dan kompensasi reward.',
        '',
        '### 🔑 Panduan Autentikasi:',
        '1. Lakukan login melalui Supabase Auth di aplikasi mobile.',
        '2. Salin `access_token` (JWT Token) yang didapatkan.',
        '3. Klik tombol **Authorize** di Scalar UI dan masukkan token.',
        '4. Format: `Bearer <TOKEN_JWT_SUPABASE>`.',
        '',
        '### 🧪 Testing Lokal (Dev Shortcut):',
        'Gunakan token **`test`** sebagai Bearer Token untuk testing di Scalar UI lokal.',
      ].join('\n'),
      contact: {
        name: 'Tim Pengembang Backend PackLoop',
        url: 'https://github.com/Fabverse0/packloop-backend',
      },
    },
    servers: [
      {
        url: 'https://packloop-backend-beryl.vercel.app',
        description: 'Server Produksi (Vercel Cloud)',
      },
      {
        url: 'http://localhost:5000',
        description: 'Server Lokal (Development)',
      },
    ],
  });
}

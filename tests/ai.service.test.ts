import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../src/services/ai.service.js';

describe('AIService (Seam C - Gemini Packaging AI)', () => {
  it('1. Harus MENOLAK jika mimeType tidak didukung', async () => {
    await assert.rejects(
      async () => {
        // format mimeType 'application/pdf' tidak valid untuk gambar
        await AIService.analyzePackagingImage('dummyBase64Data', 'application/pdf');
      },
      (err: Error) => {
        assert.match(err.message, /tidak didukung|format/i);
        return true;
      },
      'MimeType selain image/jpeg, image/png, image/webp harus ditolak'
    );
  });

  it('2. 🟢 (GREEN) Harus MENOLAK jika string imageBase64 kosong / spasi', async () => {
    await assert.rejects(
      async () => {
        await AIService.analyzePackagingImage('   ', 'image/jpeg');
      },
      (err: Error) => {
        assert.match(err.message, /tidak boleh kosong|wajib diisi/i);
        return true;
      },
      'String Base64 gambar kosong harus melempar error validasi yang bersih'
    );
  });
});

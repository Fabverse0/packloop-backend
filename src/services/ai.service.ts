import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Hasil analisis kemasan dari Google Gemini Vision AI.
 */
export interface PackagingAnalysisResult {
  isEligible: boolean;
  status: 'LAYAK' | 'TIDAK_LAYAK';
  wasteType: 'TOTE_BAG' | 'PAPER_BAG' | 'UNKNOWN';
  quantity: number;
  confidenceScore: number;
  isScreenPhoto: boolean;
  reason: string;
}

// Inisialisasi Google Gemini AI Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Prompt terstruktur untuk analisis kemasan daur ulang.
 * Mencakup: identifikasi jenis, kelayakan fisik, hitung jumlah, dan deteksi foto layar.
 */
const PACKAGING_ANALYSIS_PROMPT = `
Kamu adalah sistem AI pendeteksi kemasan daur ulang untuk aplikasi PackLoop.

Tugas kamu:
1. IDENTIFIKASI JENIS KEMASAN: Tentukan apakah objek pada foto adalah TOTE_BAG (kantong kain/tote bag) atau PAPER_BAG (kantong kertas/paper bag). Jika bukan keduanya, beri wasteType = "UNKNOWN".
2. ANALISIS KELAYAKAN FISIK: Tentukan apakah kemasan tersebut LAYAK (utuh, bersih, tidak sobek/bolong/penyok) atau TIDAK_LAYAK (sobek, bolong, kotor parah, rusak berat). Berikan alasan spesifik dalam bahasa Indonesia.
3. HITUNG JUMLAH BARANG: Hitung jumlah unit/pcs kemasan yang terlihat pada foto (1 sampai 10). Jika barang saling bertumpuk dan sulit dihitung, berikan estimasi terbaik.
4. DETEKSI FOTO LAYAR: Periksa apakah foto ini diambil langsung dari objek fisik asli, ATAU merupakan foto ulang dari layar monitor/HP/tablet lain (terlihat piksel layar, Moire Pattern, atau bingkai monitor). Jika terdeteksi foto layar, set isScreenPhoto = true.
5. SKOR KEPASTIAN: Berikan confidenceScore (0.00 - 1.00) yang menunjukkan seberapa yakin kamu terhadap analisis ini.

ATURAN PENTING:
- Jika foto terlalu gelap, buram, atau tidak jelas sehingga sulit dianalisis, berikan confidenceScore rendah (< 0.70) dan status TIDAK_LAYAK dengan alasan "Foto tidak cukup jelas untuk dianalisis".
- Jika objek pada foto BUKAN kantong kain (tote bag) maupun kantong kertas (paper bag), berikan wasteType = "UNKNOWN" dan isEligible = false.
- Jumlah barang (quantity) TIDAK BOLEH melebihi 10. Jika terlihat lebih dari 10, tetap set quantity = 10.

Jawab HANYA dalam format JSON berikut (tanpa markdown, tanpa komentar, tanpa backtick):
{
  "isEligible": true,
  "status": "LAYAK",
  "wasteType": "TOTE_BAG",
  "quantity": 1,
  "confidenceScore": 0.95,
  "isScreenPhoto": false,
  "reason": "Terdeteksi 1 tote bag kain dalam kondisi utuh dan bersih"
}
`;

export class AIService {
  /**
   * Menganalisis foto kemasan menggunakan Google Gemini Vision AI.
   * @param imageBase64 - String Base64 dari foto kemasan (tanpa prefix "data:image/...;base64,").
   * @param mimeType - Tipe MIME gambar (misal: "image/jpeg", "image/png").
   * @returns Hasil analisis kemasan (PackagingAnalysisResult).
   */
  static async analyzePackagingImage(
    imageBase64: string,
    mimeType: string
  ): Promise<PackagingAnalysisResult> {
    // Validasi API Key
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY belum dikonfigurasi di file .env');
    }

    // Kirim gambar + prompt ke Gemini Vision
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: PACKAGING_ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    // Ambil teks respons dari Gemini
    const rawText = response.text?.trim() || '';

    // Parsing JSON respons Gemini
    let analysisResult: PackagingAnalysisResult;
    try {
      // Bersihkan jika ada backtick markdown
      const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedText);
    } catch {
      throw new Error(`Gagal memproses respons AI. Raw response: ${rawText.substring(0, 200)}`);
    }

    // === PENGAMAN 1: Validasi confidenceScore (harus >= 0.70) ===
    if (analysisResult.confidenceScore < 0.70) {
      analysisResult.isEligible = false;
      analysisResult.status = 'TIDAK_LAYAK';
      analysisResult.reason = 'Foto kurang jelas atau terlalu gelap. Silakan ambil foto ulang dengan pencahayaan yang cukup.';
    }

    // === PENGAMAN 4: Deteksi foto layar monitor ===
    if (analysisResult.isScreenPhoto) {
      analysisResult.isEligible = false;
      analysisResult.status = 'TIDAK_LAYAK';
      analysisResult.reason = 'Terdeteksi foto dari layar monitor/HP lain. Gunakan foto objek kemasan fisik secara langsung.';
    }

    // === PENGAMAN 6: Batas logis jumlah barang (maks 10 unit) ===
    if (analysisResult.quantity > 10) {
      analysisResult.quantity = 10;
      analysisResult.reason += ' (Jumlah dibatasi maksimal 10 unit per foto).';
    }
    if (analysisResult.quantity < 1) {
      analysisResult.quantity = 1;
    }

    // === Validasi wasteType: jika bukan TOTE_BAG / PAPER_BAG ===
    if (analysisResult.wasteType !== 'TOTE_BAG' && analysisResult.wasteType !== 'PAPER_BAG') {
      analysisResult.isEligible = false;
      analysisResult.status = 'TIDAK_LAYAK';
      analysisResult.wasteType = 'UNKNOWN';
      analysisResult.reason = 'Objek pada foto bukan tote bag atau paper bag. Hanya kemasan tote bag dan paper bag yang dapat didaur ulang melalui PackLoop.';
    }

    return analysisResult;
  }
}

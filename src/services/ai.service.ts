import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export type AIProvider = 'GEMINI' | 'OPENROUTER';

/**
 * Dilempar saat semua provider AI sedang sibuk/gagal, supaya controller bisa membalas 503.
 */
export class AIServiceUnavailableError extends Error {
  statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceUnavailableError';
  }
}

/**
 * Hasil analisis kemasan dari AI (Gemini, atau OpenRouter sebagai cadangan).
 */
export interface PackagingAnalysisResult {
  aiProvider: AIProvider;
  isEligible: boolean;
  status: 'LAYAK' | 'TIDAK_LAYAK';
  wasteType: 'TOTE_BAG' | 'PAPER_BAG' | 'UNKNOWN';
  quantity: number;
  confidenceScore: number;
  isScreenPhoto: boolean;
  reason: string;
  estimatedWeightKg: number;
  estimatedPoints: number;
  estimatedCarbonSavedKg: number;
}

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

const RETRY_DELAYS_MS = [1000, 2000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Error sementara (server sibuk, kuota/rate limit, gangguan jaringan) yang layak dicoba ulang.
 */
function isRetryableError(error: any): boolean {
  const status = Number(error?.status ?? error?.code);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
  return /overloaded|unavailable|resource_exhausted|rate limit|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    String(error?.message ?? '')
  );
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || !isRetryableError(error)) throw error;
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

/**
 * Ambil objek JSON dari teks respons AI (toleran terhadap ```json fence atau teks tambahan).
 */
function parseJsonResponse(rawText: string): PackagingAnalysisResult {
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  try {
    return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  } catch {
    throw new Error(`Gagal memproses respons AI. Raw response: ${rawText.substring(0, 200)}`);
  }
}

async function callGemini(imageBase64: string, mimeType: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { text: PACKAGING_ANALYSIS_PROMPT },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
  });
  return response.text?.trim() || '';
}

async function callOpenRouter(imageBase64: string, mimeType: string, apiKey: string): Promise<string> {
  const client = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: { 'X-Title': 'PackLoop' },
  });
  const completion = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'stealth/crouton-alpha',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PACKAGING_ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

export class AIService {
  /**
   * Menganalisis foto kemasan dengan AI vision.
   * Urutan: Gemini (dicoba ulang jika sibuk) -> OpenRouter sebagai cadangan.
   * @param imageBase64 - String Base64 dari foto kemasan (prefix "data:image/...;base64," akan dibuang otomatis).
   * @param mimeType - Tipe MIME gambar (misal: "image/jpeg", "image/png").
   * @returns Hasil analisis kemasan (PackagingAnalysisResult).
   */
  static async analyzePackagingImage(
    imageBase64: string,
    mimeType: string
  ): Promise<PackagingAnalysisResult> {
    // Buang prefix data URL jika frontend mengirim "data:image/...;base64,xxxx"
    imageBase64 = (imageBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();

    // Validasi kelengkapan gambar & format mimeType
    if (!imageBase64) {
      throw new Error('String Base64 gambar tidak boleh kosong');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Format gambar tidak didukung. Gunakan image/jpeg, image/png, atau image/webp');
    }

    const providers: { name: AIProvider; apiKey: string; call: typeof callGemini }[] = [
      { name: 'GEMINI' as const, apiKey: process.env.GEMINI_API_KEY || '', call: callGemini },
      { name: 'OPENROUTER' as const, apiKey: process.env.OPENROUTER_API_KEY || '', call: callOpenRouter },
    ].filter((p) => p.apiKey);

    if (providers.length === 0) {
      throw new Error('GEMINI_API_KEY atau OPENROUTER_API_KEY belum dikonfigurasi di file .env');
    }

    // Coba provider satu per satu sampai ada yang berhasil
    let analysisResult: PackagingAnalysisResult | null = null;
    for (const provider of providers) {
      const startedAt = Date.now();
      try {
        const rawText = await withRetry(() => provider.call(imageBase64, mimeType, provider.apiKey));
        // aiProvider ditaruh di urutan pertama agar terlihat di potongan log frontend
        analysisResult = Object.assign({ aiProvider: provider.name }, parseJsonResponse(rawText), {
          aiProvider: provider.name,
        });
        console.log(`[AIService] ${provider.name} berhasil dalam ${Date.now() - startedAt}ms`);
        break;
      } catch (error: any) {
        // Detail teknis hanya dicatat di log server, tidak dikirim ke pengguna
        console.warn(`[AIService] ${provider.name} gagal setelah ${Date.now() - startedAt}ms: ${error?.message}`);
      }
    }

    if (!analysisResult) {
      throw new AIServiceUnavailableError('Layanan AI sedang sibuk. Silakan coba lagi beberapa saat.');
    }

    // Pastikan field angka benar-benar angka
    analysisResult.quantity = Math.round(Number(analysisResult.quantity) || 1);
    analysisResult.confidenceScore = Number(analysisResult.confidenceScore) || 0;

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

    // === HITUNG ESTIMASI BERAT, POIN, DAN KARBON SAVED REALISTIS ===
    // Tote Bag = 0.20 kg (200 gram) / unit
    // Paper Bag = 0.05 kg (50 gram) / unit
    if (analysisResult.wasteType === 'TOTE_BAG') {
      analysisResult.estimatedWeightKg = Number((analysisResult.quantity * 0.20).toFixed(2));
      analysisResult.estimatedPoints = analysisResult.quantity * 50;
      analysisResult.estimatedCarbonSavedKg = Number((analysisResult.quantity * 0.50).toFixed(2));
    } else if (analysisResult.wasteType === 'PAPER_BAG') {
      analysisResult.estimatedWeightKg = Number((analysisResult.quantity * 0.05).toFixed(2));
      analysisResult.estimatedPoints = analysisResult.quantity * 30;
      analysisResult.estimatedCarbonSavedKg = Number((analysisResult.quantity * 0.30).toFixed(2));
    } else {
      analysisResult.estimatedWeightKg = 0;
      analysisResult.estimatedPoints = 0;
      analysisResult.estimatedCarbonSavedKg = 0;
    }

    return analysisResult;
  }
}

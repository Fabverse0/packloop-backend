/**
 * Utility Validasi Input untuk PackLoop API
 * Digunakan pada controller sebelum data dikirim ke service/database.
 */

const VALID_WASTE_TYPES = ['TOTE_BAG', 'PAPER_BAG'] as const;
const VALID_EWALLET_PROVIDERS = ['GOPAY', 'OVO', 'DANA', 'LINKAJA'] as const;

/**
 * Memeriksa apakah nilai adalah angka positif (> 0) dan valid.
 */
export function isPositiveNumber(value: unknown): value is number {
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num > 0;
}

/**
 * Memeriksa apakah jenis kemasan valid (TOTE_BAG, PAPER_BAG).
 */
export function isValidWasteType(type: unknown): boolean {
  return typeof type === 'string' && VALID_WASTE_TYPES.includes(type as any);
}

/**
 * Memeriksa apakah provider e-wallet valid (GOPAY, OVO, DANA, LINKAJA).
 */
export function isValidEWalletProvider(provider: unknown): boolean {
  return typeof provider === 'string' && VALID_EWALLET_PROVIDERS.includes(provider as any);
}

/**
 * Memeriksa apakah string adalah UUID v4 yang valid.
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

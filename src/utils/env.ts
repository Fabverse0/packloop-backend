/**
 * True hanya saat backend berjalan lokal (bukan di Vercel) dengan NODE_ENV=development.
 * Di Vercel selalu false, apa pun nilai NODE_ENV, supaya fitur debug/dev tidak bocor ke produksi.
 */
export const isLocalDev = (): boolean =>
  !process.env.VERCEL && process.env.NODE_ENV === 'development';

/**
 * Nama environment yang sedang berjalan (production / preview / development).
 */
export const currentEnvironment = (): string =>
  process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

/**
 * Centralized Error Handling Middleware
 * Menangkap seluruh uncaught errors / unhandled exceptions agar server
 * tidak crash dan selalu mengembalikan format JSON standar ApiResponse.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  console.error('❌ Unhandled Error:', err.message);
  console.error(err.stack);

  return sendError(
    res,
    'Terjadi kesalahan internal pada server. Silakan coba lagi nanti.',
    process.env.NODE_ENV === 'development' ? err.message : null,
    500
  );
}

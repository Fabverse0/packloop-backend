import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendError } from '../utils/response.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Akses ditolak. Token autentikasi tidak ditemukan.',
        null,
        401
      );
    }

    const rawToken = authHeader.split(' ')[1];

    if (!rawToken) {
      return sendError(
        res,
        'Format token tidak valid.',
        null,
        401
      );
    }

    // Verify access token using smart AuthService
    const { user, error } = await AuthService.verifyAccessToken(rawToken);

    if (error || !user) {
      return sendError(
        res,
        'Token tidak valid atau telah kedaluwarsa.',
        error ? error.message : null,
        401
      );
    }

    // Attach user payload to request
    req.user = user;
    next();
  } catch (err: any) {
    return sendError(
      res,
      'Terjadi kesalahan pada server saat memverifikasi autentikasi.',
      err.message,
      500
    );
  }
};

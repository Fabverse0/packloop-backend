import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Format pesan error dari Zod v4 issues.
 * Zod v4 menggunakan `error.issues` (bukan `error.errors`).
 * `issue.path` bertipe `PropertyKey[]` di Zod v4.
 */
function formatZodIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path
        .map((p) => String(p))
        .join('.') || 'field';
      return `${path}: ${issue.message}`;
    })
    .join(', ');
}

/**
 * Middleware Express untuk memvalidasi req.body menggunakan skema Zod.
 * Kompatibel dengan Zod v4.
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, `Validasi input gagal: ${formatZodIssues(error)}`, error.issues, 400);
      }
      return sendError(res, 'Format data tidak valid.', null, 400);
    }
  };
};

/**
 * Middleware Express untuk memvalidasi req.params menggunakan skema Zod.
 * Kompatibel dengan Zod v4.
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, `Validasi parameter URL gagal: ${formatZodIssues(error)}`, error.issues, 400);
      }
      return sendError(res, 'Format parameter URL tidak valid.', null, 400);
    }
  };
};

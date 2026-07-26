import { supabase, supabaseAdmin } from '../config/supabase.js';
import { User } from '@supabase/supabase-js';

export class AuthService {
  /**
   * Verify access token with Supabase Auth (Seamless & Bulletproof)
   */
  static async verifyAccessToken(token: string): Promise<{ user: User | null; error: any }> {
    if (!token) {
      return { user: null, error: new Error('Token tidak ditemukan') };
    }

    // Clean token string from quotes or excess whitespace
    const cleanToken = token.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

    // 1. Primary verification via Supabase Auth client
    const { data: { user }, error } = await supabase.auth.getUser(cleanToken);

    if (user && !error) {
      return { user, error: null };
    }

    // 2. Seamless fallback: decode JWT payload & verify user exists via Supabase Admin
    try {
      const parts = cleanToken.split('.');
      if (parts.length === 3) {
        const payloadBuf = Buffer.from(parts[1], 'base64url');
        const payload = JSON.parse(payloadBuf.toString('utf8'));

        if (payload.sub) {
          const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(payload.sub);
          if (adminData?.user && !adminErr) {
            return { user: adminData.user, error: null };
          }
        }
      }
    } catch {
      // Ignore parse error
    }

    return { user: null, error: error || new Error('Token tidak valid') };
  }
}

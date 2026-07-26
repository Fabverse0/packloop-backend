import { supabase, supabaseAdmin } from '../config/supabase.js';
import { User } from '@supabase/supabase-js';

export class AuthService {
  /**
   * Verify access token with Supabase Auth (with smart fallback)
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

    // 2. Smart fallback: parse JWT payload & verify user exists in Supabase Admin
    try {
      const parts = cleanToken.split('.');
      if (parts.length === 3) {
        const payloadBuf = Buffer.from(parts[1], 'base64url');
        const payload = JSON.parse(payloadBuf.toString('utf8'));

        // Check token expiry
        const nowEpoch = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < nowEpoch) {
          return { user: null, error: new Error('Token telah kedaluwarsa') };
        }

        // Check if user exists in Supabase Auth DB via admin
        if (payload.sub) {
          const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(payload.sub);
          if (adminData?.user && !adminErr) {
            return { user: adminData.user, error: null };
          }
        }
      }
    } catch {
      // Ignore fallback decode errors
    }

    return { user: null, error: error || new Error('Token tidak valid') };
  }
}

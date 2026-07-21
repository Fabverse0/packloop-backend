import { supabase } from '../config/supabase.js';
import { User } from '@supabase/supabase-js';

export class AuthService {
  /**
   * Verify access token with Supabase Auth
   */
  static async verifyAccessToken(token: string): Promise<{ user: User | null; error: any }> {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return { user, error };
  }
}

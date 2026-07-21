import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.'
  );
}

// Standard Supabase client for anon operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin Supabase client using Service Role key for admin/backend-privileged operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey
);

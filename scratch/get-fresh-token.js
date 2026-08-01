import { supabaseAdmin } from '../dist/config/supabase.js';
import fs from 'fs';

async function generateFreshToken() {
  const email = 'mfabian.rizky@gmail.com';
  const password = 'TestPassword123!';

  const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.session) {
    console.error("Error signing in:", error);
    return;
  }

  const token = authData.session.access_token;
  fs.writeFileSync('./scratch/token.txt', token, 'utf8');
  console.log("SUCCESS! Written fresh valid uncorrupted token to ./scratch/token.txt");
  console.log("Token length:", token.length);
}

generateFreshToken();

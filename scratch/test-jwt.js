import { supabase, supabaseAdmin } from '../dist/config/supabase.js';

async function testVerificationMethods() {
  // Read token from scratch/token.txt
  const fs = await import('fs');
  const token = fs.readFileSync('./scratch/token.txt', 'utf8').trim();

  console.log("Token length:", token.length);

  // Method 1: Standard client getUser(token)
  console.log("\nMethod 1: supabase.auth.getUser(token)...");
  const res1 = await supabase.auth.getUser(token);
  console.log("Res1:", res1.error ? res1.error.message : res1.data.user.email);

  // Method 2: Create a new client per request with setSession or global headers
  console.log("\nMethod 2: createClient with Authorization header...");
  const { createClient } = await import('@supabase/supabase-js');
  const customClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  const res2 = await customClient.auth.getUser();
  console.log("Res2:", res2.error ? res2.error.message : res2.data.user.email);

  // Method 3: Smart Decode + admin.getUserById
  console.log("\nMethod 3: Admin getUserById...");
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    console.log("Payload sub:", payload.sub);
    const res3 = await supabaseAdmin.auth.admin.getUserById(payload.sub);
    console.log("Res3:", res3.error ? res3.error.message : res3.data.user.email);
  } catch (e) {
    console.error("Method 3 error:", e);
  }
}

testVerificationMethods();

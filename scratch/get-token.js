import { supabaseAdmin } from '../dist/config/supabase.js';

async function generateFreshToken() {
  const email = 'mfabian.rizky@gmail.com';
  console.log(`Generating fresh token for: ${email}...`);

  // Generate magic link / token or admin sign in for testing
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });

  if (error) {
    console.error("Error generating link:", error);
    return;
  }

  const hashedPassword = 'TestPassword123!';
  // Update user password to test password for easy local auth testing
  await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
    password: hashedPassword,
  });

  // Sign in with password to get a fresh, uncorrupted access_token
  const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password: hashedPassword,
  });

  if (signInError) {
    console.error("Sign in error:", signInError);
    return;
  }

  console.log("\n=========================================");
  console.log("FRESH VALID ACCESS TOKEN:");
  console.log("=========================================\n");
  console.log(authData.session.access_token);
  console.log("\n=========================================");
}

generateFreshToken();

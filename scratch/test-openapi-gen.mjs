// Test script: verifikasi auto-generated OpenAPI spec dari Zod schemas
import { generateOpenAPISpec } from '../dist/src/docs/openapi-registry.js';
import '../dist/src/schemas/auth.schema.js';
import '../dist/src/schemas/user.schema.js';
import '../dist/src/schemas/station.schema.js';
import '../dist/src/schemas/deposit.schema.js';
import '../dist/src/schemas/reward.schema.js';
import '../dist/src/schemas/notification.schema.js';

const spec = generateOpenAPISpec();
const paths = Object.keys(spec.paths || {});

console.log('===========================================');
console.log('  AUTO-GENERATED OPENAPI SPEC VERIFICATION');
console.log('===========================================');
console.log('✅ OpenAPI Version  :', spec.openapi);
console.log('✅ API Title        :', spec.info.title);
console.log('✅ API Version      :', spec.info.version);
console.log('✅ Total Paths      :', paths.length);
console.log('✅ Servers          :', spec.servers?.map(s => s.url).join(' | '));
console.log('');
console.log('📋 REGISTERED PATHS:');
paths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));

// Validasi jumlah path (harus 15 routes dari 6 modul)
const expectedMinPaths = 14;
if (paths.length < expectedMinPaths) {
  console.error(`\n❌ GAGAL: Hanya ${paths.length} path teregistrasi, minimal ${expectedMinPaths} path diharapkan!`);
  process.exit(1);
} else {
  console.log(`\n✅ SUKSES: ${paths.length} path berhasil ter-generate dari skema Zod!`);
}

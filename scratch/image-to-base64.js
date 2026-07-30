import fs from 'fs';
import path from 'path';

// Gunakan foto apapun dari laptop Anda (ganti path ini dengan foto tote bag / paper bag Anda)
// Contoh: 'C:/Users/Fabian/Pictures/tote_bag.jpg'
// Atau: './scratch/test-image.jpg'
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('\n❌ Usage: node scratch/image-to-base64.js <path-to-image>');
  console.error('   Example: node scratch/image-to-base64.js C:/Users/Fabian/Pictures/foto.jpg\n');
  process.exit(1);
}

const absolutePath = path.resolve(imagePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`\n❌ File tidak ditemukan: ${absolutePath}\n`);
  process.exit(1);
}

const imageBuffer = fs.readFileSync(absolutePath);
const base64String = imageBuffer.toString('base64');
const ext = path.extname(absolutePath).toLowerCase();

const mimeMap = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const mimeType = mimeMap[ext] || 'image/jpeg';

// Simpan ke file JSON siap kirim
const outputBody = JSON.stringify({ imageBase64: base64String, mimeType }, null, 2);
fs.writeFileSync('./scratch/test-scan-body.json', outputBody, 'utf8');

console.log('\n✅ Berhasil! File body JSON sudah disimpan ke: scratch/test-scan-body.json');
console.log(`   mimeType : ${mimeType}`);
console.log(`   File size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
console.log(`   Base64 length: ${base64String.length} chars`);
console.log('\n📋 Sekarang jalankan perintah berikut untuk mengirim ke backend:');
console.log('   $token = Get-Content ./scratch/token.txt -Raw');
console.log('   $body = Get-Content ./scratch/test-scan-body.json -Raw');
console.log('   Invoke-RestMethod -Uri http://localhost:5000/api/deposits/analyze -Method POST -Headers @{ Authorization = "Bearer test" } -ContentType "application/json" -Body $body | ConvertTo-Json\n');

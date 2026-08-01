import fs from 'fs';
import https from 'https';
import http from 'http';

const bodyPath = './scratch/test-scan-body.json';
const bodyData = fs.readFileSync(bodyPath, 'utf8');

console.log('📤 Mengirim request ke POST http://localhost:5000/api/deposits/analyze...');
console.log(`   Body size: ${(bodyData.length / 1024).toFixed(1)} KB`);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/deposits/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test',
    'Content-Length': Buffer.byteLength(bodyData),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`\n📥 Response Status: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(data);
      console.log('\n🎯 HASIL AI SCAN GEMINI:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
});

req.write(bodyData);
req.end();

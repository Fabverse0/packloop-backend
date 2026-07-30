import fs from 'fs';
import { AIService } from '../src/services/ai.service.js';

async function testDirect() {
  const bodyData = JSON.parse(fs.readFileSync('./scratch/test-scan-body.json', 'utf8'));
  console.log("Testing AIService.analyzePackagingImage directly via tsx...");
  console.log("mimeType:", bodyData.mimeType);
  console.log("imageBase64 length:", bodyData.imageBase64.length);

  try {
    const result = await AIService.analyzePackagingImage(bodyData.imageBase64, bodyData.mimeType);
    console.log("\n✅ SUCCESS DIRECT AI RESULT:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("\n❌ ERROR DIRECT AI CALL:", err);
  }
}

testDirect();

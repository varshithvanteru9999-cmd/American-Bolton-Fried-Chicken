const fs = require('fs');
const path = require('path');

const contentPath = 'C:\\Users\\varun\\.gemini\\antigravity\\brain\\ba3a488c-e15f-4efc-b025-fc2d3788dfdd\\.system_generated\\steps\\11\\content.md';
const content = fs.readFileSync(contentPath, 'utf-8');

// Find the hidden input with the base64 JSON config
const match = content.match(/<input type="hidden" value="([^"]+)"/);
if (match && match[1]) {
  try {
    const base64Data = match[1];
    const decodedStr = Buffer.from(base64Data, 'base64').toString('utf-8');
    const configData = JSON.parse(decodedStr);
    
    // We just want to see what is inside, let's write the whole thing temporarily
    fs.writeFileSync('extracted_config.json', JSON.stringify(configData, null, 2));
    console.log("Successfully extracted config! Found store ID:", configData.store?.id);
    
    // If the items are here, we can extract them properly
    if (configData.store && configData.store.categories) {
       console.log("Categories found:", configData.store.categories.length);
    }
  } catch (err) {
    console.error("Error parsing JSON:", err);
  }
} else {
  console.log("Could not find the hidden input with data.");
}

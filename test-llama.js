// Simple test script to check if Llama API is working
// This script uses CommonJS format to work with standard Node.js

const fs = require('fs');
const path = require('path');

// Read the API key from the llamaApi.ts file
function getApiKey() {
  try {
    const apiFilePath = path.join(__dirname, 'src', 'utils', 'llamaApi.ts');
    const content = fs.readFileSync(apiFilePath, 'utf8');
    const match = content.match(/apiKey = ["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
    return "API key not found";
  } catch (error) {
    console.error("Error reading API key:", error);
    return "Error reading API key";
  }
}

// Simple implementation to test the API directly
async function testLlamaApi() {
  console.log("Testing Llama API connection...");
  
  // Get the API key from the file
  const apiKey = getApiKey();
  console.log("Found API Key:", apiKey);
  
  // Test URL
  const url = "https://api.llama.com/v1/chat/completions";
  console.log("API URL:", url);
  
  try {
    // Create a simple test request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: [
          { role: "system", content: "You are a helpful medical assistant." },
          { role: "user", content: "Is a headache a symptom of dehydration?" }
        ]
      })
    });
    
    console.log("\n--- API Response Status ---");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log("\n--- API Response Data ---");
      console.log(JSON.stringify(data, null, 2));
      console.log("\n✓ Llama API is working properly");
    } else {
      console.log("\n--- API Error Details ---");
      const errorText = await response.text();
      console.log(errorText);
      console.log("\n✖️ Llama API is NOT working");
      console.log("The API returned an error. You may need a valid API key or check the API endpoint.");
    }
  } catch (error) {
    console.error("\nError testing Llama API:", error);
    console.log("\n✖️ Llama API test failed");
    console.log("This could indicate network issues, invalid API endpoint, or the API service is down.");
  }
  
  console.log("\n=== Test Complete ===");
  console.log("If the Llama API is not working, the application will use the mock implementation.");
  console.log("The mock implementation extracts medical data from PDFs and generates analysis locally.");
}

// Run the test
testLlamaApi(); 
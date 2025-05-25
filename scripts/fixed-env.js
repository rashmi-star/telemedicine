// Script to create a fixed .env file with proper formatting
const fs = require('fs');
const path = require('path');

// Define the properly formatted .env content
const envContent = `# .env
VITE_SUPABASE_URL=https://ajtweyoblhxoslbzykyx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHdleW9ibGh4b3NsYnp5a3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NjM0OTQsImV4cCI6MjA1NDQzOTQ5NH0.kO5vpKfkKVf7vJjDl5hqwyvHdSN_cKZ5UmHKdCj3q50
SUPABASE_URL=https://ajtweyoblhxoslbzykyx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHdleW9ibGh4b3NsYnp5a3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODg2MzQ5NCwiZXhwIjoyMDU0NDM5NDk0fQ.Veg7F0U6Kls6XafJybtJR_pVS8iNlD5du1bw4bHAuyo
BUCKET_NAME=documents`;

// Path to the .env file in both root and scripts directory
const rootEnvPath = path.join(__dirname, '..', '.env');
const scriptsEnvPath = path.join(__dirname, '.env');

// Write the content to both files
fs.writeFileSync(rootEnvPath, envContent);
fs.writeFileSync(scriptsEnvPath, envContent);

console.log('Fixed .env files created successfully at:');
console.log('- Root:', rootEnvPath);
console.log('- Scripts:', scriptsEnvPath);

// Create a simple test script to check environment variables
const testEnvScript = `
const dotenv = require('dotenv');
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
console.log('BUCKET_NAME:', process.env.BUCKET_NAME);
`;

fs.writeFileSync(path.join(__dirname, 'test-env.js'), testEnvScript);
console.log('Created test-env.js script to verify environment variables'); 
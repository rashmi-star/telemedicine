
const dotenv = require('dotenv');
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
console.log('BUCKET_NAME:', process.env.BUCKET_NAME);

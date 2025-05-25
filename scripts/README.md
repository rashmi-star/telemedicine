# Supabase Bucket Creation Script

This script safely creates a storage bucket in your Supabase project using the service_role key.

## Security Warning ⚠️

This script uses the Supabase `service_role` key which has admin privileges. **NEVER** run this script on the frontend or expose this key in client-side code. This should only be executed in a secure backend environment.

## Setup

1. Install dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. Create a `.env` file in the same directory as the script:
   ```
   # Supabase credentials
   # Replace these with your actual values from Supabase dashboard
   
   # Your Supabase project URL (from API settings)
   SUPABASE_URL=https://your-project-id.supabase.co
   
   # Your Supabase service_role key (from API settings)
   # This has admin privileges - NEVER expose this in client-side code
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-service-role-key
   
   # The name of the bucket to create
   BUCKET_NAME=my-bucket-name
   ```

3. Run the script:
   ```bash
   node createBucket.js
   ```

## How It Works

The script:
1. Connects to Supabase using the service_role key
2. Checks if the bucket already exists
3. Creates the bucket with secure settings if it doesn't exist
4. Sets up basic Row Level Security (RLS) policies
5. Logs detailed success or error messages

## Customizing Bucket Settings

You can modify the bucket configuration in the script:

```javascript
// Inside createBucket function:
const { data, error } = await supabase.storage.createBucket(bucketName, {
  public: false,  // Set to true for public access
  fileSizeLimit: 52428800, // 50MB in bytes
  allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain']
});
```

## RLS Policies

The script sets up a basic RLS policy allowing authenticated users to upload files. You can modify or add more policies as needed.

After bucket creation, you should configure additional Row Level Security (RLS) policies through the Supabase dashboard or by adding more policy creation calls in this script. 
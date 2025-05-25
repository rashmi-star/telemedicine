# MedGuide - Telemedicine & First Aid Medication Advisor

MedGuide is an AI-powered telemedicine application that helps users understand their symptoms, suggests appropriate first aid medications, and connects them with relevant healthcare specialists in their area.

## Key Features

### 1. Telemedicine First Aid
- Suggests safe over-the-counter medications based on symptoms
- Provides detailed information on dosage, safety notes, and warnings for 15+ common medications
- Adapts recommendations based on age and medical conditions
- Clear disclaimers and safety warnings for all medication suggestions

### 2. Intelligent Symptom Analysis
- Conversational interface for symptom collection
- Analysis of symptoms using AI and a comprehensive medical database
- Smart symptom detection and matching with appropriate medications
- Identification of possible conditions based on reported symptoms

### 3. Specialist Recommendations
- Matches symptoms to appropriate medical specialists
- Provides location-based healthcare facility listings
- Interactive map to explore nearby healthcare options

## How It Works

1. **Symptom Collection**: The system collects symptoms and relevant health information through a conversational interface
2. **Medication Analysis**: Analyzes symptoms against a database of safe first aid medications
3. **Personalized Recommendations**: Suggests medications based on symptom severity, age, and health conditions
4. **Specialist Matching**: Identifies which medical specialists would be appropriate for consultation
5. **Location-Based Results**: Shows nearby healthcare facilities based on user's location (optional)

## Medication Database

The application includes a comprehensive database of over-the-counter medications with detailed information:
- Specific symptoms treated
- Age-appropriate dosages (adult and child)
- Safety precautions and warnings
- Potential side effects
- Contraindications and drug interactions

## Important Medical Disclaimer

The medication recommendations provided by MedGuide are for informational purposes only and not a substitute for professional medical advice. All suggested medications are common over-the-counter options. Users should always consult with healthcare professionals before taking any medication.

## Technology Stack

- React with TypeScript
- Tailwind CSS for UI components
- LLM-powered symptom analysis
- JSON-based medication database
- Interactive mapping for healthcare facilities

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/rashmi-star/telemedicine.git
   cd telemedicine
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## License

This project is licensed under the MIT License.

## Troubleshooting

### "StorageApiError: new row violates row-level security policy"

If you encounter this error when initializing storage, it means your anon key doesn't have permission to create the storage bucket. This is a common issue due to Supabase's Row Level Security (RLS) policies.

To fix this:

1. Make sure your `.env` file has the correct service role key:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   BUCKET_NAME=documents
   ```

2. Run the bucket creation script (requires Node.js):
   ```
   cd project/scripts
   npm install @supabase/supabase-js dotenv
   node run-create-bucket.js
   ```

3. Alternatively, create the bucket manually in the Supabase dashboard:
   - Go to Storage in your Supabase dashboard
   - Click "New Bucket"
   - Name it "documents"
   - Click "Create bucket"
   - Go to the SQL Editor and run the policies from `bucket-policy.sql`

After creating the bucket, restart your application and the error should be resolved. 
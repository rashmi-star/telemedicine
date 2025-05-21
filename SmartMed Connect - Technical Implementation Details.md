# SmartMed Connect - Technical Implementation Details

This document provides detailed technical specifications and implementation notes for the SmartMed Connect application, serving as a technical appendix to the main implementation report.

## Application Architecture

### Component Structure
```
SmartMed Connect
├── App.tsx                     # Main application entry point
├── Components
│   ├── ChatInterface.tsx       # Conversational UI component
│   ├── SpecialistList.tsx      # Facility display component
│   └── HospitalDisplay.tsx     # Hospital data visualization
├── Utils
│   ├── llamaApi.ts             # Llama AI integration
│   └── csvLoader.ts            # Medical dataset loading
└── Data
    └── medical_dataset.csv     # Reference medical data
```

### Key Components Implementation

#### ChatInterface Component
- Implements a step-by-step conversation flow using React state management
- Handles user input validation for each step (age, gender, blood pressure, cholesterol)
- Uses typing indicators and timed responses for a natural conversation feel
- Processes symptoms with normalization techniques to handle variations and typos
- Coordinates API calls and data display based on conversation state

#### SpecialistList Component
- Takes pincode and specialty as inputs
- Implements geocoding for location-based searches
- Sorts healthcare facilities by distance
- Categorizes results (hospitals, clinics, specialists)
- Implements filtering based on specialties
- Provides detailed facility information display

### Data Flow

1. **User Input Collection**:
   ```
   User → ChatInterface → State Management → Validation → Next Step Prompt
   ```

2. **Symptom Analysis**:
   ```
   User Symptoms → Medical Dataset Matching → Llama API Request → 
   Response Parsing → Structured Insights
   ```

3. **Facility Matching**:
   ```
   User Pincode → Geocoding → Facility Database Query → 
   Distance Calculation → Specialty Filtering → Sorted Display
   ```

## AI Integration Details

### Llama API Implementation
- API Endpoint: `https://api.llama.com/v1/chat/completions`
- Model: `Llama-4-Maverick-17B-128E-Instruct-FP8`
- System Message: Instructs the model to focus on medical advice and handle typos
- Request Formatting: Structured JSON for consistent responses
- Response Handling: Multiple fallback mechanisms for parsing responses

### Prompt Engineering
Example prompt structure:
```
{csvContext}

The user reports: {symptoms}.
Additional user details:
- Duration: {duration}
- Severity: {severity}
- Age: {age}
- Gender: {gender}
- Blood Pressure: {bloodPressure}
- Cholesterol Level: {cholesterolLevel}

Based on the dataset and your medical knowledge, analyze the symptoms and provide:
1. A brief summary of the possible condition and initial advice
2. Likely conditions that match these symptoms (list 2-3 possibilities)
3. Types of medical specialists that would be appropriate to consult
4. Whether the patient should be concerned about their age, gender, blood pressure, 
   or cholesterol in relation to these symptoms

Answer in this JSON format: {
  "insights": "<summary and advice for the patient>",
  "conditions": [<list of likely conditions>],
  "specialists": [<list of recommended specialists>],
  "healthFactors": "<explanation of health factors>"
}
```

## Location Services Implementation

### Pincode Resolution
- Uses a local database of common pincodes/ZIP codes for immediate resolution
- Implements format-based fallback for unknown codes:
  - 5-digit codes treated as US ZIP codes
  - 6-digit codes treated as Indian pincodes
- Default coordinates provided for unresolved locations

### Healthcare Facility Data
- Combination of predefined data for popular locations
- Dynamic generation for locations without predefined data:
  - Distance-based random distribution
  - Realistic naming conventions based on location
  - Specialty assignment according to facility type
  - Contact information generation following regional formats

## Data Processing

### Medical Dataset Processing
- CSV format with PapaParse for client-side processing
- Schema includes:
  - Symptoms (Fever, Cough, Fatigue, etc.)
  - Patient demographics (Age, Gender)
  - Health factors (Blood Pressure, Cholesterol)
  - Condition information
  - Specialist recommendations

### Symptom Matching Logic
```typescript
// Example of symptom normalization function
const normalizeSymptoms = (text: string): Record<string, boolean> => {
  const normalized: Record<string, boolean> = {};
  
  // Common symptoms and their variations (including typos)
  const symptomMappings: Record<string, string[]> = {
    'fever': ['fever', 'fver', 'temperature', 'hot', 'feverish'],
    'cough': ['cough', 'coughing', 'caugh', 'coff'],
    'fatigue': ['fatigue', 'tired', 'exhausted', 'fatigued'],
    'breath': ['breath', 'breathing', 'short of breath', 'breathlessness'],
    'headache': ['headache', 'head ache', 'head pain', 'headpain'],
    'throat': ['throat', 'sore throat', 'throatpain', 'troat']
  };
  
  // Check for each symptom in the text
  const lowerText = text.toLowerCase();
  for (const [symptom, variations] of Object.entries(symptomMappings)) {
    if (variations.some(v => lowerText.includes(v))) {
      normalized[symptom] = true;
    } else {
      normalized[symptom] = false;
    }
  }
  
  return normalized;
};
```

## Performance Considerations

### Optimization Techniques
1. **Client-Side Processing**: Medical dataset processed locally to reduce API calls
2. **Response Caching**: Common responses stored for quick retrieval
3. **Progressive Loading**: UI elements loaded sequentially for perceived performance
4. **Error Recovery**: Multiple fallback mechanisms to handle API failures

### Security Measures
1. **API Key Handling**: Secured API key management (would be server-side in production)
2. **Input Validation**: User inputs validated before processing
3. **Error Handling**: Secure error messages that don't expose system details

## Testing Methodology

### Test Cases
1. **Symptom Analysis**: Various symptom combinations tested for consistent recommendations
2. **Location Resolution**: Multiple pincodes/ZIP codes from different regions verified
3. **Facility Matching**: Specialty filtering tested with different specialist recommendations
4. **Edge Cases**: Tested system response to invalid inputs, network failures, and API errors

## Deployment Considerations

### Requirements
- Node.js environment
- Internet connection for Llama API access
- Browser with JavaScript enabled
- CORS handling for API requests

### Performance Requirements
- Minimum 2MB bandwidth for API requests
- Browser with ES6 support
- Client device capable of handling React applications

This technical appendix provides implementation details that supplement the main SmartMed Connect implementation report. 
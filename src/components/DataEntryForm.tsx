import React, { useState, useEffect } from 'react';
import { SpecialistList } from './SpecialistList';
import { getLlamaCompletion } from '../utils/llamaApi';
import { loadMedicalDataset } from '../utils/csvLoader';

interface SymptomData {
  description: string;
  duration: string;
  severity: string;
  location: string;
}

function filterRelevantRows(dataset: any[], symptoms: SymptomData) {
  // Simple filter: match rows where Fever, Cough, Fatigue, or Difficulty Breathing match user input
  return dataset.filter(row => {
    let match = true;
    if (symptoms.description.toLowerCase().includes('fever') && row['Fever'] === 'Yes') match = match && true;
    if (symptoms.description.toLowerCase().includes('cough') && row['Cough'] === 'Yes') match = match && true;
    if (symptoms.description.toLowerCase().includes('fatigue') && row['Fatigue'] === 'Yes') match = match && true;
    if (symptoms.description.toLowerCase().includes('breath') && row['Difficulty Breathing'] === 'Yes') match = match && true;
    return match;
  });
}

// Helper function to validate pincodes
const validatePincode = (pincode: string): { valid: boolean, country?: string, message?: string } => {
  const cleanPincode = pincode.trim();
  
  if (!cleanPincode) {
    return { valid: false, message: "Please enter a pincode/ZIP code" };
  }
  
  // US ZIP codes: 5 digits, optionally followed by a dash and 4 more digits
  if (/^\d{5}(-\d{4})?$/.test(cleanPincode)) {
    return { valid: true, country: "USA", message: "Valid US ZIP code" };
  }
  
  // Indian PIN codes: 6 digits
  if (/^\d{6}$/.test(cleanPincode)) {
    return { valid: true, country: "India", message: "Valid Indian PIN code" };
  }
  
  // UK postcodes: 1-2 letters, 1-2 digits, space, 1 digit, 2 letters
  if (/^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i.test(cleanPincode)) {
    return { valid: true, country: "UK", message: "Valid UK postcode" };
  }
  
  // Canadian postcodes: Letter, digit, letter, space/dash, digit, letter, digit
  if (/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(cleanPincode)) {
    return { valid: true, country: "Canada", message: "Valid Canadian postcode" };
  }
  
  // Australian postcodes: 4 digits
  if (/^\d{4}$/.test(cleanPincode)) {
    return { valid: true, country: "Australia", message: "Valid Australian postcode" };
  }
  
  // Other formats or unknown
  return { valid: false, message: "Unknown pincode format. Try a standard format like 12345 (US) or 123456 (India)" };
};

export const DataEntryForm: React.FC = () => {
  const [symptoms, setSymptoms] = useState<SymptomData>({
    description: '',
    duration: '',
    severity: '',
    location: ''
  });
  const [insights, setInsights] = useState<string>('');
  const [predictedConditions, setPredictedConditions] = useState<string>('');
  const [recommendedSpecialists, setRecommendedSpecialists] = useState<string>('');
  const [specialistsList, setSpecialistsList] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [pincodeValidation, setPincodeValidation] = useState<{ valid: boolean, country?: string, message?: string }>({ valid: true });

  // Validate pincode when it changes
  useEffect(() => {
    if (symptoms.location) {
      const validation = validatePincode(symptoms.location);
      setPincodeValidation(validation);
    } else {
      setPincodeValidation({ valid: true });
    }
  }, [symptoms.location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate pincode before proceeding
    const validation = validatePincode(symptoms.location);
    setPincodeValidation(validation);
    
    if (!validation.valid) {
      setError(`Invalid location format: ${validation.message}`);
      return;
    }
    
    setLoading(true);
    setError('');
    setInsights('');
    setPredictedConditions('');
    setRecommendedSpecialists('');
    setSpecialistsList([]);
    setSelectedSpecialty('');
    setCsvRows([]);
    
    try {
      // 1. Load and filter the dataset
      const dataset = await loadMedicalDataset();
      const relevantRows = filterRelevantRows(dataset, symptoms).slice(0, 10); // Limit to 10 rows for prompt size
      setCsvRows(relevantRows);
      const csvContext = relevantRows.length > 0
        ? `Here are some relevant medical records:\n${JSON.stringify(relevantRows, null, 2)}`
        : 'No relevant records found in the dataset.';
      // 2. Build the prompt
      const prompt = `${csvContext}\n\nThe user reports: ${symptoms.description}. Duration: ${symptoms.duration}. Severity: ${symptoms.severity}.\nBased on the dataset and your medical knowledge, answer in this JSON format: {\n  \"insights\": \"<summary and advice for the patient>\",\n  \"conditions\": [<list of likely conditions>],\n  \"specialists\": [<list of recommended specialists>]\n}`;
      // 3. Call Llama
      const llamaResponse = await getLlamaCompletion(prompt);
      let parsed;
      try {
        parsed = JSON.parse(llamaResponse);
      } catch {
        parsed = null;
      }
      if (parsed && parsed.insights && parsed.conditions && parsed.specialists) {
        setInsights(parsed.insights);
        setPredictedConditions(parsed.conditions.join(', '));
        
        // Store the array of specialists
        const specialists = parsed.specialists;
        setSpecialistsList(specialists);
        setRecommendedSpecialists(specialists.join(', '));
        
        // If specialists are recommended, select the first one by default
        if (specialists.length > 0) {
          setSelectedSpecialty(specialists[0]);
        }
      } else {
        setInsights(llamaResponse); // fallback: show raw response
      }
      setShowMap(true);
    } catch (e) {
      setError('Sorry, there was an error contacting the AI service.');
    }
    setLoading(false);
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(e.target.value);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Describe your symptoms
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={symptoms.description}
            onChange={(e) => setSymptoms({...symptoms, description: e.target.value})}
            placeholder="Describe your symptoms in detail..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={symptoms.duration}
              onChange={(e) => setSymptoms({...symptoms, duration: e.target.value})}
              placeholder="How long have you had these symptoms?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Severity
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={symptoms.severity}
              onChange={(e) => setSymptoms({...symptoms, severity: e.target.value})}
            >
              <option value="">Select severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md shadow-sm ${
              symptoms.location && !pincodeValidation.valid 
                ? 'border-red-300' 
                : symptoms.location && pincodeValidation.valid 
                  ? 'border-green-300' 
                  : 'border-gray-300'
            }`}
            value={symptoms.location}
            onChange={(e) => setSymptoms({...symptoms, location: e.target.value})}
            placeholder="Enter your pincode or ZIP code"
          />
          {symptoms.location && (
            <p className={`mt-1 text-sm ${
              pincodeValidation.valid ? 'text-green-600' : 'text-red-600'
            }`}>
              {pincodeValidation.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Examples: 10001 (US), 110001 (India), EC1A 1BB (UK), M5V 2H1 (Canada), 2000 (Australia)
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          disabled={loading || (!!symptoms.location && !pincodeValidation.valid)}
        >
          {loading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-red-600">{error}</div>
      )}

      {insights && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Pre-Consultation Insights (GenAI)</h3>
          <p className="mt-2 text-gray-600 whitespace-pre-line">{insights}</p>
        </div>
      )}

      {predictedConditions && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Likely Conditions (GenAI)</h3>
          <p className="mt-2 text-gray-600 whitespace-pre-line">{predictedConditions}</p>
        </div>
      )}

      {recommendedSpecialists && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Recommended Specialists (GenAI)</h3>
          <p className="mt-2 text-gray-600 whitespace-pre-line">{recommendedSpecialists}</p>
        </div>
      )}

      {csvRows.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-md font-medium text-gray-800">Relevant Dataset Rows Used</h3>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(csvRows, null, 2)}</pre>
        </div>
      )}

      {showMap && symptoms.location && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Nearby Healthcare Facilities</h3>
          
          {specialistsList.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Find specialist:
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm"
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
              >
                <option value="">All specialists</option>
                {specialistsList.map((specialist, index) => (
                  <option key={index} value={specialist}>
                    {specialist}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <SpecialistList 
            pincode={symptoms.location} 
            requiredSpecialty={selectedSpecialty} 
          />
        </div>
      )}
    </div>
  );
};
import { useState, useEffect } from 'react';

// Direct fetch test to check if the file is accessible
fetch('/medication_dataset.json')
  .then(response => {
    console.log("✅ Direct test - medication_dataset.json is accessible:", response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log(`✅ Direct test - Successfully parsed medication_dataset.json, found ${data.medications?.length || 0} medications`);
  })
  .catch(error => {
    console.error("❌ Direct test - Error accessing medication_dataset.json:", error);
  });

export interface Medication {
  id: string;
  name: string;
  category: string;
  dosageAdult: string;
  dosageChild: string;
  safetyNotes: string;
  warnings: string;
  sideEffects: string;
  contraindications: string;
  symptoms: string[];
}

export interface MedicationData {
  medications: Medication[];
  symptomGroups: Record<string, string[]>;
  disclaimer: string;
}

// Custom hook to load medication data
export function useMedicationData() {
  const [medicationData, setMedicationData] = useState<MedicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMedicationData = async () => {
      console.log("🔍 Starting to load medication data...");
      try {
        setLoading(true);
        console.log("🔍 Fetching from /medication_dataset.json");
        const response = await fetch('/medication_dataset.json');
        
        if (!response.ok) {
          console.error("❌ Failed to fetch medication data:", response.status, response.statusText);
          throw new Error(`Failed to fetch medication data: ${response.status} ${response.statusText}`);
        }
        
        console.log("✅ Medication data fetched successfully, parsing JSON...");
        const data = await response.json();
        console.log(`✅ Medication data parsed successfully! Found ${data.medications?.length || 0} medications`);
        setMedicationData(data);
      } catch (err) {
        console.error('❌ Error loading medication data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load medication data');
      } finally {
        setLoading(false);
      }
    };

    loadMedicationData();
  }, []);

  return { medicationData, loading, error };
}

// Function to find medications for given symptoms
export function findMedicationsForSymptoms(
  medicationData: MedicationData | null,
  symptoms: string
): Medication[] {
  if (!medicationData) {
    console.log("❌ No medication data available when searching for symptoms");
    return [];
  }
  
  console.log(`🔍 Finding medications for symptoms: "${symptoms}"`);
  
  // Normalize the symptoms text
  const normalizedSymptoms = symptoms.toLowerCase();
  
  // Create an array of all symptom keywords from medication data
  const allSymptomKeywords = medicationData.medications.flatMap(med => med.symptoms);
  
  // Find matching symptoms in the input text
  const matchingSymptoms = allSymptomKeywords.filter(symptom => 
    normalizedSymptoms.includes(symptom)
  );
  
  // Debug all possible symptom keywords to see what might match
  console.log("🔍 All available symptom keywords:", [...new Set(allSymptomKeywords)].sort());
  
  console.log(`✅ Found ${matchingSymptoms.length} matching symptoms: ${matchingSymptoms.join(', ')}`);
  
  // Return medications that match ANY of the symptoms
  const matchedMeds = medicationData.medications.filter(medication =>
    medication.symptoms.some(symptom => matchingSymptoms.includes(symptom))
  );
  
  console.log(`✅ Found ${matchedMeds.length} matching medications`);
  return matchedMeds;
}

// Function to get medication recommendations based on symptoms
export function getMedicationRecommendations(
  symptomsOrData: string | MedicationData | null,
  medicationsOrAge?: string,
  options?: {
    age?: number;
    hasRespiratoryCondition?: boolean;
  } | string,
  conditions?: string[]
): { 
  medications: Medication[], 
  warnings: string[] 
} {
  console.log(`🔍 Getting medication recommendations`);
  
  // Check if we're using the new parameter format
  if (typeof symptomsOrData === 'string') {
    // In this case:
    // symptomsOrData = symptoms string
    // medicationsOrAge = medications string
    // options = { age, hasRespiratoryCondition }
    
    const symptoms = symptomsOrData;
    const medications = medicationsOrAge || '';
    
    // Parse options
    let age: number | undefined;
    let hasRespiratoryCondition = false;
    
    if (options && typeof options === 'object') {
      age = options.age;
      hasRespiratoryCondition = options.hasRespiratoryCondition || false;
    }
    
    console.log(`🔍 Symptoms: "${symptoms}", Medications: "${medications}", Age: ${age || 'not provided'}`);
    
    // Create synthetic medication data for the specified medications
    const syntheticMedications: Medication[] = medications.split(',').map((med, index) => {
      const medName = med.trim();
      if (!medName) return null;
      
      return {
        id: `synth${index}`,
        name: medName,
        category: 'Recommended medication',
        dosageAdult: 'Consult healthcare provider for proper dosage',
        dosageChild: 'Not recommended for children without medical supervision',
        safetyNotes: 'Use as directed by healthcare provider',
        warnings: hasRespiratoryCondition ? 
          'May need special consideration due to respiratory conditions' : 
          'Use as directed by healthcare provider',
        sideEffects: 'Various side effects may occur, consult healthcare provider',
        contraindications: 'Various contraindications may apply, consult healthcare provider',
        symptoms: symptoms.toLowerCase().split(/\s+/) // Split by whitespace to create symptom keywords
      };
    }).filter(Boolean) as Medication[];
    
    // Generate warnings
    const warnings: string[] = [];
    
    if (age && age < 6) {
      warnings.push("Many medications are not recommended for children under 6 without medical supervision.");
    } else if (age && age < 12) {
      warnings.push("Some medications may require special dosing for children under 12. Always check with a healthcare provider.");
    } else if (age && age > 65) {
      warnings.push("Older adults may be more sensitive to medication side effects. Consider starting with lower doses.");
    }
    
    if (hasRespiratoryCondition) {
      warnings.push("Due to your respiratory symptoms and current air quality, use extra caution with medications that may affect breathing.");
    }
    
    return {
      medications: syntheticMedications,
      warnings
    };
  } else {
    // Original functionality where first parameter is MedicationData
    const medicationData = symptomsOrData;
    const symptoms = medicationsOrAge || '';
    let age: string | undefined;
    
    // Handle the third parameter which could be age or options
    if (typeof options === 'string') {
      age = options;
    }
    
    console.log(`🔍 Getting medication recommendations for: "${symptoms}", age: ${age || 'not provided'}`);
    
    if (!medicationData) {
      console.log("❌ No medication data available for recommendations");
      return { medications: [], warnings: [] };
    }

    // Find relevant medications
    const matchedMedications = findMedicationsForSymptoms(medicationData, symptoms);
    
    // Additional warnings based on patient factors
    const warnings: string[] = [];
    
    // Age-related warnings
    if (age) {
      const numericAge = parseInt(age, 10);
      if (!isNaN(numericAge)) {
        if (numericAge < 6) {
          warnings.push("Many over-the-counter medications are not recommended for children under 6 without medical supervision.");
        } else if (numericAge < 12) {
          warnings.push("Some medications may require special dosing for children under 12. Always check with a healthcare provider.");
        } else if (numericAge > 65) {
          warnings.push("Older adults may be more sensitive to medication side effects. Consider starting with lower doses.");
        }
      }
    }
    
    // Filter out medications that might be contraindicated based on conditions
    let filteredMedications = matchedMedications;
    
    if (conditions && conditions.length > 0) {
      console.log(`🔍 Checking contraindications against conditions: ${conditions.join(', ')}`);
      // Look for contraindications in existing conditions
      const lowercaseConditions = conditions.map(c => c.toLowerCase());
      
      // Warning for potential contraindications
      warnings.push("Some medications may not be suitable due to your medical conditions. Always consult with a healthcare provider.");
      
      // Filter medications with potential contraindications
      filteredMedications = matchedMedications.filter(med => {
        const contraindications = med.contraindications.toLowerCase();
        // If any condition appears in contraindications, exclude the medication
        return !lowercaseConditions.some(condition => 
          contraindications.includes(condition) ||
          // Common terms that might indicate a problem
          (condition.includes("liver") && contraindications.includes("liver")) ||
          (condition.includes("kidney") && contraindications.includes("kidney")) ||
          (condition.includes("heart") && contraindications.includes("heart"))
        );
      });
    }
    
    console.log(`✅ Final recommendation: ${filteredMedications.length} medications with ${warnings.length} warnings`);
    
    return { 
      medications: filteredMedications,
      warnings 
    };
  }
} 
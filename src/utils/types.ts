export interface Disease {
  name: string;
  symptoms: string[];
  specialty: string;
  age: number;
  gender: string;
  outcome: string;
}

export interface PredictionResult {
  specialty: string;
  confidence: number;
  possibleDiseases: Array<{
    name: string;
    probability: number;
  }>;
}

export interface MedicalDataRecord {
  id: string;
  disease: string;
  fever: 'Yes' | 'No';
  cough: 'Yes' | 'No';
  fatigue: 'Yes' | 'No';
  difficulty_breathing: 'Yes' | 'No';
  age: number;
  gender: 'Male' | 'Female';
  blood_pressure: 'Low' | 'Normal' | 'High';
  cholesterol_level: 'Low' | 'Normal' | 'High';
  outcome_variable: 'Positive' | 'Negative';
  specialty?: string;
  created_at?: string;
}
// This is a simplified version of ICD-10 symptom to specialty mapping
export interface SymptomMapping {
  symptoms: string[];
  specialty: string;
  description: string;
}

export const medicalDataset: SymptomMapping[] = [
  {
    symptoms: ['headache', 'migraine', 'dizziness', 'confusion', 'memory loss'],
    specialty: 'Neurologist',
    description: 'Symptoms related to the nervous system and brain function'
  },
  {
    symptoms: ['chest pain', 'shortness of breath', 'heart palpitations', 'high blood pressure'],
    specialty: 'Cardiologist',
    description: 'Symptoms related to heart and cardiovascular system'
  },
  {
    symptoms: ['joint pain', 'back pain', 'muscle weakness', 'stiffness'],
    specialty: 'Orthopedist',
    description: 'Symptoms related to bones, joints, and muscles'
  },
  {
    symptoms: ['anxiety', 'depression', 'mood swings', 'insomnia'],
    specialty: 'Psychiatrist',
    description: 'Symptoms related to mental health and behavior'
  }
];
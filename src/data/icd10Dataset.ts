// Comprehensive ICD-10 dataset (subset for demonstration)
export interface ICD10Entry {
  code: string;
  description: string;
  symptoms: string[];
  specialty: string;
  category: string;
}

export const icd10Dataset: ICD10Entry[] = [
  {
    code: 'G43',
    description: 'Migraine',
    symptoms: ['headache', 'nausea', 'sensitivity to light', 'visual aura', 'vomiting'],
    specialty: 'Neurologist',
    category: 'Nervous System'
  },
  {
    code: 'I20',
    description: 'Angina Pectoris',
    symptoms: ['chest pain', 'shortness of breath', 'nausea', 'sweating', 'anxiety'],
    specialty: 'Cardiologist',
    category: 'Circulatory System'
  },
  // ... many more entries
];
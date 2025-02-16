import { Disease } from './types';

export class DataProcessor {
  static processCSVData(csvData: string): Disease[] {
    const lines = csvData.split('\n');
    const header = lines[0].split(',');
    const diseases: Disease[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== header.length) continue;

      const symptoms: string[] = [];
      if (values[1].trim() === 'Yes') symptoms.push('fever');
      if (values[2].trim() === 'Yes') symptoms.push('cough');
      if (values[3].trim() === 'Yes') symptoms.push('fatigue');
      if (values[4].trim() === 'Yes') symptoms.push('difficulty breathing');
      
      // Add blood pressure as symptom if abnormal
      if (values[7].trim().toLowerCase() === 'high') {
        symptoms.push('high blood pressure');
      } else if (values[7].trim().toLowerCase() === 'low') {
        symptoms.push('low blood pressure');
      }

      // Add cholesterol as symptom if abnormal
      if (values[8].trim().toLowerCase() === 'high') {
        symptoms.push('high cholesterol');
      } else if (values[8].trim().toLowerCase() === 'low') {
        symptoms.push('low cholesterol');
      }

      diseases.push({
        name: values[0].trim(),
        symptoms,
        specialty: DataProcessor.getSpecialtyForDisease(values[0].trim()),
        age: parseInt(values[5].trim(), 10),
        gender: values[6].trim(),
        outcome: values[9].trim()
      });
    }

    return diseases;
  }

  private static getSpecialtyForDisease(disease: string): string {
    const lowerDisease = disease.toLowerCase();
    
    // Respiratory conditions
    if (lowerDisease.includes('asthma') || 
        lowerDisease.includes('bronchitis') || 
        lowerDisease.includes('pneumonia') ||
        lowerDisease.includes('copd') ||
        lowerDisease.includes('tuberculosis')) {
      return 'Pulmonologist';
    }
    
    // Heart conditions
    if (lowerDisease.includes('heart') || 
        lowerDisease.includes('hypertension') ||
        lowerDisease.includes('coronary')) {
      return 'Cardiologist';
    }
    
    // Neurological conditions
    if (lowerDisease.includes('alzheimer') || 
        lowerDisease.includes('parkinson') ||
        lowerDisease.includes('stroke') ||
        lowerDisease.includes('migraine') ||
        lowerDisease.includes('epilepsy')) {
      return 'Neurologist';
    }
    
    // Cancer
    if (lowerDisease.includes('cancer') ||
        lowerDisease.includes('tumor') ||
        lowerDisease.includes('lymphoma')) {
      return 'Oncologist';
    }
    
    // Endocrine disorders
    if (lowerDisease.includes('diabetes') || 
        lowerDisease.includes('thyroid') ||
        lowerDisease.includes('hormonal')) {
      return 'Endocrinologist';
    }
    
    // Mental health
    if (lowerDisease.includes('depression') || 
        lowerDisease.includes('anxiety') ||
        lowerDisease.includes('bipolar') ||
        lowerDisease.includes('schizophrenia')) {
      return 'Psychiatrist';
    }
    
    // Infectious diseases
    if (lowerDisease.includes('influenza') || 
        lowerDisease.includes('hiv') ||
        lowerDisease.includes('covid') ||
        lowerDisease.includes('hepatitis')) {
      return 'Infectious Disease Specialist';
    }

    return 'General Practitioner';
  }
}
import { supabase } from './supabase';

export const seedDatabase = async () => {
  try {
    // Seed symptom patterns
    const { error: symptomPatternsError } = await supabase
      .from('symptom_patterns')
      .insert([
        {
          symptom: 'headache',
          keywords: ['head', 'headache', 'migraine', 'pain', 'throbbing']
        },
        {
          symptom: 'fever',
          keywords: ['fever', 'temperature', 'hot', 'sweating', 'chills']
        },
        {
          symptom: 'cough',
          keywords: ['cough', 'coughing', 'chest', 'throat', 'dry']
        }
      ]);
    if (symptomPatternsError) throw symptomPatternsError;

    // Seed related symptoms
    const { error: relatedSymptomsError } = await supabase
      .from('related_symptoms')
      .insert([
        {
          primary_symptom: 'headache',
          related_symptom: 'nausea'
        },
        {
          primary_symptom: 'fever',
          related_symptom: 'fatigue'
        },
        {
          primary_symptom: 'cough',
          related_symptom: 'chest pain'
        }
      ]);
    if (relatedSymptomsError) throw relatedSymptomsError;

    // Seed condition symptoms
    const { error: conditionSymptomsError } = await supabase
      .from('condition_symptoms')
      .insert([
        {
          condition: 'migraine',
          symptoms: ['headache', 'nausea', 'sensitivity to light']
        },
        {
          condition: 'flu',
          symptoms: ['fever', 'cough', 'fatigue', 'body aches']
        },
        {
          condition: 'bronchitis',
          symptoms: ['cough', 'chest pain', 'fatigue', 'shortness of breath']
        }
      ]);
    if (conditionSymptomsError) throw conditionSymptomsError;

    // Seed medical conditions
    const { error: medicalConditionsError } = await supabase
      .from('medical_conditions')
      .insert([
        {
          name: 'migraine',
          description: 'A neurological condition characterized by severe, recurring headaches',
          specialties: ['neurologist', 'headache specialist']
        },
        {
          name: 'flu',
          description: 'A viral infection that attacks your respiratory system',
          specialties: ['general practitioner', 'infectious disease specialist']
        },
        {
          name: 'bronchitis',
          description: 'Inflammation of the lining of the bronchial tubes',
          specialties: ['pulmonologist', 'general practitioner']
        }
      ]);
    if (medicalConditionsError) throw medicalConditionsError;

    // Seed specialty mappings
    const { error: specialtyMappingsError } = await supabase
      .from('specialty_mappings')
      .insert([
        {
          specialty: 'neurologist',
          related_symptoms: ['headache', 'dizziness', 'numbness', 'seizures'],
          common_conditions: ['migraine', 'epilepsy', 'multiple sclerosis']
        },
        {
          specialty: 'pulmonologist',
          related_symptoms: ['cough', 'shortness of breath', 'chest pain', 'wheezing'],
          common_conditions: ['bronchitis', 'asthma', 'pneumonia']
        },
        {
          specialty: 'general practitioner',
          related_symptoms: ['fever', 'fatigue', 'body aches', 'cough'],
          common_conditions: ['flu', 'common cold', 'bronchitis']
        }
      ]);
    if (specialtyMappingsError) throw specialtyMappingsError;

    // Seed medical specialties
    const { error: medicalSpecialtiesError } = await supabase
      .from('medical_specialties')
      .insert([
        {
          name: 'neurologist',
          description: 'Specializes in disorders of the nervous system',
          common_conditions: ['migraine', 'epilepsy', 'multiple sclerosis']
        },
        {
          name: 'pulmonologist',
          description: 'Specializes in respiratory system disorders',
          common_conditions: ['bronchitis', 'asthma', 'pneumonia']
        },
        {
          name: 'general practitioner',
          description: 'Primary care physician for general health concerns',
          common_conditions: ['flu', 'common cold', 'bronchitis']
        }
      ]);
    if (medicalSpecialtiesError) throw medicalSpecialtiesError;

    // Seed healthcare facilities
    const { error: healthcareFacilitiesError } = await supabase
      .from('healthcare_facilities')
      .insert([
        {
          name: 'City General Hospital',
          type: 'hospital',
          specialty: ['neurologist', 'pulmonologist', 'general practitioner'],
          location: { lat: 40.7128, lng: -74.0060 },
          address: '123 Medical Center Drive',
          contact: '555-0123',
          pincode: '10001'
        },
        {
          name: 'Downtown Clinic',
          type: 'clinic',
          specialty: ['general practitioner', 'pulmonologist'],
          location: { lat: 40.7148, lng: -74.0070 },
          address: '456 Health Street',
          contact: '555-0124',
          pincode: '10002'
        },
        {
          name: 'Specialty Medical Center',
          type: 'hospital',
          specialty: ['neurologist', 'pulmonologist'],
          location: { lat: 40.7138, lng: -74.0080 },
          address: '789 Care Avenue',
          contact: '555-0125',
          pincode: '10003'
        }
      ]);
    if (healthcareFacilitiesError) throw healthcareFacilitiesError;

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}; 
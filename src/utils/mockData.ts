export const mockSymptoms = [
  'headache',
  'fever',
  'cough',
  'fatigue',
  'nausea',
  'chest pain',
  'shortness of breath'
];

export const mockConditions = [
  {
    condition: 'migraine',
    confidence: 0.85,
    recommendedSpecialties: ['neurologist', 'headache specialist'],
    urgency: 'medium'
  },
  {
    condition: 'flu',
    confidence: 0.75,
    recommendedSpecialties: ['general practitioner', 'infectious disease specialist'],
    urgency: 'low'
  },
  {
    condition: 'bronchitis',
    confidence: 0.65,
    recommendedSpecialties: ['pulmonologist', 'general practitioner'],
    urgency: 'medium'
  }
];

export const mockHealthcareFacilities = [
  {
    id: '1',
    name: 'City General Hospital',
    type: 'hospital' as const,
    specialty: ['neurologist', 'pulmonologist', 'general practitioner'],
    location: { lat: 40.7128, lng: -74.0060 },
    address: '123 Medical Center Drive',
    contact: '555-0123',
    pincode: '10001'
  },
  {
    id: '2',
    name: 'Downtown Clinic',
    type: 'clinic' as const,
    specialty: ['general practitioner', 'pulmonologist'],
    location: { lat: 40.7148, lng: -74.0070 },
    address: '456 Health Street',
    contact: '555-0124',
    pincode: '10001'
  },
  {
    id: '3',
    name: 'Specialty Medical Center',
    type: 'hospital' as const,
    specialty: ['neurologist', 'pulmonologist'],
    location: { lat: 40.7138, lng: -74.0080 },
    address: '789 Care Avenue',
    contact: '555-0125',
    pincode: '10001'
  },
  {
    id: '4',
    name: 'Northside Hospital',
    type: 'hospital' as const,
    specialty: ['neurologist', 'general practitioner'],
    location: { lat: 40.7158, lng: -74.0090 },
    address: '321 North Road',
    contact: '555-0126',
    pincode: '10002'
  },
  {
    id: '5',
    name: 'Community Health Clinic',
    type: 'clinic' as const,
    specialty: ['general practitioner'],
    location: { lat: 40.7168, lng: -74.0100 },
    address: '654 Community Lane',
    contact: '555-0127',
    pincode: '10002'
  },
  {
    id: '6',
    name: 'Eastside Medical Center',
    type: 'hospital' as const,
    specialty: ['neurologist', 'pulmonologist', 'general practitioner'],
    location: { lat: 40.7178, lng: -74.0110 },
    address: '987 East Street',
    contact: '555-0128',
    pincode: '10003'
  }
]; 
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

// Mock data for the MedGuide application

export interface MockDocument {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  document_type: string;
  document_path: string;
  public_url: string;
  description?: string;
  tags?: string[];
  category?: string;
}

// Document categories/folders
export const documentCategories = [
  {
    id: 'cat-001',
    name: 'Blood Tests',
    icon: 'droplet',
    count: 3
  },
  {
    id: 'cat-002',
    name: 'MRI Scans',
    icon: 'scan',
    count: 0
  },
  {
    id: 'cat-003',
    name: 'X-Rays',
    icon: 'x-square',
    count: 0
  },
  {
    id: 'cat-004',
    name: 'Prescriptions',
    icon: 'file-text',
    count: 0
  },
  {
    id: 'cat-005',
    name: 'Vaccination Records',
    icon: 'shield',
    count: 1
  },
  {
    id: 'cat-006',
    name: 'Medical Reports',
    icon: 'clipboard',
    count: 1
  }
];

// Mock medical documents for Rashmi Elavazhagan
export const mockMedicalDocuments: MockDocument[] = [
  {
    id: "doc-001",
    file_name: "CBC_Results_Oct2024.pdf",
    file_size: 1245000,
    file_type: "application/pdf",
    upload_date: "2024-10-07T11:45:29.000Z",
    document_type: "lab_result",
    document_path: "documents/blood_tests/CBC_Results_Oct2024.pdf",
    public_url: "#",
    description: "Complete Blood Count results from Stanford Health Center",
    tags: ["lab", "blood test", "routine"],
    category: "Blood Tests"
  },
  {
    id: "doc-002",
    file_name: "Liver_Function_Test_Oct2024.pdf",
    file_size: 987000,
    file_type: "application/pdf",
    upload_date: "2024-10-07T11:46:12.000Z",
    document_type: "lab_result",
    document_path: "documents/blood_tests/Liver_Function_Test_Oct2024.pdf",
    public_url: "#",
    description: "Hepatic Function Panel results",
    tags: ["lab", "liver", "routine"],
    category: "Blood Tests"
  },
  {
    id: "doc-003",
    file_name: "Annual_Physical_Summary_2024.pdf",
    file_size: 2345000,
    file_type: "application/pdf",
    upload_date: "2024-10-07T12:15:00.000Z",
    document_type: "medical_report",
    document_path: "documents/reports/Annual_Physical_Summary_2024.pdf",
    public_url: "#",
    description: "Annual physical examination summary",
    tags: ["physical", "annual", "checkup"],
    category: "Medical Reports"
  },
  {
    id: "doc-004",
    file_name: "Vaccination_Record_2024.pdf",
    file_size: 756000,
    file_type: "application/pdf",
    upload_date: "2024-09-15T09:30:00.000Z",
    document_type: "vaccination_record",
    document_path: "documents/vaccinations/Vaccination_Record_2024.pdf",
    public_url: "#",
    description: "Updated vaccination record including flu shot",
    tags: ["vaccination", "immunization", "preventive"],
    category: "Vaccination Records"
  },
  {
    id: "doc-005",
    file_name: "Thyroid_Function_Test_Aug2024.pdf",
    file_size: 842000,
    file_type: "application/pdf",
    upload_date: "2024-08-22T14:25:10.000Z",
    document_type: "lab_result",
    document_path: "documents/blood_tests/Thyroid_Function_Test_Aug2024.pdf",
    public_url: "#",
    description: "Thyroid hormone panel results",
    tags: ["lab", "thyroid", "hormones"],
    category: "Blood Tests"
  },
  {
    id: "doc-006",
    file_name: "1health.pdf",
    file_size: 1120000,
    file_type: "application/pdf",
    upload_date: "2024-10-10T09:15:00.000Z",
    document_type: "lab_result",
    document_path: "documents/1health.pdf",
    public_url: "#",
    description: "Health report from Supabase storage",
    tags: ["lab", "health", "report"],
    category: "Blood Tests"
  }
];

// Group documents by category
export const getDocumentsByCategory = (category: string) => {
  return mockMedicalDocuments.filter(doc => doc.category === category);
};

// Mock medical profile data for Rashmi Elavazhagan
export const mockMedicalProfile = {
  accountNumber: '017316754',
  dob: '2001-09-30',
  age: '23',
  sex: 'Female',
  bp: '109/61 Left Arm; Sitting; Regular Cuff',
  temperature: '98 F Temporal',
  pulse: '67',
  respiration: '16',
  height: '5 ft 0.5 in',
  weight: '122.2 lbs',
  bmi: '23.5',
  allergies: 'NO KNOWN DRUG ALLERGY\nNO KNOWN MATERIAL ALLERGY',
  medications: 'No Active Medications',
  conditions: 'No Known Medical Conditions',
  notes: 'Nonsmoker (never smoked)\nNo History of Substance Abuse\nAlcohol Intake, Non Consumer\nFamily History: FH Thyroid disorder (Sister)'
}; 
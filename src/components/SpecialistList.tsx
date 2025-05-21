import React, { useEffect, useState } from 'react';

// Constants - match the ones from Map.tsx
const USE_GOOGLE_API = false;
const GOOGLE_MAPS_API_KEY = "";

// Define interfaces
interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'specialist';
  specialty: string[];
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  contact: string;
  distance?: number; // Distance in km from the center point
}

interface SpecialistListProps {
  pincode: string;
  requiredSpecialty?: string;
}

// Sample data for common pincodes and locations
const zipCodeMap: Record<string, [number, number]> = {
  // US ZIPcodes
  '10001': [40.7504, -73.9967], // New York
  '90001': [33.9731, -118.2479], // Los Angeles
  '60601': [41.8870, -87.6212], // Chicago
  '91766': [34.0633, -117.7544], // Pomona, CA
  '91767': [34.0759, -117.7242], // Pomona, CA (adjacent)
  '91768': [34.0514, -117.7553], // Pomona, CA (adjacent)
  
  // Indian pincodes
  '110001': [28.6289, 77.2311], // Delhi
  '400001': [18.9490, 72.8296], // Mumbai
  '600001': [13.0836, 80.2825], // Chennai
  '700001': [22.5726, 88.3639], // Kolkata
  '500001': [17.3850, 78.4867], // Hyderabad
};

// Mock healthcare facilities for some zipcodes
const mockFacilities: Record<string, HealthcareFacility[]> = {
  '91766': [
    {
      id: 'hospital1',
      name: 'Pomona Valley Hospital Medical Center',
      type: 'hospital',
      specialty: ['General', 'Emergency'],
      location: { lat: 34.0592, lng: -117.7589 },
      address: '1798 N Garey Ave, Pomona, CA 91767',
      contact: '(909) 865-9500',
      distance: 0.8
    },
    {
      id: 'clinic1',
      name: 'Pomona Community Health Center',
      type: 'clinic',
      specialty: ['Primary Care'],
      location: { lat: 34.0544, lng: -117.7499 },
      address: '1450 E Holt Ave, Pomona, CA 91767',
      contact: '(909) 630-7927',
      distance: 1.2
    },
    {
      id: 'specialist1',
      name: 'Dr. Smith - Cardiologist',
      type: 'specialist',
      specialty: ['Cardiology'],
      location: { lat: 34.0664, lng: -117.7634 },
      address: '1700 Western Ave, Pomona, CA 91766',
      contact: '(909) 555-1234',
      distance: 1.5
    },
    {
      id: 'specialist2',
      name: 'Dr. Johnson - Pediatrician',
      type: 'specialist',
      specialty: ['Pediatrics'],
      location: { lat: 34.0617, lng: -117.7498 },
      address: '1111 E Holt Ave, Pomona, CA 91767',
      contact: '(909) 555-5678',
      distance: 2.1
    },
    {
      id: 'specialist3',
      name: 'Dr. Davis - Neurologist',
      type: 'specialist',
      specialty: ['Neurology'],
      location: { lat: 34.0701, lng: -117.7512 },
      address: '1300 N Garey Ave, Pomona, CA 91767',
      contact: '(909) 555-9012',
      distance: 2.3
    }
  ],
  '110001': [
    {
      id: 'hospital-delhi-1',
      name: 'AIIMS Delhi',
      type: 'hospital',
      specialty: ['General', 'Emergency', 'Neurology', 'Cardiology'],
      location: { lat: 28.6139, lng: 77.2090 },
      address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, 110029',
      contact: '011-26588500',
      distance: 1.5
    },
    {
      id: 'hospital-delhi-2',
      name: 'Safdarjung Hospital',
      type: 'hospital',
      specialty: ['General', 'Emergency'],
      location: { lat: 28.5695, lng: 77.2060 },
      address: 'Ansari Nagar West, New Delhi, 110029',
      contact: '011-26730000',
      distance: 2.2
    },
    {
      id: 'specialist-delhi-1',
      name: 'Dr. Sharma - Cardiologist',
      type: 'specialist',
      specialty: ['Cardiology'],
      location: { lat: 28.6321, lng: 77.2195 },
      address: 'Connaught Place, New Delhi, 110001',
      contact: '9876543210',
      distance: 0.8
    }
  ]
};

// Function to get coordinates from pincode
const getCoordinatesFromPincode = async (pincode: string): Promise<[number, number]> => {
  try {
    // Clean up the pincode
    const cleanPincode = pincode.trim();
    
    // First check our local zipcode map
    if (zipCodeMap[cleanPincode]) {
      console.log("Found in local zipcode map:", cleanPincode);
      return zipCodeMap[cleanPincode];
    }
    
    // For simplicity, use central point of country based on pincode format
    if (/^\d{6}$/.test(cleanPincode)) { // Indian PIN code
      return [20.5937, 78.9629]; // Central India
    } else if (/^\d{5}(-\d{4})?$/.test(cleanPincode)) { // US ZIP code
      return [39.8283, -98.5795]; // Central USA
    }
    
    // Default fallback
    return [0, 0];
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return [0, 0];
  }
};

// Function to generate random facilities if needed
const generateRandomFacilities = (pincode: string, lat: number, lon: number): HealthcareFacility[] => {
  const facilities: HealthcareFacility[] = [];
  const specialties = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
    'Neurology', 'Obstetrics', 'Oncology', 'Ophthalmology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Pulmonology', 'Rheumatology', 'Urology'
  ];
  
  // Use pincode to create more realistic naming
  let areaName = "Local";
  if (pincode.length === 5 && /^\d+$/.test(pincode)) {
    // For US ZIP codes, use this format
    areaName = `${pincode.substring(0, 2)}${pincode.substring(2, 5)}`;
  } else if (pincode.length === 6 && /^\d+$/.test(pincode)) {
    // For Indian PIN codes
    areaName = `Area ${pincode.substring(0, 3)}`;
  }
  
  // Generate 1-2 hospitals
  for (let i = 1; i <= 1 + Math.floor(Math.random() * 2); i++) {
    const distance = Math.round((Math.random() * 3 + 0.5) * 10) / 10; // 0.5 to 3.5 km
    facilities.push({
      id: `${pincode}-hospital-${i}`,
      name: `${areaName} General Hospital ${i > 1 ? i : ''}`,
      type: 'hospital',
      specialty: ['General', 'Emergency'],
      location: { lat: lat, lng: lon }, // Exact location doesn't matter for list view
      address: `123 Medical Center Drive, ${pincode}`,
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`,
      distance: distance
    });
  }
  
  // Generate 2-3 clinics
  for (let i = 1; i <= 2 + Math.floor(Math.random() * 2); i++) {
    const distance = Math.round((Math.random() * 4 + 1) * 10) / 10; // 1 to 5 km
    facilities.push({
      id: `${pincode}-clinic-${i}`,
      name: `${areaName} Health Clinic ${i}`,
      type: 'clinic',
      specialty: ['Primary Care'],
      location: { lat: lat, lng: lon },
      address: `${100 + i} Health Street, ${pincode}`,
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`,
      distance: distance
    });
  }
  
  // Generate 5-7 specialists
  const numSpecialists = 5 + Math.floor(Math.random() * 3);
  for (let i = 1; i <= numSpecialists; i++) {
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const distance = Math.round((Math.random() * 5 + 0.7) * 10) / 10; // 0.7 to 5.7 km
    facilities.push({
      id: `${pincode}-specialist-${i}`,
      name: `Dr. ${String.fromCharCode(64 + i)} - ${specialty} Specialist`,
      type: 'specialist',
      specialty: [specialty],
      location: { lat: lat, lng: lon },
      address: `${200 + i} Specialist Avenue, ${pincode}`,
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`,
      distance: distance
    });
  }
  
  return facilities;
};

// Function to search for healthcare facilities 
const searchHealthcareFacilities = async (pincode: string): Promise<HealthcareFacility[]> => {
  // First check if we have mock data for this pincode
  if (mockFacilities[pincode]) {
    console.log("Using mock healthcare facilities for", pincode);
    return mockFacilities[pincode];
  }
  
  try {
    // Get coordinates for the pincode
    const [lat, lon] = await getCoordinatesFromPincode(pincode);
    
    // For simplicity in this list view implementation, just generate random facilities
    return generateRandomFacilities(pincode, lat, lon);
  } catch (error) {
    console.error('Error searching facilities:', error);
    return [];
  }
};

// Function to filter facilities by specialty
const filterBySpecialty = (facilities: HealthcareFacility[], specialty?: string): HealthcareFacility[] => {
  if (!specialty) return facilities;
  
  const searchTerms = specialty.toLowerCase().split(/\s+/)
    .filter(term => term.length > 3); // Only use terms longer than 3 chars
  
  // If no valid search terms, return all facilities
  if (searchTerms.length === 0) return facilities;
  
  return facilities.filter(facility => {
    // Check if any of the facility's specialties match any of the search terms
    const facilitySpecialties = facility.specialty.map(s => s.toLowerCase());
    const nameMatches = searchTerms.some(term => 
      facility.name.toLowerCase().includes(term)
    );
    const specialtyMatches = searchTerms.some(term => 
      facilitySpecialties.some(s => s.includes(term))
    );
    
    // Common specialty mappings
    const specialtyMappings: Record<string, string[]> = {
      'cardiology': ['heart', 'cardiac', 'cardiovascular'],
      'dermatology': ['skin', 'derma'],
      'neurology': ['brain', 'nerve', 'neural'],
      'orthopedics': ['bone', 'joint', 'orthopedic', 'musculoskeletal'],
      'pediatrics': ['child', 'children', 'pediatric'],
      'ophthalmology': ['eye', 'vision', 'optical'],
      'gynecology': ['obgyn', 'obstetrics', 'women'],
      'urology': ['urinary', 'bladder', 'kidney']
    };
    
    // Check if any search term matches any mapped specialty term
    const mappingMatches = searchTerms.some(term => {
      return Object.entries(specialtyMappings).some(([key, values]) => {
        if (key.includes(term)) return true;
        return values.some(value => value.includes(term));
      });
    });
    
    // Check if any facility specialty matches any mapped search term
    const facilityMatchesMappedTerm = facilitySpecialties.some(facilitySpecialty => {
      return Object.entries(specialtyMappings).some(([key, values]) => {
        if (facilitySpecialty.includes(key)) {
          return searchTerms.some(term => key.includes(term));
        }
        return values.some(value => 
          facilitySpecialty.includes(value) && searchTerms.some(term => value.includes(term))
        );
      });
    });
    
    return nameMatches || specialtyMatches || mappingMatches || facilityMatchesMappedTerm;
  });
};

export const SpecialistList: React.FC<SpecialistListProps> = ({ pincode, requiredSpecialty }) => {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Search for healthcare facilities
        const foundFacilities = await searchHealthcareFacilities(pincode);
        
        // Sort by distance
        const sortedFacilities = [...foundFacilities].sort((a, b) => {
          return (a.distance || 99) - (b.distance || 99);
        });
        
        setFacilities(sortedFacilities);
        
        // Filter by specialty if required
        const filtered = filterBySpecialty(sortedFacilities, requiredSpecialty);
        setFilteredFacilities(filtered.length > 0 ? filtered : sortedFacilities);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load healthcare facilities');
        setFacilities([]);
        setFilteredFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    if (pincode) {
      fetchData();
    }
  }, [pincode, requiredSpecialty]);

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 border-2 border-t-blue-500 rounded-full animate-spin mr-2"></div>
          <span>Loading healthcare facilities for {pincode}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="text-red-500 text-center py-8">
          {error}
        </div>
      </div>
    );
  }

  if (filteredFacilities.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="text-gray-600 text-center py-8">
          No healthcare facilities found for {pincode} {requiredSpecialty ? `specializing in ${requiredSpecialty}` : ''}.
        </div>
      </div>
    );
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <span className="text-red-600 text-xl">🏥</span>;
      case 'clinic':
        return <span className="text-blue-600 text-xl">🩺</span>;
      case 'specialist':
        return <span className="text-green-600 text-xl">👨‍⚕️</span>;
      default:
        return <span className="text-gray-600 text-xl">🏢</span>;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Nearby Healthcare Facilities</h2>
      <div className="mb-4 bg-gray-50 p-2 rounded text-sm text-gray-600">
        <div className="flex gap-4">
          <div className="flex items-center"><span className="text-red-600 text-xl mr-1">🏥</span> Hospital</div>
          <div className="flex items-center"><span className="text-blue-600 text-xl mr-1">🩺</span> Clinic</div>
          <div className="flex items-center"><span className="text-green-600 text-xl mr-1">👨‍⚕️</span> Specialist</div>
        </div>
      </div>
      
      <div className="divide-y">
        {filteredFacilities.map((facility) => (
          <div key={facility.id} className="py-4">
            <div className="flex items-start">
              <div className="mr-3 mt-1">
                {typeIcon(facility.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{facility.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{facility.type}</p>
                
                {facility.specialty.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Specialty:</span> {facility.specialty.join(', ')}
                  </p>
                )}
                
                <div className="mt-2 text-sm">
                  <p className="text-gray-700">{facility.address}</p>
                  <p className="text-gray-700">Contact: {facility.contact}</p>
                  
                  {facility.distance !== undefined && (
                    <p className="text-blue-600 font-medium mt-1">
                      {facility.distance} km away
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 
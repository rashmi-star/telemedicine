// Map API utilities for finding nearby hospitals using OpenStreetMap
import { realHealthcareFacilityMap } from '../data/realHealthcareFacilities';

/**
 * Interface for healthcare facility
 */
export interface HealthcareFacility {
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
  distance?: number;
}

// Add Google Maps API integration for better US ZIP code support
const GOOGLE_MAPS_API_KEY = ""; // Add your API key here

// Add more extensive US ZIP code database
const US_ZIP_COORDINATES: Record<string, [number, number]> = {
  // California
  '90001': [33.9731, -118.2479], // Los Angeles
  '90210': [34.0901, -118.4065], // Beverly Hills
  '90401': [34.0141, -118.4965], // Santa Monica
  '91001': [34.2000, -118.1753], // Altadena
  '91101': [34.1478, -118.1445], // Pasadena
  '91335': [34.2010, -118.5636], // Reseda
  '91406': [34.1936, -118.5329], // Van Nuys
  '91601': [34.1678, -118.3782], // North Hollywood
  '91744': [34.0339, -117.9299], // La Puente
  '91761': [34.0633, -117.6509], // Ontario
  '91762': [34.0368, -117.6145], // Ontario
  '91764': [34.0783, -117.6582], // Ontario
  '91766': [34.0633, -117.7544], // Pomona
  '91767': [34.0758, -117.7242], // Pomona
  '91768': [34.0514, -117.7553], // Pomona
  '91773': [34.1064, -117.8068], // San Dimas
  '91789': [34.0203, -117.8656], // Walnut
  '92054': [33.1959, -117.3795], // Oceanside
  '92101': [32.7174, -117.1628], // San Diego
  '92618': [33.6695, -117.7680], // Irvine
  '92697': [33.6461, -117.8427], // Irvine (UC Irvine)
  '93001': [34.2783, -119.2935], // Ventura
  '93401': [35.2672, -120.6734], // San Luis Obispo
  '94025': [37.4530, -122.1817], // Menlo Park
  '94035': [37.4100, -122.0566], // Mountain View (NASA)
  '94101': [37.7749, -122.4194], // San Francisco
  '94158': [37.7749, -122.3892], // San Francisco (UCSF)
  '94720': [37.8719, -122.2614], // Berkeley (UC Berkeley)
  '95014': [37.3230, -122.0322], // Cupertino
  '95064': [36.9953, -122.0581], // Santa Cruz (UCSC)
  '95110': [37.3639, -121.9289], // San Jose
  '95616': [38.5449, -121.7405], // Davis (UC Davis)
  
  // New York
  '10001': [40.7504, -73.9967], // New York (Manhattan)
  '10016': [40.7463, -73.9813], // New York (Murray Hill)
  '10065': [40.7659, -73.9624], // New York (Upper East Side)
  '10128': [40.7819, -73.9519], // New York (Upper East Side)
  '10314': [40.6135, -74.1471], // Staten Island
  '11201': [40.6973, -73.9915], // Brooklyn (Brooklyn Heights)
  '11211': [40.7131, -73.9614], // Brooklyn (Williamsburg)
  '11249': [40.7174, -73.9578], // Brooklyn (Williamsburg)
  '11375': [40.7211, -73.8461], // Queens (Forest Hills)
  '11697': [40.5530, -73.8835], // Queens (Breezy Point)
  
  // Illinois
  '60007': [42.0111, -87.9882], // Elk Grove Village
  '60290': [41.8299, -87.9130], // Chicago
  '60601': [41.8841, -87.6219], // Chicago (The Loop)
  '60615': [41.8015, -87.5989], // Chicago (Hyde Park)
  '60637': [41.7943, -87.5917], // Chicago (Hyde Park - UChicago)
  
  // Texas
  '75201': [32.7887, -96.7982], // Dallas
  '77001': [29.7604, -95.3698], // Houston
  '78701': [30.2672, -97.7431], // Austin
  
  // Massachusetts
  '02138': [42.3800, -71.1198], // Cambridge (Harvard)
  '02139': [42.3643, -71.1037], // Cambridge
  '02142': [42.3631, -71.0856], // Cambridge (MIT/Kendall Sq)
  '02210': [42.3476, -71.0442], // Boston (Seaport)
  
  // Other states
  '20001': [38.9126, -77.0179], // Washington DC
  '27708': [36.0014, -78.9382], // Durham NC (Duke)
  '33139': [25.7774, -80.1350], // Miami Beach FL
  '53703': [43.0731, -89.3838], // Madison WI
  '80302': [40.0150, -105.2705], // Boulder CO
  '85281': [33.4255, -111.9400], // Tempe AZ (ASU)
  '98101': [47.6097, -122.3331], // Seattle WA
};

/**
 * Get nearby healthcare facilities using OpenStreetMap's Overpass API
 * @param lat Latitude
 * @param lon Longitude 
 * @param radius Search radius in meters (default: 5000)
 * @returns Promise with array of healthcare facilities
 */
export async function getNearbyHealthcareFacilities(
  lat: number, 
  lon: number, 
  radius: number = 5000
): Promise<HealthcareFacility[]> {
  try {
    console.log("Searching for healthcare facilities near", lat, lon, "with radius", radius);
    
    // For 91766 and surrounding areas, return our real data immediately
    if (Math.abs(lat - 34.0633) < 0.1 && Math.abs(lon - (-117.7544)) < 0.1) {
      console.log("Location appears to be near Pomona (91766), using real healthcare data");
      
      // Return Pomona healthcare facilities (directly use real data)
      for (const zipCode of ['91766', '91767', '91768']) {
        if (realHealthcareFacilityMap[zipCode]) {
          console.log(`Using real healthcare data for ZIP code ${zipCode}`);
          return realHealthcareFacilityMap[zipCode];
        }
      }
    }
    
    // Check for Delhi coordinates
    if (Math.abs(lat - 28.6289) < 0.1 && Math.abs(lon - 77.2311) < 0.1) {
      console.log("Location appears to be near Delhi (110001), using real healthcare data");
      if (realHealthcareFacilityMap['110001']) {
        return realHealthcareFacilityMap['110001'];
      }
    }
    
    // Use a simpler query that's more likely to return results
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="clinic"](around:${radius},${lat},${lon});
        way["amenity"="clinic"](around:${radius},${lat},${lon});
        node["amenity"="doctors"](around:${radius},${lat},${lon});
        node["healthcare"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (!response.ok) {
        console.error(`Overpass API error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`Received ${data.elements?.length || 0} elements from Overpass API`);
      
      // Process the data into our format
      const facilities: HealthcareFacility[] = data.elements
        .filter((element: any) => element.tags && (
          element.tags.amenity === 'hospital' || 
          element.tags.amenity === 'clinic' || 
          element.tags.amenity === 'doctors' ||
          element.tags.healthcare ||
          // Include facilities with relevant names even if they don't have proper tags
          (element.tags.name && /hospital|medical|health|clinic|care|doctor/i.test(element.tags.name))
        ))
        .map((element: any) => {
          const elementLat = element.lat || element.center?.lat;
          const elementLon = element.lon || element.center?.lng;
          
          // Skip if we don't have coordinates
          if (!elementLat || !elementLon) return null;
          
          // Calculate distance in km (approximate)
          const distance = calculateDistance(lat, lon, elementLat, elementLon);
          
          // Determine facility type based on tags
          let facilityType: 'hospital' | 'clinic' | 'specialist' = 'clinic';
          if (element.tags.amenity === 'hospital' || 
              (element.tags.name && /hospital|medical center/i.test(element.tags.name))) {
            facilityType = 'hospital';
          } else if (element.tags.amenity === 'doctors' || 
                    element.tags.healthcare === 'doctor' ||
                    element.tags.healthcare?.includes('specialist') ||
                    element.tags['healthcare:speciality']) {
            facilityType = 'specialist';
          }
          
          return {
            id: `osm-${element.id}`,
            name: element.tags.name || element.tags.operator || determineName(element.tags, facilityType),
            type: facilityType,
            specialty: getSpecialties(element.tags),
            location: {
              lat: elementLat,
              lng: elementLon
            },
            address: formatAddress(element.tags),
            contact: element.tags.phone || element.tags['contact:phone'] || 
                    element.tags['phone'] || element.tags['contact'] || 'Contact not available',
            distance: distance
          };
      }).filter(Boolean);

      return facilities;
    } catch (apiError) {
      console.error("Error with Overpass API request:", apiError);
      return [];
    }
  } catch (error) {
    console.error('Error fetching healthcare facilities:', error);
    return [];
  }
}

/**
 * Generate a name for facilities without a name tag
 */
function determineName(tags: any, type: 'hospital' | 'clinic' | 'specialist'): string {
  if (type === 'hospital') {
    return 'Hospital';
  } else if (type === 'specialist') {
    const specialty = tags.healthcare?.replace('doctor', '') || 
                     tags['healthcare:speciality'] || 
                     '';
    return `${specialty ? specialty + ' ' : ''}Specialist`;
  } else {
    return 'Medical Clinic';
  }
}

/**
 * Extract specialties from tags
 */
function getSpecialties(tags: any): string[] {
  const specialties: string[] = [];
  
  if (tags.healthcare) {
    if (typeof tags.healthcare === 'string') {
      specialties.push(tags.healthcare);
    } else if (Array.isArray(tags.healthcare)) {
      specialties.push(...tags.healthcare);
    }
  }
  
  if (tags.specialty) {
    if (typeof tags.specialty === 'string') {
      specialties.push(tags.specialty);
    } else if (Array.isArray(tags.specialty)) {
      specialties.push(...tags.specialty);
    }
  }
  
  // Add medical specialties if available
  const medicalFields = [
    'healthcare:speciality', 'medicine', 'medical_specialty',
    'doctor', 'doctor:type', 'health_specialty'
  ];
  
  for (const field of medicalFields) {
    if (tags[field]) {
      if (typeof tags[field] === 'string') {
        specialties.push(tags[field]);
      } else if (Array.isArray(tags[field])) {
        specialties.push(...tags[field]);
      }
    }
  }
  
  // If no specialties found, add a default based on the type
  if (specialties.length === 0) {
    if (tags.amenity === 'hospital') {
      specialties.push('General');
    } else if (tags.amenity === 'clinic') {
      specialties.push('Primary Care');
    }
  }
  
  return specialties;
}

/**
 * Format address from OSM tags
 */
function formatAddress(tags: any): string {
  // If there's a formatted address, use it
  if (tags['addr:full']) return tags['addr:full'];
  
  // Otherwise try to construct from components
  const components = [];
  
  if (tags['addr:housenumber']) components.push(tags['addr:housenumber']);
  if (tags['addr:street']) components.push(tags['addr:street']);
  if (tags['addr:city']) components.push(tags['addr:city']);
  if (tags['addr:postcode']) components.push(tags['addr:postcode']);
  if (tags['addr:state']) components.push(tags['addr:state']);
  if (tags['addr:country']) components.push(tags['addr:country']);
  
  if (components.length > 0) {
    return components.join(', ');
  }
  
  return 'Address not available';
}

/**
 * Calculate distance between two points using the Haversine formula
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Fetch near healthcare facilities using Google Places API - focused on US ZIP codes
 */
export async function fetchNearbyHealthcare(
  lat: number, 
  lon: number, 
  radius: number = 5000
): Promise<HealthcareFacility[]> {
  try {
    // Skip API call for US special handling cases
    if (Math.abs(lat - 34.0633) < 0.1 && Math.abs(lon - (-117.7544)) < 0.1) {
      console.log("Location is near Pomona, returning empty to use predefined data");
      return [];
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.log("No Google Maps API key provided, falling back to OpenStreetMap");
      return getNearbyHealthcareFacilities(lat, lon, radius);
    }
    
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=hospital|doctor|health|medical_clinic&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        console.error("Google Places API error:", response.status);
        return getNearbyHealthcareFacilities(lat, lon, radius);
      }
      
      const data = await response.json();
      
      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        console.log("No results from Google Places API, falling back to OpenStreetMap");
        return getNearbyHealthcareFacilities(lat, lon, radius);
      }
      
      const facilities: HealthcareFacility[] = data.results.map((place: any) => {
        // Determine facility type based on types array
        let facilityType: 'hospital' | 'clinic' | 'specialist' = 'clinic';
        if (place.types.includes('hospital')) {
          facilityType = 'hospital';
        } else if (place.types.includes('doctor')) {
          facilityType = 'specialist';
        }
        
        // Calculate distance (haversine formula)
        const placeLat = place.geometry.location.lat;
        const placeLng = place.geometry.location.lng;
        const distance = calculateDistance(lat, lon, placeLat, placeLng);
        
        return {
          id: `google-${place.place_id}`,
          name: place.name,
          type: facilityType,
          specialty: determineSpecialties(place),
          location: {
            lat: placeLat,
            lng: placeLng
          },
          address: place.vicinity || 'Address not available',
          contact: place.formatted_phone_number || 'Contact not available',
          distance: distance
        };
      });
      
      return facilities;
    } catch (error) {
      console.error("Error fetching from Google Places API:", error);
      return getNearbyHealthcareFacilities(lat, lon, radius);
    }
  } catch (error) {
    console.error("Error in fetchNearbyHealthcare:", error);
    return [];
  }
}

/**
 * Determine specialties based on Place details
 */
function determineSpecialties(place: any): string[] {
  const specialties: string[] = [];
  
  // Check for hospital type
  if (place.types.includes('hospital')) {
    specialties.push('General', 'Emergency');
  }
  
  // Check place name for common specialties
  const name = place.name.toLowerCase();
  const specialtyKeywords: Record<string, string> = {
    'cardio': 'Cardiology',
    'heart': 'Cardiology',
    'neuro': 'Neurology',
    'brain': 'Neurology',
    'ortho': 'Orthopedics',
    'bone': 'Orthopedics',
    'pedia': 'Pediatrics',
    'child': 'Pediatrics',
    'derma': 'Dermatology',
    'skin': 'Dermatology',
    'psych': 'Psychiatry',
    'mental': 'Psychiatry',
    'eye': 'Ophthalmology',
    'ophthal': 'Ophthalmology',
    'dent': 'Dental',
    'tooth': 'Dental',
    'cancer': 'Oncology',
    'onco': 'Oncology',
    'urgent': 'Urgent Care',
    'emergency': 'Emergency',
    'family': 'Family Medicine',
    'general': 'General Practitioner',
    'obgyn': 'Obstetrics & Gynecology',
    'women': 'Obstetrics & Gynecology',
    'pulmon': 'Pulmonology',
    'lung': 'Pulmonology',
    'respiratory': 'Pulmonology',
    'ear': 'Otolaryngology',
    'nose': 'Otolaryngology',
    'throat': 'Otolaryngology',
    'ent': 'Otolaryngology',
    'gastro': 'Gastroenterology',
    'digest': 'Gastroenterology'
  };
  
  for (const [keyword, specialty] of Object.entries(specialtyKeywords)) {
    if (name.includes(keyword)) {
      specialties.push(specialty);
    }
  }
  
  // Add a default if no specialties found
  if (specialties.length === 0) {
    if (place.types.includes('doctor')) {
      specialties.push('General Practitioner');
    } else if (place.types.includes('pharmacy')) {
      specialties.push('Pharmacy');
    } else {
      specialties.push('Medical Services');
    }
  }
  
  return specialties;
}

/**
 * Enhanced geocoding function that prioritizes US ZIP codes
 */
export async function geocodePincode(pincode: string): Promise<[number, number]> {
  try {
    console.log(`Geocoding pincode: ${pincode}`);
    
    // First check if we have real healthcare data for this pincode
    if (realHealthcareFacilityMap[pincode]) {
      console.log(`Using real healthcare data for ${pincode}`);
      // Return the coordinates from our first facility (approximate center)
      const facilities = realHealthcareFacilityMap[pincode];
      if (facilities && facilities.length > 0) {
        const centerFacility = facilities[0];
        return [centerFacility.location.lat, centerFacility.location.lng];
      }
    }
    
    // Next check our extended US ZIP code database
    if (US_ZIP_COORDINATES[pincode]) {
      console.log(`Found US ZIP code ${pincode} in database`);
      return US_ZIP_COORDINATES[pincode];
    }
    
    // Check if it's a US ZIP code pattern but not in our database
    if (/^\d{5}(-\d{4})?$/.test(pincode)) {
      // For US ZIP codes, try Google Geocoding API if available
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${GOOGLE_MAPS_API_KEY}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === "OK" && data.results && data.results.length > 0) {
              const location = data.results[0].geometry.location;
              console.log(`Found coordinates for US ZIP ${pincode} via Google: ${location.lat}, ${location.lng}`);
              return [location.lat, location.lng];
            }
          }
        } catch (error) {
          console.error("Error with Google Geocoding API:", error);
        }
      }
    }
    
    // Continue with existing geocoding methods
    // First check if we have the pincode in our local database
    const localCoordinates = getLocalCoordinates(pincode);
    if (localCoordinates) {
      console.log("Found pincode in local database:", pincode);
      return localCoordinates;
    }
    
    // Otherwise try LocationIQ (you'll need to sign up for a free API key)
    // Free account: https://locationiq.com/
    const LOCATIONIQ_API_KEY = ""; // Add your API key here
    
    if (LOCATIONIQ_API_KEY) {
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(pincode)}&format=json`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          console.log("Found coordinates via LocationIQ:", pincode);
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      }
    }
    
    // Otherwise try Nominatim (OpenStreetMap's geocoder) - has usage limits, be cautious
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pincode)}&format=json`,
      {
        headers: {
          'User-Agent': 'MedGuide/1.0' // It's good practice to identify your app
        }
      }
    );
    
    if (nominatimResponse.ok) {
      const data = await nominatimResponse.json();
      if (data && data.length > 0) {
        console.log("Found coordinates via Nominatim:", pincode);
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    }
    
    // If all else fails, use a fallback based on pincode format
    return getFallbackCoordinates(pincode);
    
  } catch (error) {
    console.error('Error geocoding pincode:', error);
    return getFallbackCoordinates(pincode);
  }
}

/**
 * Get coordinates from local database
 */
function getLocalCoordinates(pincode: string): [number, number] | null {
  // Sample data for common pincodes
  const pincodeMap: Record<string, [number, number]> = {
    // US ZIPcodes
    '10001': [40.7504, -73.9967], // New York
    '90001': [33.9731, -118.2479], // Los Angeles
    '60601': [41.8870, -87.6212], // Chicago
    '91766': [34.0633, -117.7544], // Pomona, CA
    '91767': [34.0759, -117.7242], // Pomona, CA (adjacent)
    
    // Indian pincodes
    '110001': [28.6289, 77.2311], // Delhi
    '400001': [18.9490, 72.8296], // Mumbai
    '600001': [13.0836, 80.2825], // Chennai
    '700001': [22.5726, 88.3639], // Kolkata
    '500001': [17.3850, 78.4867], // Hyderabad
  };
  
  return pincodeMap[pincode] || null;
}

/**
 * Get fallback coordinates based on pincode format
 */
function getFallbackCoordinates(pincode: string): [number, number] {
  // For US ZIP codes (5 digits)
  if (/^\d{5}$/.test(pincode)) {
    return [39.8283, -98.5795]; // Center of USA
  }
  
  // For Indian PIN codes (6 digits)
  if (/^\d{6}$/.test(pincode)) {
    return [20.5937, 78.9629]; // Center of India
  }
  
  // For UK postcodes (alphanumeric)
  if (/^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i.test(pincode)) {
    return [55.3781, -3.4360]; // Center of UK
  }
  
  // Default fallback
  return [0, 0];
}

/**
 * Generate facilities when API data can't be found
 * Checks for real data first, then falls back to mock data
 */
export function generateMockFacilities(lat: number, lon: number, pincode: string, requiredSpecialty?: string): HealthcareFacility[] {
  // First check if we have real data for this pincode
  if (realHealthcareFacilityMap[pincode]) {
    console.log(`Using real healthcare data for ${pincode} from our database`);
    const facilities = realHealthcareFacilityMap[pincode];
    
    // If a specific specialty is required, filter the facilities
    if (requiredSpecialty) {
      const matchingFacilities = facilities.filter(facility => 
        facility.specialty.some(spec => 
          spec.toLowerCase().includes(requiredSpecialty.toLowerCase())
        )
      );
      
      // If we have matches, return them, otherwise return all facilities
      if (matchingFacilities.length > 0) {
        return matchingFacilities;
      }
    }
    
    return facilities;
  }
  
  // Continue with mock data generation if no real data is available
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
      location: {
        lat: lat + (Math.random() - 0.5) * 0.01,
        lng: lon + (Math.random() - 0.5) * 0.01
      },
      address: `123 Medical Center Drive, ${pincode}`,
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`,
      distance: distance
    });
  }
  
  // Generate 2-3 clinics
  for (let i = 1; i <= 2 + Math.floor(Math.random() * 2); i++) {
    const distance = Math.round((Math.random() * 3 + 0.5) * 10) / 10; // 0.5 to 3.5 km
    facilities.push({
      id: `${pincode}-clinic-${i}`,
      name: `${areaName} Health Clinic ${i}`,
      type: 'clinic',
      specialty: ['Primary Care'],
      location: {
        lat: lat + (Math.random() - 0.5) * 0.02,
        lng: lon + (Math.random() - 0.5) * 0.02
      },
      address: `${100 + i} Health Street, ${pincode}`,
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`,
      distance: distance
    });
  }
  
  // Generate 3-5 specialists, prioritizing the requested specialty if provided
  const numSpecialists = 3 + Math.floor(Math.random() * 3);
  for (let i = 1; i <= numSpecialists; i++) {
    // If requiredSpecialty is provided, make sure at least one specialist offers it
    const specialty = (requiredSpecialty && i === 1) 
      ? requiredSpecialty 
      : specialties[Math.floor(Math.random() * specialties.length)];
    
    const distance = Math.round((Math.random() * 4 + 0.8) * 10) / 10; // 0.8 to 4.8 km
    facilities.push({
      id: `${pincode}-specialist-${i}`,
      name: `Dr. ${String.fromCharCode(64 + i)} - ${specialty} Specialist`,
      type: 'specialist',
      specialty: [specialty],
      location: {
        lat: lat + (Math.random() - 0.5) * 0.015,
        lng: lon + (Math.random() - 0.5) * 0.015
      },
      address: `${200 + i} Specialist Avenue, ${pincode}`,
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`,
      distance: distance
    });
  }
  
  return facilities;
} 
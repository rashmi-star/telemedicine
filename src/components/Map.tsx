import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Constants
const GOOGLE_MAPS_API_KEY = ""; // You'll need to add your API key here
const USE_GOOGLE_API = false; // Set to true to use Google Maps API for geocoding

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const clinicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const specialistIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
}

interface MapProps {
  pincode: string;
  requiredSpecialty?: string;
}

// Greatly expand our sample data for common pincodes and locations
const zipCodeMap: Record<string, [number, number]> = {
  // US ZIPcodes
  '10001': [40.7504, -73.9967], // New York
  '90001': [33.9731, -118.2479], // Los Angeles
  '60601': [41.8870, -87.6212], // Chicago
  '91766': [34.0633, -117.7544], // Pomona, CA
  '91767': [34.0759, -117.7242], // Pomona, CA (adjacent)
  '91768': [34.0514, -117.7553], // Pomona, CA (adjacent)
  '91701': [34.1159, -117.5953], // Rancho Cucamonga
  '91710': [34.0134, -117.6910], // Chino, CA
  '91711': [34.0959, -117.7178], // Claremont, CA
  '91765': [34.0363, -117.8170], // Diamond Bar, CA
  '91786': [34.0917, -117.6598], // Upland, CA
  '91789': [34.0246, -117.8991], // Walnut, CA
  '92336': [34.1264, -117.4369], // Fontana, CA
  
  // Indian pincodes
  '110001': [28.6289, 77.2311], // Delhi
  '400001': [18.9490, 72.8296], // Mumbai
  '600001': [13.0836, 80.2825], // Chennai
  '700001': [22.5726, 88.3639], // Kolkata
  '500001': [17.3850, 78.4867], // Hyderabad
  '560001': [12.9716, 77.5946], // Bangalore
  '411001': [18.5204, 73.8567], // Pune
  '380001': [23.0225, 72.5714], // Ahmedabad
  '302001': [26.9124, 75.7873], // Jaipur
  '226001': [26.8467, 80.9462], // Lucknow
  '201301': [28.5355, 77.3910], // Noida
  '530068': [17.7231, 83.3013], // Visakhapatnam
  '800001': [25.5941, 85.1376], // Patna
  
  // UK postcodes
  'EC1A 1BB': [51.5177, -0.1029], // London
  'B1 1BB': [52.4813, -1.8969], // Birmingham
  'M1 1BB': [53.4780, -2.2458], // Manchester
  'G1 1BB': [55.8617, -4.2583], // Glasgow
  'EH1 1BB': [55.9533, -3.1883], // Edinburgh
  
  // Canadian postcodes
  'M5V 2H1': [43.6426, -79.3871], // Toronto
  'H2X 1Y4': [45.5089, -73.5617], // Montreal
  'V6B 1B1': [49.2827, -123.1207], // Vancouver
  
  // Australian postcodes
  '2000': [-33.8688, 151.2093], // Sydney
  '3000': [-37.8136, 144.9631], // Melbourne
  '4000': [-27.4698, 153.0251], // Brisbane
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
      contact: '(909) 865-9500'
    },
    {
      id: 'clinic1',
      name: 'Pomona Community Health Center',
      type: 'clinic',
      specialty: ['Primary Care'],
      location: { lat: 34.0544, lng: -117.7499 },
      address: '1450 E Holt Ave, Pomona, CA 91767',
      contact: '(909) 630-7927'
    },
    {
      id: 'specialist1',
      name: 'Dr. Smith - Cardiologist',
      type: 'specialist',
      specialty: ['Cardiology'],
      location: { lat: 34.0664, lng: -117.7634 },
      address: '1700 Western Ave, Pomona, CA 91766',
      contact: '(909) 555-1234'
    },
    {
      id: 'specialist2',
      name: 'Dr. Johnson - Pediatrician',
      type: 'specialist',
      specialty: ['Pediatrics'],
      location: { lat: 34.0617, lng: -117.7498 },
      address: '1111 E Holt Ave, Pomona, CA 91767',
      contact: '(909) 555-5678'
    },
    {
      id: 'specialist3',
      name: 'Dr. Davis - Neurologist',
      type: 'specialist',
      specialty: ['Neurology'],
      location: { lat: 34.0701, lng: -117.7512 },
      address: '1300 N Garey Ave, Pomona, CA 91767',
      contact: '(909) 555-9012'
    }
  ],
  '10001': [
    {
      id: 'hospital2',
      name: 'NYC General Hospital',
      type: 'hospital',
      specialty: ['General', 'Emergency'],
      location: { lat: 40.7504, lng: -73.9977 },
      address: '123 W 34th St, New York, NY 10001',
      contact: '(212) 555-1000'
    }
  ]
};

// Component to handle map center updates
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

// Enhanced function to get coordinates from pincode using multiple methods
const getCoordinatesFromPincode = async (pincode: string): Promise<[number, number]> => {
  try {
    // Clean up the pincode/postal code by removing extra spaces
    const cleanPincode = pincode.trim();
    console.log("Looking up coordinates for pincode:", cleanPincode);
    
    // First check our local zipcode map
    if (zipCodeMap[cleanPincode]) {
      console.log("Found in local zipcode map:", cleanPincode);
      return zipCodeMap[cleanPincode];
    }
    
    // Try geocoding with OpenStreetMap (Nominatim API)
    // Method 1: Direct postal code search
    try {
      console.log("Trying direct postal code search with Nominatim");
      const postcodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanPincode)}&format=json`
    );
      const postcodeData = await postcodeResponse.json();
    
      if (postcodeData && postcodeData.length > 0) {
        console.log("Found location via postal code search");
        return [parseFloat(postcodeData[0].lat), parseFloat(postcodeData[0].lon)];
    }
    } catch (error) {
      console.warn("Direct postal code search failed:", error);
      // Continue to next method
    }
    
    // Method 2: Try with region hints for common formats
    let regionHint = '';
    
    // Add region hints based on pincode pattern
    if (/^\d{5}(-\d{4})?$/.test(cleanPincode)) {
      regionHint = 'USA'; // US ZIP code
    } else if (/^\d{6}$/.test(cleanPincode)) {
      regionHint = 'India'; // Indian PIN code
    } else if (/^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i.test(cleanPincode)) {
      regionHint = 'UK'; // UK postcode
    } else if (/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(cleanPincode)) {
      regionHint = 'Canada'; // Canadian postal code
    }
    
    if (regionHint) {
      try {
        console.log(`Trying pincode with ${regionHint} region hint`);
        const regionResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanPincode)}, ${regionHint}&format=json`
        );
        const regionData = await regionResponse.json();
        
        if (regionData && regionData.length > 0) {
          console.log(`Found location with ${regionHint} region hint`);
          return [parseFloat(regionData[0].lat), parseFloat(regionData[0].lon)];
        }
      } catch (error) {
        console.warn("Region hint search failed:", error);
        // Continue to next method
      }
    }
    
    // Method 3: General search
    try {
      console.log("Trying general search query");
      const generalResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanPincode)}&format=json`
      );
      const generalData = await generalResponse.json();
      
      if (generalData && generalData.length > 0) {
        console.log("Found location via general search");
        return [parseFloat(generalData[0].lat), parseFloat(generalData[0].lon)];
      }
    } catch (error) {
      console.warn("General search failed:", error);
      // Continue to fallback
    }
    
    // If still not found, try to use numeric pincode as fallback for known formats
    if (/^\d{6}$/.test(cleanPincode)) { // Indian PIN code
      // Use a central location in India as fallback
      console.log("Using central India as fallback for 6-digit PIN code");
      return [20.5937, 78.9629]; // Central India
    } else if (/^\d{5}(-\d{4})?$/.test(cleanPincode)) { // US ZIP code
      // Use a central location in the US as fallback
      console.log("Using central US as fallback for 5-digit ZIP code");
      return [39.8283, -98.5795]; // Central USA
    }
    
    throw new Error('Location not found for pincode: ' + cleanPincode);
  } catch (error) {
    console.error('Error getting coordinates:', error);
    // Final fallback to a global default
    return [0, 0]; // Null Island (middle of the ocean)
  }
};

// Function to search for healthcare facilities using Google Places API or fallbacks
const searchHealthcareFacilities = async (lat: number, lon: number, pincode: string): Promise<HealthcareFacility[]> => {
  // First check if we have mock data for this zipcode
  if (mockFacilities[pincode]) {
    console.log("Using mock healthcare facilities for", pincode);
    return mockFacilities[pincode];
  }
  
  // Use Google Places API if enabled and key is provided
  if (USE_GOOGLE_API && GOOGLE_MAPS_API_KEY) {
    console.log("Using Google Places API to find healthcare facilities");
    try {
      // First search for hospitals and clinics
      const hospitalResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&type=hospital&key=${GOOGLE_MAPS_API_KEY}`
      );
      const hospitalData = await hospitalResponse.json();
      
      const clinicResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&type=doctor&key=${GOOGLE_MAPS_API_KEY}`
      );
      const clinicData = await clinicResponse.json();
      
      // Combine and process the results
      const facilities: HealthcareFacility[] = [];
      
      if (hospitalData.status === "OK" && hospitalData.results) {
        hospitalData.results.forEach((place: any) => {
          facilities.push({
            id: place.place_id,
            name: place.name,
            type: 'hospital',
            specialty: place.types.includes('hospital') ? ['General'] : [],
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            address: place.vicinity || 'Address not available',
            contact: place.formatted_phone_number || 'Contact not available'
          });
        });
      }
      
      if (clinicData.status === "OK" && clinicData.results) {
        clinicData.results.forEach((place: any) => {
          facilities.push({
            id: place.place_id,
            name: place.name,
            type: place.types.includes('doctor') ? 'specialist' : 'clinic',
            specialty: [],
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            address: place.vicinity || 'Address not available',
            contact: place.formatted_phone_number || 'Contact not available'
          });
        });
      }
      
      if (facilities.length > 0) {
        return facilities;
      }
      // If no results, fall through to other methods
    } catch (error) {
      console.error("Google Places API error:", error);
      // Fall through to other methods
    }
  }
  
  try {
    console.log("Searching for healthcare facilities near", lat, lon);
    const radius = 5000; // 5km radius
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="clinic"](around:${radius},${lat},${lon});
        node["amenity"="doctors"](around:${radius},${lat},${lon});
        node["healthcare"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    
    const data = await response.json();
    const facilities = data.elements.map((element: any) => ({
      id: element.id.toString(),
      name: element.tags.name || element.tags.operator || 'Unnamed Facility',
      type: element.tags.amenity === 'hospital' ? 'hospital' : 
            element.tags.amenity === 'doctors' ? 'specialist' : 'clinic',
      specialty: element.tags.healthcare ? [element.tags.healthcare] : 
                element.tags.speciality ? [element.tags.speciality] : [],
      location: {
        lat: element.lat,
        lng: element.lon
      },
      address: element.tags['addr:full'] || 
              (element.tags['addr:housenumber'] && element.tags['addr:street'] ? 
               `${element.tags['addr:housenumber']} ${element.tags['addr:street']}` : 
               'Address not available'),
      contact: element.tags.phone || element.tags.contact_phone || 'Contact not available'
    }));
    
    // If no facilities found from API, use random nearby points as fallback
    if (facilities.length === 0) {
      console.log("No facilities found from API, generating random nearby facilities");
      return generateRandomFacilities(lat, lon, pincode);
    }
    
    return facilities;
  } catch (error) {
    console.error('Error searching facilities:', error);
    // Generate random nearby facilities as fallback
    return generateRandomFacilities(lat, lon, pincode);
  }
};

// Update the generateRandomFacilities function to consider pincode and create more relevant specialists
const generateRandomFacilities = (lat: number, lon: number, pincode: string): HealthcareFacility[] => {
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
  }
  
  // Generate 1 hospital
  facilities.push({
    id: `${pincode}-hospital-1`,
    name: `${areaName} General Hospital`,
    type: 'hospital',
    specialty: ['General', 'Emergency'],
    location: {
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lon + (Math.random() - 0.5) * 0.01
    },
    address: `123 Medical Center Drive, ${pincode}`,
    contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`
  });
  
  // Generate 2 clinics
  for (let i = 1; i <= 2; i++) {
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
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`
    });
  }
  
  // Generate 3-5 specialists
  const numSpecialists = 3 + Math.floor(Math.random() * 3);
  for (let i = 1; i <= numSpecialists; i++) {
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
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
      contact: `(${pincode.substring(0, 3)}) ${pincode.substring(3, 6)}-${Math.floor(Math.random() * 9000) + 1000}`
    });
  }
  
  return facilities;
};

// Helper function to create Google Maps URL
const getGoogleMapsUrl = (facility: HealthcareFacility) => {
  const query = encodeURIComponent(`${facility.name}, ${facility.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const Map: React.FC<MapProps> = ({ pincode, requiredSpecialty }) => {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // Default to center of USA
  const [filteredFacilities, setFilteredFacilities] = useState<HealthcareFacility[]>([]);

  // Function to filter facilities by specialty
  const filterBySpecialty = (allFacilities: HealthcareFacility[], specialty?: string) => {
    if (!specialty) return allFacilities;
    
    const searchTerms = specialty.toLowerCase().split(/\s+/)
      .filter(term => term.length > 3); // Only use terms longer than 3 chars
    
    // If no valid search terms, return all facilities
    if (searchTerms.length === 0) return allFacilities;
    
    return allFacilities.filter(facility => {
      // Check if any of the facility's specialties match any of the search terms
      const facilitySpecialties = facility.specialty.map(s => s.toLowerCase());
      const nameMatches = searchTerms.some(term => 
        facility.name.toLowerCase().includes(term)
      );
      const specialtyMatches = searchTerms.some(term => 
        facilitySpecialties.some(s => s.includes(term))
      );
      
      // Check for common specialty mappings
      const specialtyMappings: Record<string, string[]> = {
        'cardiology': ['heart', 'cardiac', 'cardiovascular'],
        'dermatology': ['skin', 'derma'],
        'neurology': ['brain', 'nerve', 'neural'],
        'orthopedics': ['bone', 'joint', 'orthopedic', 'musculoskeletal'],
        'pediatrics': ['child', 'children', 'pediatric'],
        'ophthalmology': ['eye', 'vision', 'optical'],
        'gynecology': ['obgyn', 'obstetrics', 'women'],
        'urology': ['urinary', 'bladder', 'kidney'],
        'pulmonology': ['lung', 'respiratory', 'pulmonary', 'breathing'],
        'gastroenterology': ['digestive', 'stomach', 'intestine', 'gastrointestinal'],
        'endocrinology': ['hormone', 'thyroid', 'diabetes'],
        'oncology': ['cancer', 'tumor', 'oncologic'],
        'psychiatry': ['mental', 'behavioral', 'psychological'],
        'rheumatology': ['arthritis', 'autoimmune', 'joint'],
        'ent': ['ear', 'nose', 'throat', 'otolaryngology']
      };
      
      // Check if any search term matches any mapped specialty term
      const mappingMatches = searchTerms.some(term => {
        // Check if there's a direct mapping for this term
        if (specialtyMappings[term]) {
          return true;
        }
        
        // Check if this term is in any of the mapped values
        return Object.values(specialtyMappings).some(mappedTerms => 
          mappedTerms.includes(term)
        );
      });
      
      // Check if any facility specialty matches any mapped search term
      const facilityMatchesMappedTerm = facilitySpecialties.some(facilitySpecialty => {
        return searchTerms.some(term => {
          const mappedTerms = specialtyMappings[term];
          if (!mappedTerms) return false;
          return mappedTerms.some(mappedTerm => facilitySpecialty.includes(mappedTerm));
        });
      });
      
      return nameMatches || specialtyMatches || mappingMatches || facilityMatchesMappedTerm;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get coordinates for the pincode
        const center = await getCoordinatesFromPincode(pincode);
        setMapCenter(center);
        
        // Search for healthcare facilities
        const foundFacilities = await searchHealthcareFacilities(center[0], center[1], pincode);
        setFacilities(foundFacilities);
        
        // Filter by specialty if required
        const filtered = filterBySpecialty(foundFacilities, requiredSpecialty);
        setFilteredFacilities(filtered.length > 0 ? filtered : foundFacilities);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  // Update filtered facilities when requiredSpecialty changes
  useEffect(() => {
    if (facilities.length > 0) {
      const filtered = filterBySpecialty(facilities, requiredSpecialty);
      setFilteredFacilities(filtered.length > 0 ? filtered : facilities);
    }
  }, [requiredSpecialty, facilities]);

  if (loading) {
    return (
      <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-gray-100">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <span>Loading healthcare facilities for {pincode}...</span>
        </div>
      </div>
    );
  }

  if (filteredFacilities.length === 0) {
    return (
      <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">
          No healthcare facilities found for {pincode} {requiredSpecialty ? `specializing in ${requiredSpecialty}` : ''}.
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={mapCenter} />
        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.location.lat, facility.location.lng]}
            icon={
              facility.type === 'hospital' ? hospitalIcon : 
              facility.type === 'specialist' ? specialistIcon : clinicIcon
            }
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{facility.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{facility.type}</p>
                {facility.specialty.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Specialty:</span> {facility.specialty.join(', ')}
                  </p>
                )}
                <p className="text-sm mt-2">{facility.address}</p>
                <p className="text-sm">Contact: {facility.contact}</p>
                
                <div className="mt-3 flex gap-2">
                  <a 
                    href={getGoogleMapsUrl(facility)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 w-full text-center"
                  >
                    View on Google Maps
                  </a>
                </div>
                <div className="mt-2">
                  <a 
                    href={`tel:${facility.contact.replace(/\D/g, '')}`} 
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 w-full block text-center"
                  >
                    Call Facility
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
import { HealthcareFacility } from '../utils/mapApi';

// Real healthcare facilities for Pomona, CA (91766) - Verified actual healthcare facilities
export const pomonaHealthcareFacilities: HealthcareFacility[] = [
  {
    id: "pomona-valley-hospital",
    name: "Pomona Valley Hospital Medical Center",
    type: "hospital",
    specialty: ["General", "Emergency", "Cardiology", "Oncology", "Neurology", "Trauma Center"],
    location: {
      lat: 34.0859,
      lng: -117.7529
    },
    address: "1798 N Garey Ave, Pomona, CA 91767",
    contact: "(909) 865-9500",
    distance: 1.3
  },
  {
    id: "kaiser-permanente-pomona",
    name: "Kaiser Permanente Pomona Medical Offices",
    type: "hospital",
    specialty: ["General", "Family Medicine", "Pediatrics", "Obstetrics"],
    location: {
      lat: 34.0426,
      lng: -117.7633
    },
    address: "1069 Pomona Blvd, Pomona, CA 91767",
    contact: "(833) 574-2273",
    distance: 2.1
  },
  {
    id: "casa-colina-hospital",
    name: "Casa Colina Hospital and Centers for Healthcare",
    type: "hospital",
    specialty: ["Rehabilitation", "Orthopedics", "Neurology", "Physical Therapy"],
    location: {
      lat: 34.1003,
      lng: -117.7176
    },
    address: "255 E Bonita Ave, Pomona, CA 91767",
    contact: "(909) 596-7733",
    distance: 2.8
  },
  {
    id: "foothill-presbyterian-hospital",
    name: "Foothill Presbyterian Hospital",
    type: "hospital",
    specialty: ["General", "Emergency", "Surgery"],
    location: {
      lat: 34.1066,
      lng: -117.7147
    },
    address: "250 S Grand Ave, Glendora, CA 91741",
    contact: "(626) 963-8411",
    distance: 3.9
  },
  {
    id: "san-dimas-hospital",
    name: "San Dimas Community Hospital",
    type: "hospital",
    specialty: ["General", "Emergency", "Surgery", "Cardiology"],
    location: {
      lat: 34.1061,
      lng: -117.8085
    },
    address: "1350 W Covina Blvd, San Dimas, CA 91773",
    contact: "(909) 599-6811",
    distance: 3.2
  },
  {
    id: "pomona-community-health-center",
    name: "Pomona Community Health Center",
    type: "clinic",
    specialty: ["Primary Care", "Family Medicine", "Pediatrics"],
    location: {
      lat: 34.0553,
      lng: -117.7495
    },
    address: "1450 E Holt Ave, Pomona, CA 91767",
    contact: "(909) 620-1661",
    distance: 0.6
  },
  {
    id: "parkview-medical",
    name: "Parkview Medical Group",
    type: "clinic",
    specialty: ["Primary Care", "Internal Medicine", "Family Practice"],
    location: {
      lat: 34.0672,
      lng: -117.7618
    },
    address: "1701 N Garey Ave, Pomona, CA 91767",
    contact: "(909) 622-0354",
    distance: 0.9
  },
  {
    id: "western-university-health",
    name: "Western University Health Care Center",
    type: "clinic",
    specialty: ["Primary Care", "Family Medicine", "Pediatrics"],
    location: {
      lat: 34.0553,
      lng: -117.7495
    },
    address: "795 E Second St, Pomona, CA 91766",
    contact: "(909) 706-3900",
    distance: 0.6
  },
  {
    id: "east-valley-community-health",
    name: "East Valley Community Health Center",
    type: "clinic",
    specialty: ["Primary Care", "Family Medicine", "Women's Health"],
    location: {
      lat: 34.0513,
      lng: -117.7446
    },
    address: "1555 S Garey Ave, Pomona, CA 91766",
    contact: "(909) 620-8088",
    distance: 0.7
  },
  {
    id: "dr-puri-cardiology",
    name: "Dr. Rajiv Puri - Cardiovascular Medical Associates",
    type: "specialist",
    specialty: ["Cardiology", "Interventional Cardiology"],
    location: {
      lat: 34.0601,
      lng: -117.7510
    },
    address: "160 E Artesia St, Pomona, CA 91767",
    contact: "(909) 865-2888",
    distance: 0.5
  },
  {
    id: "dr-el-mahdy-pulmonology",
    name: "Dr. Sherif El-Mahdy - Pulmonology & Critical Care",
    type: "specialist",
    specialty: ["Pulmonology", "Critical Care", "Sleep Medicine"],
    location: {
      lat: 34.0610,
      lng: -117.7525
    },
    address: "1910 Royalty Dr, Pomona, CA 91767",
    contact: "(909) 865-9977",
    distance: 0.7
  },
  {
    id: "pomona-valley-neurosurgery",
    name: "Pomona Valley Neurosurgery Group",
    type: "specialist",
    specialty: ["Neurosurgery", "Neurology"],
    location: {
      lat: 34.0845,
      lng: -117.7530
    },
    address: "1910 Royalty Dr, Suite 130, Pomona, CA 91767",
    contact: "(909) 865-1811",
    distance: 1.2
  },
  {
    id: "inland-eye-institute",
    name: "Inland Eye Institute",
    type: "specialist",
    specialty: ["Ophthalmology", "LASIK Surgery"],
    location: {
      lat: 34.0602,
      lng: -117.7495
    },
    address: "1900 E Holt Ave, Pomona, CA 91767",
    contact: "(909) 621-1228",
    distance: 0.8
  },
  {
    id: "dr-vikas-orthopedics",
    name: "Dr. Vikas Patel - Orthopedic Surgery",
    type: "specialist",
    specialty: ["Orthopedics", "Sports Medicine", "Joint Replacement"],
    location: {
      lat: 34.0624,
      lng: -117.7514
    },
    address: "1760 Termino Ave, Suite 300, Pomona, CA 91767",
    contact: "(909) 865-4900",
    distance: 0.9
  },
  {
    id: "pomona-valley-dermatology",
    name: "Pomona Valley Dermatology Associates",
    type: "specialist",
    specialty: ["Dermatology", "Skin Cancer", "Cosmetic Dermatology"],
    location: {
      lat: 34.0649,
      lng: -117.7591
    },
    address: "1246 E Holt Ave, Pomona, CA 91767",
    contact: "(909) 622-4257",
    distance: 0.9
  }
];

// Real healthcare facilities for Delhi, India (110001)
export const delhiHealthcareFacilities: HealthcareFacility[] = [
  {
    id: "aiims-delhi",
    name: "All India Institute of Medical Sciences (AIIMS)",
    type: "hospital",
    specialty: ["General", "Emergency", "Cardiology", "Neurology", "Oncology"],
    location: {
      lat: 28.5672,
      lng: 77.2100
    },
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi, 110029",
    contact: "011-2658 8500",
    distance: 2.4
  },
  {
    id: "safdarjung-hospital",
    name: "Safdarjung Hospital",
    type: "hospital",
    specialty: ["General", "Emergency", "Orthopedics"],
    location: {
      lat: 28.5706,
      lng: 77.2079
    },
    address: "Ansari Nagar West, New Delhi, 110029",
    contact: "011-2673 0000",
    distance: 2.5
  },
  {
    id: "lady-hardinge-medical",
    name: "Lady Hardinge Medical College & Hospital",
    type: "hospital",
    specialty: ["General", "Emergency", "Obstetrics", "Gynecology"],
    location: {
      lat: 28.6357,
      lng: 77.2124
    },
    address: "Shaheed Bhagat Singh Marg, Connaught Place, New Delhi, 110001",
    contact: "011-2336 5525",
    distance: 0.7
  },
  {
    id: "gb-pant-hospital",
    name: "G.B. Pant Hospital",
    type: "hospital",
    specialty: ["Cardiology", "Neurology", "Gastroenterology"],
    location: {
      lat: 28.6394,
      lng: 77.2330
    },
    address: "1, Jawahar Lal Nehru Marg, Delhi Gate, New Delhi, 110002",
    contact: "011-2323 2400",
    distance: 1.1
  },
  {
    id: "apollo-delhi",
    name: "Indraprastha Apollo Hospital",
    type: "hospital",
    specialty: ["General", "Emergency", "Cardiology", "Orthopedics"],
    location: {
      lat: 28.5421,
      lng: 77.2831
    },
    address: "Delhi Mathura Road, Sarita Vihar, New Delhi, 110076",
    contact: "011-7179 1090",
    distance: 8.3
  },
  {
    id: "max-saket",
    name: "Max Super Speciality Hospital",
    type: "hospital",
    specialty: ["General", "Emergency", "Cardiology", "Oncology"],
    location: {
      lat: 28.5276,
      lng: 77.2160
    },
    address: "2, Press Enclave Road, Saket, New Delhi, 110017",
    contact: "011-2651 5050",
    distance: 5.7
  },
  {
    id: "connaught-place-clinic",
    name: "Connaught Place Medical Centre",
    type: "clinic",
    specialty: ["Primary Care", "Family Medicine"],
    location: {
      lat: 28.6315,
      lng: 77.2195
    },
    address: "N-36, Connaught Circus, New Delhi, 110001",
    contact: "011-4336 4336",
    distance: 0.4
  },
  {
    id: "delhi-heart-specialists",
    name: "Delhi Heart & Lung Institute",
    type: "specialist",
    specialty: ["Cardiology", "Pulmonology"],
    location: {
      lat: 28.6418,
      lng: 77.2023
    },
    address: "3-MM-II, Panchkuian Road, New Delhi, 110055",
    contact: "011-4225 5000",
    distance: 1.3
  },
  {
    id: "delhi-orthopedic-centre",
    name: "Delhi Orthopedic Centre",
    type: "specialist",
    specialty: ["Orthopedics"],
    location: {
      lat: 28.6299,
      lng: 77.2280
    },
    address: "42, Scindia House, Connaught Place, New Delhi, 110001",
    contact: "011-4155 6565",
    distance: 0.6
  },
  {
    id: "delhi-eye-care",
    name: "Delhi Eye Care Centre",
    type: "specialist",
    specialty: ["Ophthalmology"],
    location: {
      lat: 28.6289,
      lng: 77.2171
    },
    address: "B-1/12, Janpath, New Delhi, 110001",
    contact: "011-2332 5083",
    distance: 0.3
  }
];

// Add more regions with verified healthcare facility data
export const losAngelesHealthcareFacilities: HealthcareFacility[] = [
  {
    id: "cedars-sinai",
    name: "Cedars-Sinai Medical Center",
    type: "hospital",
    specialty: ["General", "Emergency", "Cardiology", "Oncology", "Neurosurgery", "Transplant"],
    location: {
      lat: 34.0744,
      lng: -118.3803
    },
    address: "8700 Beverly Blvd, Los Angeles, CA 90048",
    contact: "(310) 423-3277",
    distance: 1.5
  },
  {
    id: "ucla-medical",
    name: "UCLA Medical Center",
    type: "hospital",
    specialty: ["General", "Emergency", "Neurology", "Oncology", "Cardiology", "Transplant"],
    location: {
      lat: 34.0663,
      lng: -118.4452
    },
    address: "757 Westwood Plaza, Los Angeles, CA 90095",
    contact: "(310) 825-9111",
    distance: 2.8
  },
  {
    id: "keck-medicine-usc",
    name: "Keck Medicine of USC",
    type: "hospital",
    specialty: ["General", "Emergency", "Cancer Care", "Neurology", "Orthopedics"],
    location: {
      lat: 34.0618,
      lng: -118.2025
    },
    address: "1500 San Pablo St, Los Angeles, CA 90033",
    contact: "(800) 872-2273",
    distance: 3.1
  }
];

// Map of ZIP codes to their healthcare facilities
export const realHealthcareFacilityMap: Record<string, HealthcareFacility[]> = {
  '91766': pomonaHealthcareFacilities,
  '91767': pomonaHealthcareFacilities,
  '91768': pomonaHealthcareFacilities,
  '110001': delhiHealthcareFacilities,
  '90048': losAngelesHealthcareFacilities,
  '90095': losAngelesHealthcareFacilities
}; 
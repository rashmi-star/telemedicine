const API_URL = 'http://localhost:3001';

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic';
  specialty: string[];
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  contact: string;
  pincode: string;
}

export interface Condition {
  id: string;
  condition: string;
  confidence: number;
  recommendedSpecialties: string[];
  urgency: 'low' | 'medium' | 'high';
}

export const api = {
  async getFacilities(pincode?: string, specialty?: string): Promise<HealthcareFacility[]> {
    let url = `${API_URL}/healthcare_facilities`;
    const params = new URLSearchParams();
    
    if (pincode) params.append('pincode', pincode);
    if (specialty) params.append('specialty_like', specialty);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch facilities');
    return response.json();
  },

  async getConditions(): Promise<Condition[]> {
    const response = await fetch(`${API_URL}/conditions`);
    if (!response.ok) throw new Error('Failed to fetch conditions');
    return response.json();
  },

  async getSymptoms(): Promise<string[]> {
    const response = await fetch(`${API_URL}/symptoms`);
    if (!response.ok) throw new Error('Failed to fetch symptoms');
    return response.json();
  }
}; 
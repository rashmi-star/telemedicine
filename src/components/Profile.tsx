import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '../utils/authUtils';
import { User, LogOut, Settings, Save } from 'lucide-react';
import { mockMedicalProfile } from '../utils/mockData';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [medicalRecord, setMedicalRecord] = useState(mockMedicalProfile);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser({
          ...userData,
          displayName: 'Rashmi Elavazhagan' // Set mock display name
        });
        
        // Load saved medical record data if available, otherwise use mock data
        const savedRecord = localStorage.getItem(`medical_record_${userData?.id}`);
        if (savedRecord) {
          setMedicalRecord(JSON.parse(savedRecord));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMedicalRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveMedicalRecord = () => {
    if (user?.id) {
      localStorage.setItem(`medical_record_${user.id}`, JSON.stringify(medicalRecord));
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleResetToMockData = () => {
    setMedicalRecord(mockMedicalProfile);
    if (user?.id) {
      localStorage.setItem(`medical_record_${user.id}`, JSON.stringify(mockMedicalProfile));
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Not logged in</h2>
        <p className="text-gray-600 mb-4">
          Please log in to view your profile.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Your Medical Profile</h2>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-blue-100 rounded-full p-3">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{user.displayName || user.email}</h3>
            <p className="text-sm text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
        
        {showSuccessMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">Medical record saved successfully</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">ACCOUNT DETAILS</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium">{user.displayName || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email confirmed</span>
              <span className="text-sm font-medium">
                {user.email_confirmed_at ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account created</span>
              <span className="text-sm font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-medium text-gray-500">MEDICAL INFORMATION</h4>
            <button
              onClick={handleResetToMockData}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Reset to Default Data
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
              <input 
                type="text" 
                id="accountNumber" 
                name="accountNumber" 
                value={medicalRecord.accountNumber} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input 
                type="date" 
                id="dob" 
                name="dob" 
                value={medicalRecord.dob} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input 
                type="text" 
                id="age" 
                name="age" 
                value={medicalRecord.age} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex</label>
              <input 
                type="text" 
                id="sex" 
                name="sex" 
                value={medicalRecord.sex} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <h5 className="text-sm font-medium text-gray-700 mt-4 mb-2">Vitals</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label htmlFor="bp" className="block text-sm font-medium text-gray-700">Blood Pressure</label>
              <input 
                type="text" 
                id="bp" 
                name="bp" 
                placeholder="e.g., 120/80"
                value={medicalRecord.bp} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">Temperature</label>
              <input 
                type="text" 
                id="temperature" 
                name="temperature" 
                placeholder="e.g., 98.6 F"
                value={medicalRecord.temperature} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pulse" className="block text-sm font-medium text-gray-700">Pulse</label>
              <input 
                type="text" 
                id="pulse" 
                name="pulse" 
                value={medicalRecord.pulse} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="respiration" className="block text-sm font-medium text-gray-700">Respiration</label>
              <input 
                type="text" 
                id="respiration" 
                name="respiration" 
                value={medicalRecord.respiration} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height</label>
              <input 
                type="text" 
                id="height" 
                name="height" 
                placeholder="e.g., 5 ft 4 in"
                value={medicalRecord.height} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight</label>
              <input 
                type="text" 
                id="weight" 
                name="weight" 
                placeholder="e.g., 150 lbs"
                value={medicalRecord.weight} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bmi" className="block text-sm font-medium text-gray-700">BMI</label>
              <input 
                type="text" 
                id="bmi" 
                name="bmi" 
                value={medicalRecord.bmi} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <h5 className="text-sm font-medium text-gray-700 mt-4 mb-2">Medical History</h5>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">Allergies</label>
              <textarea 
                id="allergies" 
                name="allergies" 
                rows={2}
                value={medicalRecord.allergies} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="medications" className="block text-sm font-medium text-gray-700">Current Medications</label>
              <textarea 
                id="medications" 
                name="medications" 
                rows={2}
                value={medicalRecord.medications} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="conditions" className="block text-sm font-medium text-gray-700">Medical Conditions</label>
              <textarea 
                id="conditions" 
                name="conditions" 
                rows={2}
                value={medicalRecord.conditions} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional Notes</label>
              <textarea 
                id="notes" 
                name="notes" 
                rows={3}
                value={medicalRecord.notes} 
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleSaveMedicalRecord}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Medical Record
            </button>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          <button
            onClick={() => {/* Add settings handler */}}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}; 
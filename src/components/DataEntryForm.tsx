import React, { useState } from 'react';
import { medicalModel } from '../utils/mlModel';

interface FormData {
  symptoms: {
    fever: boolean;
    cough: boolean;
    fatigue: boolean;
    difficultyBreathing: boolean;
  };
  patientData: {
    age: number;
    gender: string;
    bloodPressure: string;
    cholesterolLevel: string;
  };
  disease: string;
}

export function DataEntryForm() {
  const [formData, setFormData] = useState<FormData>({
    symptoms: {
      fever: false,
      cough: false,
      fatigue: false,
      difficultyBreathing: false
    },
    patientData: {
      age: 0,
      gender: '',
      bloodPressure: 'Normal',
      cholesterolLevel: 'Normal'
    },
    disease: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.disease.trim()) {
        throw new Error('Please enter a disease name');
      }

      // Collect symptoms
      const symptoms: string[] = [];
      if (formData.symptoms.fever) symptoms.push('fever');
      if (formData.symptoms.cough) symptoms.push('cough');
      if (formData.symptoms.fatigue) symptoms.push('fatigue');
      if (formData.symptoms.difficultyBreathing) symptoms.push('difficulty breathing');

      if (symptoms.length === 0) {
        throw new Error('Please select at least one symptom');
      }

      // Update model with new data
      await medicalModel.updateDataset([{
        name: formData.disease.trim(),
        symptoms,
        specialty: 'General Practitioner', // Will be mapped based on disease
        age: formData.patientData.age,
        gender: formData.patientData.gender,
        outcome: 'Unknown'
      }]);
      
      setStatus('success');
      setMessage('Data added successfully! The model will now retrain.');

      // Reset form
      setFormData({
        symptoms: {
          fever: false,
          cough: false,
          fatigue: false,
          difficultyBreathing: false
        },
        patientData: {
          age: 0,
          gender: '',
          bloodPressure: 'Normal',
          cholesterolLevel: 'Normal'
        },
        disease: ''
      });

    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to add data');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Add Medical Data</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Symptoms:</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.symptoms.fever}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  symptoms: { ...prev.symptoms, fever: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Fever</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.symptoms.cough}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  symptoms: { ...prev.symptoms, cough: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Cough</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.symptoms.fatigue}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  symptoms: { ...prev.symptoms, fatigue: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Fatigue</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.symptoms.difficultyBreathing}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  symptoms: { ...prev.symptoms, difficultyBreathing: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Difficulty Breathing</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Patient Data:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.patientData.age}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  patientData: { ...prev.patientData, age: parseInt(e.target.value) || 0 }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                value={formData.patientData.gender}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  patientData: { ...prev.patientData, gender: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
              <select
                value={formData.patientData.bloodPressure}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  patientData: { ...prev.patientData, bloodPressure: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cholesterol Level</label>
              <select
                value={formData.patientData.cholesterolLevel}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  patientData: { ...prev.patientData, cholesterolLevel: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Disease</label>
          <input
            type="text"
            value={formData.disease}
            onChange={e => setFormData(prev => ({ ...prev, disease: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Enter disease name"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add Data & Train Model
        </button>
      </form>

      {status !== 'idle' && (
        <div className={`mt-4 p-4 rounded-lg ${
          status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
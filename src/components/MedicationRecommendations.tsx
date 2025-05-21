import React, { useState } from 'react';
import { Medication } from '../utils/medicationLoader';

interface MedicationRecommendationsProps {
  medications: Medication[];
  warnings: string[];
  disclaimer: string;
}

const MedicationRecommendations: React.FC<MedicationRecommendationsProps> = ({ 
  medications, 
  warnings, 
  disclaimer 
}) => {
  const [expandedMed, setExpandedMed] = useState<string | null>(null);

  if (medications.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-yellow-700 font-medium">
          No specific over-the-counter medication recommendations found for these symptoms.
        </p>
        <p className="text-yellow-600 text-sm mt-2">
          Please consult with a healthcare professional for personalized medical advice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <p className="text-red-700 text-sm font-medium">Important Medical Disclaimer</p>
        </div>
        <p className="text-red-600 text-xs mt-1">
          {disclaimer}
        </p>
      </div>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <h3 className="text-amber-700 font-medium text-sm mb-2">Important Considerations:</h3>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-amber-600 text-xs">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Medications List */}
      <h3 className="text-blue-700 font-medium">Possible First Aid Medications</h3>
      <div className="space-y-3">
        {medications.map((medication) => (
          <div 
            key={medication.id} 
            className="border border-blue-200 rounded-lg overflow-hidden"
          >
            {/* Medication Header */}
            <div 
              className="bg-blue-50 p-3 cursor-pointer flex justify-between items-center"
              onClick={() => setExpandedMed(expandedMed === medication.id ? null : medication.id)}
            >
              <div>
                <h4 className="font-bold text-blue-800">{medication.name}</h4>
                <p className="text-xs text-blue-600">{medication.category}</p>
              </div>
              <div className="text-blue-600">
                {expandedMed === medication.id ? '▲' : '▼'}
              </div>
            </div>
            
            {/* Medication Details (expandable) */}
            {expandedMed === medication.id && (
              <div className="p-3 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700">Adult Dosage</h5>
                    <p className="text-xs text-gray-600">{medication.dosageAdult}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700">Child Dosage</h5>
                    <p className="text-xs text-gray-600">{medication.dosageChild}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h5 className="text-sm font-semibold text-gray-700">Safety Notes</h5>
                  <p className="text-xs text-gray-600">{medication.safetyNotes}</p>
                </div>
                
                <div className="mt-3">
                  <h5 className="text-sm font-semibold text-red-600">Warnings</h5>
                  <p className="text-xs text-red-500">{medication.warnings}</p>
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700">Side Effects</h5>
                    <p className="text-xs text-gray-600">{medication.sideEffects}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700">Not Recommended For</h5>
                    <p className="text-xs text-gray-600">{medication.contraindications}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h5 className="text-sm font-semibold text-gray-700">Used For</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {medication.symptoms.map((symptom, i) => (
                      <span 
                        key={i} 
                        className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicationRecommendations; 
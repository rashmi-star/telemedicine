import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { pdfjs, extractTextFromPdf as extractPdfText } from '../utils/pdfSetup';
import { getLlamaCompletion, getAirQualityData } from '../utils/llamaApi';

interface AnalysisResult {
  title: string;
  patient: {
    name: string;
    id: string;
    age: string;
    gender: string;
    dateOfBirth?: string;
  };
  date: string;
  findings: string[];
  diagnosis: string[];
  recommendations: string[];
  medications: string[];
  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
  }>;
  environmentalWarnings: string[];
  vitalSigns?: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
  }>;
}

export function MedicalDocumentAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [location, setLocation] = useState<string>('');
  const [showLocationInput, setShowLocationInput] = useState<boolean>(false);
  const [hasEnvironmentalWarnings, setHasEnvironmentalWarnings] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract text from PDF files
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      console.log("PDF file received, size:", file.size, "bytes");
      
      // Use the enhanced centralized PDF extraction utility
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractPdfText(arrayBuffer);
      
      console.log("Successfully extracted PDF text, length:", extractedText.length);
      return extractedText;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      
      // Fallback to simple text extraction
      try {
        const text = await file.text();
        console.log("Falling back to basic text extraction, length:", text.length);
        return text || "No text content could be extracted from the file";
      } catch (innerError) {
        console.error("Fallback text extraction also failed:", innerError);
        throw new Error("Failed to extract text from the document");
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setExtractedText(null);

    try {
      // Extract text from the uploaded file
      let extractedContent = '';
      
      if (file.type === 'application/pdf') {
        extractedContent = await extractTextFromPdf(file);
      } else if (file.type === 'application/json') {
        const jsonContent = await file.text();
        extractedContent = `JSON CONTENT:\n${jsonContent}`;
      } else if (file.type === 'text/csv') {
        const csvContent = await file.text();
        extractedContent = `CSV CONTENT:\n${csvContent}`;
      } else {
        extractedContent = await file.text();
      }
      
      setExtractedText(extractedContent);
      
      if (!extractedContent || extractedContent.trim().length < 10) {
        throw new Error("Could not extract meaningful text from the document. Please try another file.");
      }
      
      setShowLocationInput(true);
      
    } catch (error) {
      setIsAnalyzing(false);
      setError(error instanceof Error ? error.message : 'Failed to analyze medical document');
    }
  };
  
  // Handle location input
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };
  
  // Analyze document with environmental factors
  const analyzeDocument = async () => {
    if (!extractedText) return;
    
    try {
      setIsAnalyzing(true);
      
      // Get air quality data if location is provided
      let airQualityData = null;
      if (location) {
        try {
          airQualityData = await getAirQualityData(location);
          console.log("Retrieved air quality data:", airQualityData);
        } catch (airQualityError) {
          console.error("Failed to get air quality data:", airQualityError);
        }
      }
      
      // Create a comprehensive prompt for the LLM
      const prompt = `
        I need you to analyze this medical document and extract key information.
        Extract patient details, medical findings, diagnoses, lab values, and recommendations.
        
        CRITICAL - PATIENT IDENTIFICATION:
        - Thoroughly search the ENTIRE document for patient identifying information
        - Look for patterns like "Patient: [Name]", "Name: [Name]", "Patient Name: [Name]"
        - Extract full name, date of birth, patient ID, medical record number, gender, and age
        - Look for date patterns in various formats for both document date and patient DOB
        - DO NOT miss any patient demographic details - this is the highest priority
        
        ${location && airQualityData ? `Also, consider environmental factors in the patient's location. The current air quality index (AQI) is ${airQualityData.aqi} (${airQualityData.category}). Provide specific warnings if the patient's condition could be affected by air quality.` : ''}
        
        The document content is:
        ${extractedText}
        
        Return your analysis as a JSON object with the following structure:
        {
          "title": "Document title or type",
          "patient": {
            "name": "Patient name - EXACT as in document",
            "id": "Patient ID if available",
            "age": "Patient age",
            "gender": "Patient gender",
            "dateOfBirth": "DOB if available"
          },
          "date": "Date of the document/examination",
          "findings": ["Finding 1", "Finding 2", ...],
          "diagnosis": ["Diagnosis 1", "Diagnosis 2", ...],
          "recommendations": ["Recommendation 1", "Recommendation 2", ...],
          "medications": ["Medication 1", "Medication 2", ...],
          "labValues": [
            {
              "name": "Lab test name",
              "value": "Value",
              "unit": "Unit of measurement",
              "normalRange": "Normal range",
              "isAbnormal": true/false
            }
          ],
          "vitalSigns": [
            {
              "name": "Vital sign name",
              "value": "Value",
              "unit": "Unit of measurement",
              "normalRange": "Normal range",
              "isAbnormal": true/false
            }
          ],
          "environmentalWarnings": [
            "Warning about environmental impact on condition"
          ]
        }
        
        Extract the EXACT values from the document. If information is not present, use empty arrays or "Unknown" strings.
        For lab values and vital signs, indicate if values are abnormal (outside normal range).
      `;
      
      // Call LLM for document analysis
      const llamaResponse = await getLlamaCompletion(prompt, {
        includeEnvironmentalFactors: true,
        extractMedicalData: true,
        includeContextualData: airQualityData ? { airQuality: airQualityData } : undefined
      });
      
      console.log("LLM response received, parsing...");
      
      try {
        // Parse the LLM response
        const parsedResult = JSON.parse(llamaResponse);
        console.log("Successfully parsed LLM response:", parsedResult);
        
        // Check if there are environmental warnings
        const hasWarnings = parsedResult.environmentalWarnings && 
                           parsedResult.environmentalWarnings.length > 0 && 
                           parsedResult.environmentalWarnings.some((w: string) => w !== "None" && w !== "Unknown");
        
        setHasEnvironmentalWarnings(hasWarnings);
        setAnalysisResult(parsedResult);
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError);
        setError("Failed to parse the analysis results. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing document:", error);
      setError(error instanceof Error ? error.message : 'Failed to analyze medical document');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Medical Document Analyzer</h2>
      
      {/* File Upload Section */}
      <div className="mb-8">
        <div 
          onClick={handleUploadClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isAnalyzing ? 'bg-gray-100 border-gray-300' : 'border-blue-300 hover:bg-blue-50'}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.csv,.json"
            className="hidden"
            disabled={isAnalyzing}
          />
          
          <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            {isAnalyzing ? 'Processing document...' : 'Upload a medical document for analysis'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: PDF, TXT, CSV, JSON
          </p>
        </div>
      </div>
      
      {/* Location Input (appears after document upload) */}
      {showLocationInput && !analysisResult && (
        <div className="mb-8">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your location for environmental analysis (city name or ZIP code):
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              id="location"
              value={location}
              onChange={handleLocationChange}
              placeholder="e.g., New York or 10001"
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={analyzeDocument}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <span className="flex items-center">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "Analyze Document"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This helps us provide context-specific recommendations based on local environmental factors.
          </p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 rounded-md border border-red-200">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Analysis Results */}
      {analysisResult && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{analysisResult.title || "Document Analysis"}</h3>
          
          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p><span className="font-medium">Name:</span> {analysisResult.patient.name || "Unknown"}</p>
              <p><span className="font-medium">ID:</span> {analysisResult.patient.id || "Unknown"}</p>
              <p><span className="font-medium">Age:</span> {analysisResult.patient.age || "Unknown"}</p>
              <p><span className="font-medium">Gender:</span> {analysisResult.patient.gender || "Unknown"}</p>
              {analysisResult.patient.dateOfBirth && (
                <p><span className="font-medium">Date of Birth:</span> {analysisResult.patient.dateOfBirth}</p>
              )}
              <p><span className="font-medium">Document Date:</span> {analysisResult.date || "Unknown"}</p>
            </div>
          </div>
          
          {/* Environmental Warnings */}
          {hasEnvironmentalWarnings && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-lg font-medium text-yellow-800 mb-2">Environmental Health Alerts</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResult.environmentalWarnings.map((warning, index) => (
                      warning !== "None" && warning !== "Unknown" && (
                        <li key={index} className="text-yellow-700">{warning}</li>
                      )
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Findings & Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Findings</h4>
              {analysisResult.findings && analysisResult.findings.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.findings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No findings listed</p>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Diagnosis</h4>
              {analysisResult.diagnosis && analysisResult.diagnosis.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.diagnosis.map((diagnosis, index) => (
                    <li key={index}>{diagnosis}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No diagnoses listed</p>
              )}
            </div>
          </div>
          
          {/* Lab Values */}
          {analysisResult.labValues && analysisResult.labValues.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-700 mb-2">Lab Values</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Range</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResult.labValues.map((labValue, index) => (
                      <tr key={index} className={labValue.isAbnormal ? "bg-red-50" : ""}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{labValue.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{labValue.value}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{labValue.unit}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{labValue.normalRange}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {labValue.isAbnormal ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Abnormal
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Recommendations & Medications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Recommendations</h4>
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No recommendations listed</p>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Medications</h4>
              {analysisResult.medications && analysisResult.medications.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.medications.map((medication, index) => (
                    <li key={index}>{medication}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No medications listed</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Reset Button (shows after analysis) */}
      {analysisResult && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setAnalysisResult(null);
              setExtractedText(null);
              setError(null);
              setLocation('');
              setShowLocationInput(false);
              setHasEnvironmentalWarnings(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Analyze Another Document
          </button>
        </div>
      )}
    </div>
  );
} 
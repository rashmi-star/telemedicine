import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Loader } from 'lucide-react';
import { pdfjs, extractTextFromPdf as extractPdfText } from '../utils/pdfSetup';
import { getLlamaCompletion } from '../utils/llamaApi';

// Define blood count reference ranges
const referenceRanges = {
  rbc: { min: 4.5, max: 5.9, unit: 'million/μL' },
  wbc: { min: 4.5, max: 11.0, unit: '×10^9/L' },
  hemoglobin: { min: 13.5, max: 17.5, unit: 'g/dL' },
  hematocrit: { min: 41, max: 50, unit: '%' },
  platelets: { min: 150, max: 450, unit: '×10^9/L' },
  neutrophils: { min: 40, max: 60, unit: '%' },
  lymphocytes: { min: 20, max: 40, unit: '%' },
  monocytes: { min: 2, max: 8, unit: '%' },
  eosinophils: { min: 1, max: 4, unit: '%' },
  basophils: { min: 0.5, max: 1, unit: '%' },
  mcv: { min: 80, max: 100, unit: 'fL' },
  mch: { min: 27, max: 31, unit: 'pg' },
  mchc: { min: 32, max: 36, unit: 'g/dL' },
  rdw: { min: 11.5, max: 14.5, unit: '%' }
};

interface BloodParameter {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'high' | 'low' | 'unknown';
  displayName: string;
}

interface AnalysisResult {
  patientInfo: {
    name: string;
    date: string;
    additionalInfo: string;
  };
  parameters: BloodParameter[];
  summary: string;
  recommendations: string[];
  insights: string;
  conditions: string[];
  specialists: string[];
}

export function BloodCountAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [llamaRawResponse, setLlamaRawResponse] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

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
      
      // Fallback to simple text extraction if PDF.js fails
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setExtractedText(null);
    setLlamaRawResponse(null);

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
      
      // Send the extracted content to Llama for analysis
      const llamaPrompt = `
        I need you to analyze this complete blood count (CBC) report and provide insights. 
        Extract all parameter values, determine which ones are outside normal ranges, 
        provide a summary of findings, potential conditions, and specialist recommendations.
        
        CRITICAL: Look throughout the ENTIRE document and extract the EXACT patient information. This is of highest priority.
        - Look for patterns like "Patient: [Name]", "Name: [Name]", "Patient Name: [Name]" 
        - Look for date patterns in various formats (MM/DD/YYYY, DD/MM/YYYY, etc.) 
        - Extract any patient ID, medical record number, or other identifiers
        - Find date of birth (DOB) information
        - Extract gender, age, and other demographic details
        
        DO NOT SKIP or MISS any patient identifying information. This is the most important part of your analysis.
        
        The document content is:
        ${extractedContent}
        
        Return your analysis as a JSON object with EXACTLY the following structure:
        {
          "patient_info": {
            "name": "Extracted patient name exactly as it appears",
            "date": "Extracted report date exactly as it appears",
            "additional_info": "Any other patient details from the report such as DOB, ID, gender, age, etc."
          },
          "parameters": [
            {"name": "parameter_name", "value": numeric_value, "unit": "unit_exactly_as_in_document", "status": "normal|high|low", "displayName": "Human readable name"}
          ],
          "summary": "Brief summary of findings",
          "recommendations": ["Recommendation 1", "Recommendation 2"],
          "insights": "Detailed analysis of what these results might indicate",
          "conditions": ["Possible condition 1", "Possible condition 2"],
          "specialists": ["Recommended specialist 1", "Recommended specialist 2"]
        }
        
        Extract the EXACT values from the document. Do not round numbers or change units.
        If a value for a parameter isn't present in the document, don't include it in the parameters array.
      `;
      
      console.log("Sending data to Llama API...");
      const llamaResponse = await getLlamaCompletion(llamaPrompt, {
        extractMedicalData: true
      });
      setLlamaRawResponse(llamaResponse);
      
      try {
        // Parse the Llama response
        const llamaResult = JSON.parse(llamaResponse);
        console.log("Successfully parsed Llama response:", llamaResult);
        
        // Create the final analysis result
        const result: AnalysisResult = {
          patientInfo: llamaResult.patient_info || { name: "Unknown", date: "Unknown", additionalInfo: "" },
          parameters: llamaResult.parameters || processParametersFromText(extractedContent),
          summary: llamaResult.summary || "Analysis completed using AI.",
          recommendations: llamaResult.recommendations || [],
          insights: llamaResult.insights || "",
          conditions: llamaResult.conditions || [],
          specialists: llamaResult.specialists || []
        };
        
        setAnalysisResult(result);
      } catch (parseError) {
        console.error("Error parsing Llama response:", parseError);
        setError(`The AI response could not be properly parsed. Raw response: ${llamaResponse.substring(0, 100)}...`);
        
        // Fall back to default processing if Llama response parsing fails
        const defaultResult = processDefaultAnalysis(extractedContent);
        setAnalysisResult(defaultResult);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze blood count report');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Process parameters from the extracted text if Llama fails
  const processParametersFromText = (text: string): BloodParameter[] => {
    console.log("Fallback: Processing parameters from extracted text");
    const parameters: BloodParameter[] = [];
    
    // Try to extract actual values from the text using regex
    const patterns = {
      rbc: /RBC:?\s*(\d+\.?\d*)\s*(million\/μL|10\^6\/μL|million cells\/mcL)/i,
      wbc: /WBC:?\s*(\d+\.?\d*)\s*(×10\^9\/L|10\^3\/μL|K\/μL|thousand\/μL)/i,
      hemoglobin: /H[ae]moglobin:?\s*(\d+\.?\d*)\s*(g\/dL|g%)/i,
      hematocrit: /H[ae]matocrit:?\s*(\d+\.?\d*)\s*(%)/i,
      platelets: /Platelets:?\s*(\d+)\s*(×10\^9\/L|10\^3\/μL|K\/μL|thousand\/μL)/i,
      neutrophils: /Neutrophils:?\s*(\d+\.?\d*)\s*(%)/i,
      lymphocytes: /Lymphocytes:?\s*(\d+\.?\d*)\s*(%)/i,
      monocytes: /Monocytes:?\s*(\d+\.?\d*)\s*(%)/i,
      eosinophils: /Eosinophils:?\s*(\d+\.?\d*)\s*(%)/i,
      basophils: /Basophils:?\s*(\d+\.?\d*)\s*(%)/i,
      mcv: /MCV:?\s*(\d+\.?\d*)\s*(fL)/i,
      mch: /MCH:?\s*(\d+\.?\d*)\s*(pg)/i,
      mchc: /MCHC:?\s*(\d+\.?\d*)\s*(g\/dL|%)/i,
      rdw: /RDW:?\s*(\d+\.?\d*)\s*(%)/i
    };
    
    // Map of parameter keys to display names
    const displayNames: Record<string, string> = {
      rbc: 'Red Blood Cells',
      wbc: 'White Blood Cells',
      hemoglobin: 'Hemoglobin',
      hematocrit: 'Hematocrit',
      platelets: 'Platelets',
      neutrophils: 'Neutrophils',
      lymphocytes: 'Lymphocytes',
      monocytes: 'Monocytes',
      eosinophils: 'Eosinophils',
      basophils: 'Basophils',
      mcv: 'Mean Corpuscular Volume',
      mch: 'Mean Corpuscular Hemoglobin',
      mchc: 'MCHC',
      rdw: 'RDW'
    };
    
    // Extract values for each parameter
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const unit = match[2] || referenceRanges[key as keyof typeof referenceRanges]?.unit || '';
        const range = referenceRanges[key as keyof typeof referenceRanges];
        
        // Determine status based on reference ranges
        let status: 'normal' | 'high' | 'low' | 'unknown' = 'unknown';
        if (range) {
          status = value < range.min ? 'low' : value > range.max ? 'high' : 'normal';
        }
        
        parameters.push({
          name: key,
          displayName: displayNames[key] || key,
          value,
          unit,
          status
        });
      }
    }
    
    return parameters;
  };
  
  // Extract patient info from text
  const extractPatientInfo = (text: string): { name: string; date: string; additionalInfo: string } => {
    const nameMatch = text.match(/Patient:?\s*([^\n]+)/i) || 
                     text.match(/Name:?\s*([^\n]+)/i) ||
                     text.match(/Patient Name:?\s*([^\n]+)/i);
                     
    const dateMatch = text.match(/Date:?\s*([^\n]+)/i) || 
                     text.match(/Report Date:?\s*([^\n]+)/i) ||
                     text.match(/Collection Date:?\s*([^\n]+)/i);
    
    const dobMatch = text.match(/DOB:?\s*([^\n]+)/i) ||
                    text.match(/Date of Birth:?\s*([^\n]+)/i);
                    
    const idMatch = text.match(/ID:?\s*([^\n]+)/i) ||
                   text.match(/Patient ID:?\s*([^\n]+)/i);
    
    let additionalInfo = "";
    if (dobMatch) additionalInfo += `DOB: ${dobMatch[1].trim()}\n`;
    if (idMatch) additionalInfo += `ID: ${idMatch[1].trim()}`;
    
    return {
      name: nameMatch ? nameMatch[1].trim() : "Unknown",
      date: dateMatch ? dateMatch[1].trim() : "Unknown",
      additionalInfo: additionalInfo.trim()
    };
  };

  // Fallback analysis when Llama API fails
  const processDefaultAnalysis = (extractedContent: string): AnalysisResult => {
    console.log("Fallback: Processing default analysis");
    const parameters = processParametersFromText(extractedContent);
    const patientInfo = extractPatientInfo(extractedContent);
    const abnormalParams = parameters.filter(p => p.status !== 'normal');
    
    let summary = 'Complete Blood Count analysis completed.';
    if (abnormalParams.length === 0) {
      summary += ' All parameters are within normal range.';
    } else {
      summary += ` Found ${abnormalParams.length} parameters outside normal range.`;
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    const conditions: string[] = [];
    const specialists: string[] = [];
    
    // Check for high WBC
    if (parameters.find(p => p.name === 'wbc')?.status === 'high') {
      recommendations.push('Elevated white blood cell count may indicate infection, inflammation, or certain types of leukemia. Follow-up with your healthcare provider is recommended.');
      conditions.push('Possible infection or inflammation');
      specialists.push('Hematologist');
    }
    
    // Check for low hemoglobin
    if (parameters.find(p => p.name === 'hemoglobin')?.status === 'low') {
      recommendations.push('Low hemoglobin levels suggest anemia. Consider dietary changes to increase iron intake and consult with a healthcare provider.');
      conditions.push('Possible anemia');
      specialists.push('Hematologist');
    }
    
    // If all normal, add general recommendation
    if (recommendations.length === 0) {
      recommendations.push('Your blood count values appear normal. Continue with regular health check-ups as recommended by your healthcare provider.');
      specialists.push('General Practitioner');
    }
    
    return {
      patientInfo,
      parameters,
      summary,
      recommendations,
      insights: `Based on ${patientInfo.name}'s complete blood count from ${patientInfo.date}, the analysis indicates some values that may require attention. Please consult with a healthcare professional for a complete diagnosis.`,
      conditions,
      specialists
    };
  };

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Blood Count Report Analyzer</h2>
        <button 
          onClick={toggleDebugMode}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {isDebugMode ? "Hide Debug Info" : "Show Debug Info"}
        </button>
      </div>
      
      <div className="space-y-4">
        {!analysisResult && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".csv,.txt,.pdf,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="blood-report-upload"
              disabled={isAnalyzing}
            />
            <label
              htmlFor="blood-report-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              {isAnalyzing ? (
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {isAnalyzing ? 'Analyzing with Llama AI...' : 'Click to upload your Complete Blood Count report'}
              </span>
              <div className="text-xs text-gray-500">
                <p>Supported formats: PDF, CSV, TXT, JSON</p>
                <p>Your data is analyzed using Llama AI for precise results</p>
              </div>
            </label>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg flex items-center space-x-2 bg-red-50 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {isDebugMode && extractedText && (
          <div className="p-4 rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">Extracted Document Content</h3>
            <pre className="text-xs whitespace-pre-wrap text-gray-600 border border-gray-200 p-2 rounded max-h-60 overflow-auto">{extractedText}</pre>
          </div>
        )}
        
        {isDebugMode && llamaRawResponse && (
          <div className="p-4 rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">Raw Llama API Response</h3>
            <pre className="text-xs whitespace-pre-wrap text-gray-600 border border-gray-200 p-2 rounded max-h-60 overflow-auto">{llamaRawResponse}</pre>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">Patient Information</h3>
              <div className="text-blue-700">
                <p><span className="font-medium">Name:</span> {analysisResult.patientInfo.name}</p>
                <p><span className="font-medium">Date:</span> {analysisResult.patientInfo.date}</p>
                {analysisResult.patientInfo.additionalInfo && (
                  <p><span className="font-medium">Additional Info:</span> {analysisResult.patientInfo.additionalInfo}</p>
                )}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">Analysis Summary</h3>
              <p className="text-blue-700">{analysisResult.summary}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Range</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisResult.parameters.map((param, idx) => (
                    <tr key={`${param.name}-${idx}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{param.displayName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.value} {param.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {referenceRanges[param.name as keyof typeof referenceRanges]?.min} - {referenceRanges[param.name as keyof typeof referenceRanges]?.max} {param.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${param.status === 'normal' ? 'bg-green-100 text-green-800' : 
                            param.status === 'high' ? 'bg-red-100 text-red-800' : 
                            param.status === 'low' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {param.status.charAt(0).toUpperCase() + param.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">AI Insights</h3>
              <p className="text-blue-700">{analysisResult.insights}</p>
            </div>
            
            {analysisResult.conditions.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50">
                <h3 className="font-semibold text-yellow-800 mb-2">Possible Conditions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.conditions.map((condition, index) => (
                    <li key={index} className="text-yellow-700">{condition}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.specialists.length > 0 && (
              <div className="p-4 rounded-lg bg-purple-50">
                <h3 className="font-semibold text-purple-800 mb-2">Recommended Specialists</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.specialists.map((specialist, index) => (
                    <li key={index} className="text-purple-700">{specialist}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="p-4 rounded-lg bg-green-50">
              <h3 className="font-semibold text-green-800 mb-2">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1">
                {analysisResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-green-700">{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setError(null);
                  setExtractedText(null);
                  setLlamaRawResponse(null);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Analyze Another Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
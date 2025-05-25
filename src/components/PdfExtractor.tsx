import React, { useState, useRef } from 'react';
import { getLlamaCompletion } from '../utils/llamaApi';
import { pdfjs } from '../utils/pdfSetup';

interface ExtractedData {
  patient?: {
    name?: string;
    id?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  parameters?: Array<{
    name: string;
    value: string | number;
    unit: string;
    referenceRange?: string;
    status: 'high' | 'low' | 'normal';
  }>;
  diagnosis?: string[] | string;
  documentType?: string;
  [key: string]: any;
}

const PdfExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractionType, setExtractionType] = useState<string>('general');
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sampleText, setSampleText] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedText('');
      setExtractedData(null);
      setError('');
      setSampleText('');
    }
  };

  // Handle extraction type selection
  const handleExtractionTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setExtractionType(event.target.value);
  };

  // Extract text from PDF file
  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    try {
      console.log("PDF file received, size:", pdfFile.size, "bytes");
      
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      
      console.log("Successfully extracted PDF text, length:", fullText.length);
      return fullText || "No text content could be extracted from the file";
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from the document");
    }
  };

  // Analyze PDF text with Llama API
  const analyzePdfText = async (pdfText: string): Promise<string> => {
    // Build the system message based on extraction type
    let prompt = '';
    
    switch (extractionType) {
      case 'medical':
        prompt = `
          I have a medical document that I need you to analyze. Please extract all key information including:
          - Patient information (name, ID, DOB, gender, etc.)
          - Lab values and test results with their normal ranges
          - Diagnoses and medical conditions
          - Treatments and recommendations
          - Any abnormal findings or values
          
          Return the information in a clear, structured JSON format with appropriate sections.
          
          Here is the document content:
          ${pdfText}
        `;
        break;
        
      case 'blood':
        prompt = `
          I have a blood test report that I need you to analyze. Please extract:
          - All CBC parameters (WBC, RBC, Hemoglobin, Hematocrit, Platelets, etc.)
          - Their values and units
          - The reference/normal ranges
          - Flag any abnormal values as high, low, or normal
          
          Return the information in a structured JSON format with a 'parameters' array containing objects with name, value, unit, referenceRange, and status properties.
          
          Here is the document content:
          ${pdfText}
        `;
        break;
        
      default:
        // General extraction
        prompt = `
          I have a document that I need you to analyze. Please extract all key information and provide a structured summary.
          Identify the type of document first, then extract relevant information based on the document type.
          
          Return the information in a clear, structured JSON format with appropriate sections.
          
          Here is the document content:
          ${pdfText}
        `;
    }
    
    // Call Llama API
    const response = await getLlamaCompletion(prompt, {
      extractMedicalData: true
    });
    
    return response;
  };

  // Extract JSON from Llama response
  const extractJsonFromResponse = (response: string): ExtractedData => {
    try {
      // First try to parse as is (might already be valid JSON)
      return JSON.parse(response);
    } catch (e) {
      try {
        // Look for JSON object pattern
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonCandidate = jsonMatch[0];
          // Verify it's valid JSON
          return JSON.parse(jsonCandidate);
        }
        
        // Try another approach - look for a code block with JSON
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          const jsonCandidate = codeBlockMatch[1];
          // Verify it's valid JSON
          return JSON.parse(jsonCandidate);
        }
      } catch (e2) {
        // If we can't parse, return raw text
        return { raw_text: response };
      }
      
      // If we couldn't extract JSON, return raw text
      return { raw_text: response };
    }
  };

  // Handle extraction process
  const handleExtract = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Extract text from PDF
      const pdfText = await extractTextFromPdf(file);
      setExtractedText(pdfText);
      
      // Show sample of extracted text
      setSampleText(pdfText.substring(0, 500) + (pdfText.length > 500 ? '...' : ''));
      
      // Analyze PDF text
      const analysisResult = await analyzePdfText(pdfText);
      
      // Extract structured data
      const structuredData = extractJsonFromResponse(analysisResult);
      setExtractedData(structuredData);
      
    } catch (error) {
      console.error("Error in extraction process:", error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Render extracted data
  const renderExtractedData = () => {
    if (!extractedData) return null;
    
    if (extractedData.raw_text) {
      return (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Extracted Data (Raw):</h3>
          <pre className="whitespace-pre-wrap text-sm">{extractedData.raw_text}</pre>
        </div>
      );
    }
    
    switch (extractionType) {
      case 'medical':
        return (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Medical Report Analysis:</h3>
            
            {extractedData.patient && (
              <div className="mb-4">
                <h4 className="font-medium">Patient Information:</h4>
                <ul className="ml-4">
                  <li>Name: {extractedData.patient.name || 'Not found'}</li>
                  {extractedData.patient.id && <li>ID: {extractedData.patient.id}</li>}
                  {extractedData.patient.dateOfBirth && <li>DOB: {extractedData.patient.dateOfBirth}</li>}
                  {extractedData.patient.gender && <li>Gender: {extractedData.patient.gender}</li>}
                </ul>
              </div>
            )}
            
            {extractedData.diagnosis && (
              <div className="mb-4">
                <h4 className="font-medium">Diagnoses:</h4>
                <ul className="ml-4">
                  {(Array.isArray(extractedData.diagnosis) ? 
                    extractedData.diagnosis : [extractedData.diagnosis]).map((diagnosis, i) => (
                    <li key={i}>{diagnosis}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Render any other medical report sections */}
            {Object.entries(extractedData)
              .filter(([key]) => !['patient', 'diagnosis', 'raw_text'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h4 className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</h4>
                  <pre className="whitespace-pre-wrap text-sm ml-4">{JSON.stringify(value, null, 2)}</pre>
                </div>
              ))
            }
          </div>
        );
        
      case 'blood':
        return (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Blood Test Results:</h3>
            
            {extractedData.parameters && extractedData.parameters.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Parameter</th>
                    <th className="border p-2 text-left">Value</th>
                    <th className="border p-2 text-left">Reference Range</th>
                    <th className="border p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.parameters.map((param, i) => (
                    <tr key={i} className={
                      param.status === 'high' ? 'bg-red-100' : 
                      param.status === 'low' ? 'bg-blue-100' : ''
                    }>
                      <td className="border p-2">{param.name}</td>
                      <td className="border p-2">{param.value} {param.unit}</td>
                      <td className="border p-2">{param.referenceRange || 'N/A'}</td>
                      <td className="border p-2">
                        {param.status === 'high' && <span className="text-red-600">⬆️ HIGH</span>}
                        {param.status === 'low' && <span className="text-blue-600">⬇️ LOW</span>}
                        {param.status === 'normal' && <span className="text-green-600">✓ Normal</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No parameters found in the extraction</p>
            )}
            
            {/* Render any other blood test sections */}
            {Object.entries(extractedData)
              .filter(([key]) => key !== 'parameters' && key !== 'raw_text')
              .map(([key, value]) => (
                <div key={key} className="mt-4">
                  <h4 className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</h4>
                  <pre className="whitespace-pre-wrap text-sm ml-4">{JSON.stringify(value, null, 2)}</pre>
                </div>
              ))
            }
          </div>
        );
        
      default:
        return (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              {extractedData.documentType ? 
                `${extractedData.documentType} Analysis:` : 
                'Document Analysis:'}
            </h3>
            
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(extractedData, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">PDF Data Extractor</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select a PDF file:
          </label>
          <div className="flex items-center">
            <button
              onClick={handleUploadClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Choose File
            </button>
            <span className="ml-3 text-gray-600">
              {file ? file.name : 'No file selected'}
            </span>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="extraction-type" className="block text-sm font-medium text-gray-700 mb-2">
            Extraction Type:
          </label>
          <select
            id="extraction-type"
            value={extractionType}
            onChange={handleExtractionTypeChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="general">General (Auto-detect)</option>
            <option value="medical">Medical Report</option>
            <option value="blood">Blood Test Results</option>
          </select>
        </div>
        
        <button
          onClick={handleExtract}
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded-md font-medium text-white ${
            !file || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          } transition-colors`}
        >
          {loading ? 'Extracting...' : 'Extract Data'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
          </div>
        )}
        
        {sampleText && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Extracted Text Sample:</h3>
            <div className="p-3 bg-gray-100 rounded-md text-sm font-mono max-h-60 overflow-y-auto">
              {sampleText}
            </div>
          </div>
        )}
        
        {renderExtractedData()}
      </div>
    </div>
  );
};

export default PdfExtractor; 
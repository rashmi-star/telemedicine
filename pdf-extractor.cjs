// PDF Data Extractor using Llama API
const fs = require('fs');
const path = require('path');
const { fetch } = require('undici');
const readline = require('readline');

// Try to load PDF.js - we'll use dynamic import since it's ESM
let pdfjs = null;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Llama API key
const apiKey = "LLM|1050039463644017|ZZzxjun1klZ76kW0xu5Zg4BW5-o";

// Function to extract text from PDF using pdfjs
async function extractTextFromPdf(pdfPath) {
  try {
    console.log(`\nExtracting text from PDF: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      console.error(`File not found: ${pdfPath}`);
      return null;
    }
    
    // Check if we need to install pdfjs-dist
    try {
      if (!pdfjs) {
        console.log("Trying to load pdfjs-dist...");
        try {
          // Check if pdfjs-dist is installed
          require.resolve('pdfjs-dist');
          
          // Use dynamic import for ESM module
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
          pdfjs = pdfjsLib.default;
        } catch (err) {
          console.log("pdfjs-dist not found. Please install it using: npm install pdfjs-dist");
          console.log("For now, using basic extraction method...");
          return extractTextUsingBasicMethod(pdfPath);
        }
      }
      
      // Read the PDF file
      const data = fs.readFileSync(pdfPath);
      
      // Parse the PDF
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      }
      
      console.log(`✅ Successfully extracted text from PDF (${fullText.length} characters)`);
      return fullText;
    } catch (error) {
      console.error("Error extracting text using PDF.js:", error);
      
      // Fall back to basic extraction
      console.log("Falling back to basic extraction method...");
      return extractTextUsingBasicMethod(pdfPath);
    }
  } catch (error) {
    console.error("Error in PDF extraction:", error);
    return null;
  }
}

// Fallback extraction method
function extractTextUsingBasicMethod(pdfPath) {
  try {
    // Simply read the file as a buffer for identification
    const buffer = fs.readFileSync(pdfPath);
    
    // Check if it's a PDF by looking at the header
    const isPdf = buffer.slice(0, 5).toString() === '%PDF-';
    
    if (!isPdf) {
      console.error("The file does not appear to be a valid PDF.");
      return null;
    }
    
    return `[This is a PDF file (${buffer.length} bytes) that requires pdfjs-dist for text extraction. Install with: npm install pdfjs-dist]`;
  } catch (error) {
    console.error("Error in basic extraction:", error);
    return null;
  }
}

// Function to analyze PDF text using Llama API
async function analyzePdfText(pdfText, extractionType) {
  try {
    console.log("\nSending PDF content to Llama API for analysis...");
    
    // Build the system message based on extraction type
    let systemMessage = "You are a helpful assistant specialized in extracting structured information from documents.";
    
    // Build the prompt based on extraction type
    let prompt;
    
    switch (extractionType) {
      case 'medical':
        systemMessage += " Focus on extracting medical information like patient details, lab values, diagnoses, and recommendations.";
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
        systemMessage += " Focus on extracting complete blood count (CBC) values, reference ranges, and flagging abnormal results.";
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
        
      case 'invoice':
        systemMessage += " Focus on extracting invoice details, line items, totals, taxes, and payment information.";
        prompt = `
          I have an invoice document that I need you to analyze. Please extract:
          - Invoice number, date, and due date
          - Vendor/seller information
          - Customer/buyer information
          - All line items with descriptions, quantities, unit prices, and totals
          - Subtotal, taxes, and final total
          - Payment terms and methods
          
          Return the information in a structured JSON format.
          
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
    const response = await fetch("https://api.llama.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ]
      })
    });
    
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return "Sorry, I encountered an error analyzing the PDF. Please try again.";
    }
    
    const data = await response.json();
    
    // Extract the assistant's response
    let assistantResponse = "";
    if (data.completion_message?.content?.text) {
      assistantResponse = data.completion_message.content.text;
    } else if (data.choices?.[0]?.message?.content) {
      assistantResponse = data.choices[0].message.content;
    } else {
      assistantResponse = "I couldn't extract a response from the API result.";
    }
    
    return assistantResponse;
  } catch (error) {
    console.error("Error analyzing PDF with Llama API:", error);
    return "Sorry, I encountered an error analyzing the PDF. Please try again.";
  }
}

// Function to extract JSON from Llama response
function extractJsonFromResponse(response) {
  try {
    // First try to parse as is (might already be valid JSON)
    const parsed = JSON.parse(response);
    return parsed;
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
      // If we can't parse, return the raw text
      return { raw_text: response };
    }
    
    // If we couldn't extract JSON, return the raw text
    return { raw_text: response };
  }
}

// Function to save extraction results
function saveResults(data, originalFilePath) {
  const outputDir = path.dirname(originalFilePath);
  const baseName = path.basename(originalFilePath, path.extname(originalFilePath));
  const outputPath = path.join(outputDir, `${baseName}_extracted.json`);
  
  try {
    // Convert to string if it's an object
    const dataToSave = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    
    fs.writeFileSync(outputPath, dataToSave);
    console.log(`\n✅ Results saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error saving results:", error);
    return null;
  }
}

// Main function to run the extraction process
async function extractPdfData() {
  console.log("=================================================");
  console.log("📄 PDF Data Extractor using Llama API");
  console.log("=================================================");
  console.log("This tool extracts and analyzes data from PDF files.");
  console.log("=================================================\n");
  
  rl.question("Enter the path to your PDF file: ", async (pdfPath) => {
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`\n❌ File not found: ${pdfPath}`);
      console.log("Please provide a valid file path.");
      rl.close();
      return;
    }
    
    // Ask for extraction type
    console.log("\nExtraction types:");
    console.log("1. General (auto-detect document type)");
    console.log("2. Medical Report");
    console.log("3. Blood Test Results");
    console.log("4. Invoice/Receipt");
    
    rl.question("\nSelect extraction type (1-4): ", async (typeChoice) => {
      let extractionType;
      
      switch (typeChoice) {
        case '2': extractionType = 'medical'; break;
        case '3': extractionType = 'blood'; break;
        case '4': extractionType = 'invoice'; break;
        default: extractionType = 'general'; break;
      }
      
      console.log(`\nSelected extraction type: ${extractionType}`);
      
      // Extract text from PDF
      const pdfText = await extractTextFromPdf(pdfPath);
      
      if (!pdfText) {
        console.error("\n❌ Failed to extract text from the PDF.");
        rl.close();
        return;
      }
      
      // Sample of extracted text
      console.log("\nExtracted text sample:");
      console.log("------------------------");
      console.log(pdfText.substring(0, 300) + "...");
      console.log("------------------------");
      
      // Analyze the PDF text
      console.log("\nAnalyzing the PDF content...");
      const analysisResult = await analyzePdfText(pdfText, extractionType);
      
      // Try to extract structured JSON
      const structuredData = extractJsonFromResponse(analysisResult);
      
      // Save the results
      const savedPath = saveResults(structuredData, pdfPath);
      
      // Print a summary of the results
      console.log("\n=================================================");
      console.log("📋 EXTRACTION RESULTS SUMMARY");
      console.log("=================================================");
      
      if (typeof structuredData === 'object' && !structuredData.raw_text) {
        // Print summary based on extraction type
        switch (extractionType) {
          case 'medical':
            if (structuredData.patient) {
              console.log(`Patient: ${structuredData.patient.name || 'Unknown'}`);
              console.log(`ID: ${structuredData.patient.id || 'Unknown'}`);
              console.log(`DOB: ${structuredData.patient.dateOfBirth || 'Unknown'}`);
            }
            if (structuredData.diagnosis) {
              console.log("\nDiagnoses:");
              const diagnoses = Array.isArray(structuredData.diagnosis) ? 
                structuredData.diagnosis : [structuredData.diagnosis];
              diagnoses.forEach(d => console.log(`- ${d}`));
            }
            break;
            
          case 'blood':
            if (structuredData.parameters) {
              console.log("Blood Test Results:");
              structuredData.parameters.forEach(param => {
                const status = param.status === 'high' ? '⬆️ HIGH' : 
                              param.status === 'low' ? '⬇️ LOW' : '✓ Normal';
                console.log(`- ${param.name}: ${param.value} ${param.unit} (${status})`);
              });
            }
            break;
            
          case 'invoice':
            console.log(`Invoice #: ${structuredData.invoiceNumber || 'Unknown'}`);
            console.log(`Date: ${structuredData.date || 'Unknown'}`);
            console.log(`Total: ${structuredData.total || 'Unknown'}`);
            break;
            
          default:
            // Print generic summary
            console.log("Document Type: " + (structuredData.documentType || 'Unknown'));
            console.log("\nExtracted Fields:");
            Object.keys(structuredData).slice(0, 5).forEach(key => {
              const value = typeof structuredData[key] === 'object' ? 
                JSON.stringify(structuredData[key]).substring(0, 50) + '...' : 
                structuredData[key];
              console.log(`- ${key}: ${value}`);
            });
        }
      } else {
        console.log("Raw extraction result (couldn't parse as structured data)");
        console.log(analysisResult.substring(0, 500) + "...");
      }
      
      console.log("\n=================================================");
      console.log(`Full results saved to: ${savedPath}`);
      console.log("=================================================");
      
      rl.close();
    });
  });
}

// Start the extraction process
extractPdfData(); 
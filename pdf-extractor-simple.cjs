// PDF Data Extractor using Llama API - Simple Version
const fs = require('fs');
const path = require('path');
const { fetch } = require('undici');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Llama API key
const apiKey = "LLM|1050039463644017|ZZzxjun1klZ76kW0xu5Zg4BW5-o";

// Function to analyze PDF content using Llama API
async function analyzePdfContent(pdfPath, extractionType) {
  try {
    console.log(`\nReading PDF file: ${pdfPath}`);
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`File not found: ${pdfPath}`);
      return null;
    }
    
    // Read file as buffer (we'll just use basic info since we can't extract text without pdfjs)
    const buffer = fs.readFileSync(pdfPath);
    const fileSize = buffer.length;
    
    // Basic PDF validation
    const isPdf = buffer.slice(0, 5).toString() === '%PDF-';
    if (!isPdf) {
      console.error("The file does not appear to be a valid PDF.");
      return null;
    }
    
    // Create description of PDF for Llama
    const pdfDescription = `[This is a PDF file of ${fileSize} bytes. The file exists but without PDF.js we cannot extract the text content. Please imagine that this is a ${extractionType} document and generate a sample structure of what information could be extracted from such a document.]`;
    
    console.log("\nSending to Llama API for analysis...");
    
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
          
          The document is a PDF file that I can't directly share with you. For demonstration purposes, please provide an example of how you would structure the extracted data for a typical medical report. Use sample values that represent what might be found in such a document.
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
          
          The document is a PDF file that I can't directly share with you. For demonstration purposes, please provide an example of how you would structure the extracted data for a typical CBC report. Use sample values that represent what might be found in such a document.
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
          
          The document is a PDF file that I can't directly share with you. For demonstration purposes, please provide an example of how you would structure the extracted data for a typical invoice. Use sample values that represent what might be found in such a document.
        `;
        break;
        
      default:
        // General extraction
        prompt = `
          I have a document that I need you to analyze. Please extract all key information and provide a structured summary.
          Identify the type of document first, then extract relevant information based on the document type.
          
          Return the information in a clear, structured JSON format with appropriate sections.
          
          The document is a PDF file that I can't directly share with you. For demonstration purposes, please provide an example of how you would structure the extracted data for a typical document. Use sample values that represent what might be found in such a document.
        `;
    }
    
    // Add information about the PDF file
    prompt += `\n\nAdditional information about the document:\n${pdfDescription}`;
    
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
    console.error("Error in PDF analysis:", error);
    return null;
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
  console.log("📄 PDF Data Extractor using Llama API (Simple)");
  console.log("=================================================");
  console.log("This tool analyzes PDF files with Llama API.");
  console.log("NOTE: This simplified version doesn't extract text");
  console.log("from the PDF, but demonstrates the API capabilities.");
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
      
      // Analyze the PDF file
      console.log("\nAnalyzing the PDF...");
      const analysisResult = await analyzePdfContent(pdfPath, extractionType);
      
      if (!analysisResult) {
        console.error("\n❌ Failed to analyze the PDF.");
        rl.close();
        return;
      }
      
      // Try to extract structured JSON
      const structuredData = extractJsonFromResponse(analysisResult);
      
      // Save the results
      const savedPath = saveResults(structuredData, pdfPath);
      
      // Print a summary of the results
      console.log("\n=================================================");
      console.log("📋 EXTRACTION RESULTS SUMMARY");
      console.log("=================================================");
      
      console.log("Note: This is a demonstration using Llama API's capabilities");
      console.log("to analyze documents. The actual content of your PDF was not");
      console.log("extracted due to technical limitations in this simple script.");
      console.log("\nThe API has generated a sample structure based on the");
      console.log("document type you selected.");
      console.log("=================================================\n");
      
      if (typeof structuredData === 'object' && !structuredData.raw_text) {
        // Print summary based on extraction type
        switch (extractionType) {
          case 'medical':
            if (structuredData.patient) {
              console.log(`Patient: ${structuredData.patient.name || 'Unknown'}`);
              if (structuredData.patient.id) console.log(`ID: ${structuredData.patient.id}`);
              if (structuredData.patient.dateOfBirth) console.log(`DOB: ${structuredData.patient.dateOfBirth}`);
              if (structuredData.patient.gender) console.log(`Gender: ${structuredData.patient.gender}`);
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
                console.log(`- ${param.name || 'Unknown'}: ${param.value || '?'} ${param.unit || ''} (${status})`);
              });
            }
            break;
            
          case 'invoice':
            console.log(`Invoice #: ${structuredData.invoiceNumber || 'Unknown'}`);
            console.log(`Date: ${structuredData.date || 'Unknown'}`);
            console.log(`Total: ${structuredData.total || 'Unknown'}`);
            if (structuredData.vendor) console.log(`Vendor: ${structuredData.vendor.name || 'Unknown'}`);
            if (structuredData.customer) console.log(`Customer: ${structuredData.customer.name || 'Unknown'}`);
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
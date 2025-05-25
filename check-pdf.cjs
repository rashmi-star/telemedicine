// Simple PDF inspection tool
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// This script helps diagnose PDF issues by:
// 1. Checking if a PDF file exists in the specified directory
// 2. Examining if the PDF is encrypted
// 3. Attempting to extract raw text to see if text is embedded

console.log("PDF Inspection Tool");
console.log("==================");

// Define a directory to look for PDF files
const directoryToCheck = path.join(__dirname, 'pdf-samples');

// Create the directory if it doesn't exist
if (!fs.existsSync(directoryToCheck)) {
  console.log(`\nCreating directory for PDF samples: ${directoryToCheck}`);
  fs.mkdirSync(directoryToCheck, { recursive: true });
  console.log(`Please place your problematic PDF files in: ${directoryToCheck}`);
  console.log("Then run this script again to analyze them.");
  process.exit(0);
}

// Check for PDF files
const files = fs.readdirSync(directoryToCheck);
const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

if (pdfFiles.length === 0) {
  console.log(`\nNo PDF files found in ${directoryToCheck}`);
  console.log(`Please place your problematic PDF files in this directory and run again.`);
  process.exit(0);
}

console.log(`\nFound ${pdfFiles.length} PDF file(s):`);
pdfFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

// Basic PDF inspection
function inspectPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  console.log(`\nInspecting: ${path.basename(filePath)}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`);
  
  // Check for PDF header
  const header = buffer.slice(0, 8).toString();
  console.log(`PDF header: ${header}`);
  
  if (!header.startsWith('%PDF-')) {
    console.log('⚠️ WARNING: File does not have a standard PDF header');
  }
  
  // Look for encryption indicators
  const fileContent = buffer.toString('utf8', 0, Math.min(buffer.length, 5000));
  
  const hasEncrypt = fileContent.includes('/Encrypt');
  console.log(`Encryption detected: ${hasEncrypt ? '🔒 YES' : '✓ NO'}`);
  
  // Check for common text markers
  const hasText = fileContent.includes('/Text') || 
                  fileContent.includes('/Font') || 
                  fileContent.includes('/Contents');
  
  console.log(`Text markers detected: ${hasText ? '✓ YES' : '❌ NO'}`);
  
  // Search for image objects
  const hasImages = fileContent.includes('/Image') || 
                   fileContent.includes('/XObject');
  
  console.log(`Image objects detected: ${hasImages ? '📷 YES' : 'NO'}`);
  
  // Check for OCR text
  const possibleOcr = fileContent.includes('/Artifact') || 
                     fileContent.includes('/OCR');
  
  if (possibleOcr) {
    console.log('ℹ️ NOTE: Document may contain OCR text');
  }
  
  // Simple binary check (high concentration of binary data suggests images or encryption)
  let binaryCount = 0;
  for (let i = 0; i < Math.min(buffer.length, 5000); i++) {
    if (buffer[i] < 32 && buffer[i] !== 9 && buffer[i] !== 10 && buffer[i] !== 13) {
      binaryCount++;
    }
  }
  
  const binaryRatio = binaryCount / Math.min(buffer.length, 5000);
  console.log(`Binary content ratio: ${(binaryRatio * 100).toFixed(2)}%`);
  
  if (binaryRatio > 0.3) {
    console.log('ℹ️ NOTE: High binary content suggests this may be primarily image-based');
  }
  
  return {
    fileName: path.basename(filePath),
    isEncrypted: hasEncrypt,
    hasTextMarkers: hasText,
    hasImageObjects: hasImages,
    binaryRatio: binaryRatio
  };
}

// Process each PDF
const results = [];
for (const pdfFile of pdfFiles) {
  const filePath = path.join(directoryToCheck, pdfFile);
  const result = inspectPdf(filePath);
  results.push(result);
}

// Summary and recommendations
console.log("\n=== SUMMARY ===");
for (const result of results) {
  console.log(`\nFile: ${result.fileName}`);
  
  if (result.isEncrypted) {
    console.log("⚠️ This PDF is encrypted. Text extraction will fail.");
    console.log("Recommendation: Remove encryption using PDF software or request an unencrypted version.");
  } else if (!result.hasTextMarkers) {
    console.log("⚠️ This PDF does not appear to contain extractable text.");
    console.log("It may be an image-only scan without OCR text.");
    console.log("Recommendation: Run the document through OCR software first.");
  } else if (result.binaryRatio > 0.3) {
    console.log("⚠️ This PDF has high binary content, suggesting it may be primarily images.");
    console.log("Recommendation: Check if text is selectable in a PDF viewer. If not, use OCR software.");
  } else {
    console.log("✓ This PDF appears to be a standard text-based document.");
    console.log("If extraction still fails, the text might be stored in an unusual format.");
    console.log("Recommendation: Try converting the PDF to a different format using online converters.");
  }
}

console.log("\n=== NEXT STEPS ===");
console.log("1. Place your problematic PDF in: " + directoryToCheck);
console.log("2. If the PDF is encrypted or image-based, convert it using tools like Adobe Acrobat or online services");
console.log("3. For image-only PDFs, run OCR (Optical Character Recognition) first");
console.log("4. For urgent analysis, you might try manually copying the text from the PDF if possible"); 
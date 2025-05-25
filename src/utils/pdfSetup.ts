import * as pdfjsLib from 'pdfjs-dist';

export const setupPdfjs = () => {
  try {
    // First try to set a worker path
    const pdfjsVersion = pdfjsLib.version;
    console.log(`Using PDF.js version: ${pdfjsVersion}`);
    
    // Set worker path to our local worker file
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    console.log('PDF.js configured to use local worker');
    
    // Add fallback to inline processing if worker fails to load
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        // Check if the error is related to the PDF worker
        if (event.filename && event.filename.includes('pdf.worker')) {
          console.warn('PDF worker failed to load, switching to inline mode');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
      }, { once: true });
    }
  } catch (error) {
    console.error('Error setting up PDF.js:', error);
    // Fallback to inline processing
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }
};

/**
 * Parse a PDF file and extract text from all pages
 * @param fileData Binary data of the PDF file
 * @returns Extracted text from all pages
 */
export async function extractTextFromPdf(fileData: ArrayBuffer): Promise<string> {
  try {
    // Load the PDF document with inline processing
    const loadingTask = pdfjsLib.getDocument({
      data: fileData,
      // No worker needed, using inline processing
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded successfully with ${numPages} pages`);
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => item.str && typeof item.str === 'string')
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        fullText += `--- Page ${i} ---\n[Error extracting text from this page]\n\n`;
      }
    }
    
    return fullText || "No text content could be extracted from the file";
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error("Failed to extract text from the document");
  }
}

// Export both names for backward compatibility
export { pdfjsLib };
export const pdfjs = pdfjsLib; // Backward compatibility export 
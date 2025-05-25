// This file will be served statically and used as a local PDF.js worker
console.log('PDF Worker initialized');

// This is a minimal worker stub that will prevent errors
self.onmessage = function(event) {
  console.log('PDF Worker received message');
  self.postMessage({
    type: 'ready'
  });
};

// This script creates a simple PDF worker setup in the public folder
// It's used to avoid CORS issues with CDN-loaded workers

// Tell PDF.js to use a fake worker if worker loading fails
window.pdfjsWorkerSrc = '/pdf.worker.min.js';

// Simple utility to create a fake worker fallback
window.setupPdfWorkerFallback = function() {
  if (!window.pdfjsLib) return;
  
  // Set the worker source
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorkerSrc;
  
  console.log('PDF.js worker source configured');
}; 
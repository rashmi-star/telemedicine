import Papa from 'papaparse';

export async function loadMedicalDataset(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    console.log("Starting to load medical dataset");
    
    try {
    Papa.parse('/medical_dataset.csv', {
      download: true,
      header: true,
        complete: (results) => {
          console.log(`Successfully loaded medical dataset with ${results.data.length} rows`);
        resolve(results.data);
      },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
      }
    });
    } catch (error) {
      console.error("Exception during CSV loading:", error);
      // Fallback to empty dataset
      resolve([]);
    }
  });
} 
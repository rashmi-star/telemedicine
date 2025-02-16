// Read the input CSV data
const inputData = `Disease,Fever,Cough,Fatigue,Difficulty Breathing,Age,Gender,Blood Pressure,Cholesterol Level,Outcome Variable
Influenza,Yes,No,Yes,Yes,19,Female,Low,Normal,Positive
Common Cold,No,Yes,Yes,No,25,Female,Normal,Normal,Negative`;

// Convert CSV to TSV
const lines = inputData.split('\n');
let output = '';

lines.forEach(line => {
  // Split by comma, handling quoted values correctly
  const values = line.split(',').map(val => val.trim());
  
  // Join with tabs
  output += values.join('\t') + '\n';
});

console.log(output);
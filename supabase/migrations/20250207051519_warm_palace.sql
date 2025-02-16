/*
  # Load initial medical dataset

  1. Data Loading
    - Loads the initial medical dataset into the medical_data table
    - Includes a variety of diseases, symptoms, and patient data
    - Each record includes disease, symptoms, patient demographics, and outcome

  2. Notes
    - All data is anonymized and for demonstration purposes
    - Includes a representative sample of common medical conditions
*/

-- Insert initial medical dataset
INSERT INTO medical_data (
  disease,
  fever,
  cough,
  fatigue,
  difficulty_breathing,
  age,
  gender,
  blood_pressure,
  cholesterol_level,
  outcome_variable,
  specialty
)
SELECT * FROM (
  VALUES
    ('Influenza', 'Yes', 'No', 'Yes', 'Yes', 19, 'Female', 'Low', 'Normal', 'Positive', 'Infectious Disease Specialist'),
    ('Common Cold', 'No', 'Yes', 'Yes', 'No', 25, 'Female', 'Normal', 'Normal', 'Negative', 'General Practitioner'),
    ('Asthma', 'Yes', 'Yes', 'No', 'Yes', 25, 'Male', 'Normal', 'Normal', 'Positive', 'Pulmonologist'),
    ('Hypertension', 'No', 'No', 'Yes', 'No', 60, 'Female', 'High', 'Normal', 'Positive', 'Cardiologist'),
    ('Diabetes', 'No', 'No', 'Yes', 'No', 65, 'Male', 'Normal', 'High', 'Negative', 'Endocrinologist'),
    ('Migraine', 'Yes', 'No', 'No', 'No', 31, 'Female', 'Normal', 'Normal', 'Positive', 'Neurologist'),
    ('Pneumonia', 'Yes', 'Yes', 'Yes', 'Yes', 45, 'Male', 'High', 'High', 'Positive', 'Pulmonologist'),
    ('Anxiety Disorders', 'No', 'No', 'Yes', 'No', 50, 'Male', 'Normal', 'Normal', 'Negative', 'Psychiatrist'),
    ('Depression', 'No', 'Yes', 'Yes', 'No', 50, 'Female', 'Low', 'Low', 'Negative', 'Psychiatrist'),
    ('Bronchitis', 'Yes', 'Yes', 'Yes', 'Yes', 50, 'Male', 'High', 'Normal', 'Negative', 'Pulmonologist')
) AS data (
  disease,
  fever,
  cough,
  fatigue,
  difficulty_breathing,
  age,
  gender,
  blood_pressure,
  cholesterol_level,
  outcome_variable,
  specialty
)
WHERE NOT EXISTS (
  SELECT 1 FROM medical_data
  WHERE medical_data.disease = data.disease
  AND medical_data.age = data.age
  AND medical_data.gender = data.gender
);
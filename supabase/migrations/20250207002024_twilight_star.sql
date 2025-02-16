/*
  # Medical Data Schema and Security Setup

  1. Schema
    - Creates medical_data table with required fields and constraints
    - Adds timestamps and UUID handling
  
  2. Security
    - Enables RLS
    - Sets up policies for authenticated and anonymous access
    - Ensures data integrity with CHECK constraints
*/

-- Create the medical_data table
CREATE TABLE IF NOT EXISTS medical_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease text NOT NULL,
  fever text NOT NULL CHECK (fever IN ('Yes', 'No')),
  cough text NOT NULL CHECK (cough IN ('Yes', 'No')),
  fatigue text NOT NULL CHECK (fatigue IN ('Yes', 'No')),
  difficulty_breathing text NOT NULL CHECK (difficulty_breathing IN ('Yes', 'No')),
  age integer NOT NULL CHECK (age >= 0 AND age <= 120),
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  blood_pressure text NOT NULL CHECK (blood_pressure IN ('Low', 'Normal', 'High')),
  cholesterol_level text NOT NULL CHECK (cholesterol_level IN ('Low', 'Normal', 'High')),
  outcome_variable text NOT NULL CHECK (outcome_variable IN ('Positive', 'Negative')),
  specialty text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE medical_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read medical data" ON medical_data;
DROP POLICY IF EXISTS "Allow authenticated users to insert medical data" ON medical_data;
DROP POLICY IF EXISTS "Allow anonymous access to medical data" ON medical_data;

-- Create policy to allow anyone to read data
CREATE POLICY "Allow anonymous access to medical data"
  ON medical_data
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow anyone to insert data
CREATE POLICY "Allow anonymous access to insert medical data"
  ON medical_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_medical_data_disease ON medical_data(disease);
CREATE INDEX IF NOT EXISTS idx_medical_data_specialty ON medical_data(specialty);
CREATE INDEX IF NOT EXISTS idx_medical_data_created_at ON medical_data(created_at);
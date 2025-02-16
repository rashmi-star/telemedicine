/*
  # Medical Data Schema

  1. New Tables
    - `medical_data`
      - `id` (uuid, primary key)
      - `disease` (text)
      - `fever` (text)
      - `cough` (text)
      - `fatigue` (text)
      - `difficulty_breathing` (text)
      - `age` (integer)
      - `gender` (text)
      - `blood_pressure` (text)
      - `cholesterol_level` (text)
      - `outcome_variable` (text)
      - `specialty` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `medical_data` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert data
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

-- Create policy to allow all authenticated users to read data
CREATE POLICY "Allow authenticated users to read medical data"
  ON medical_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert medical data"
  ON medical_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
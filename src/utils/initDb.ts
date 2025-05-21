import { supabase } from './supabase';

export const initializeDatabase = async () => {
  try {
    // Create symptom_patterns table
    const { error: symptomPatternsError } = await supabase.rpc('create_symptom_patterns_table');
    if (symptomPatternsError) throw symptomPatternsError;

    // Create related_symptoms table
    const { error: relatedSymptomsError } = await supabase.rpc('create_related_symptoms_table');
    if (relatedSymptomsError) throw relatedSymptomsError;

    // Create condition_symptoms table
    const { error: conditionSymptomsError } = await supabase.rpc('create_condition_symptoms_table');
    if (conditionSymptomsError) throw conditionSymptomsError;

    // Create medical_conditions table
    const { error: medicalConditionsError } = await supabase.rpc('create_medical_conditions_table');
    if (medicalConditionsError) throw medicalConditionsError;

    // Create specialty_mappings table
    const { error: specialtyMappingsError } = await supabase.rpc('create_specialty_mappings_table');
    if (specialtyMappingsError) throw specialtyMappingsError;

    // Create medical_specialties table
    const { error: medicalSpecialtiesError } = await supabase.rpc('create_medical_specialties_table');
    if (medicalSpecialtiesError) throw medicalSpecialtiesError;

    // Create healthcare_facilities table
    const { error: healthcareFacilitiesError } = await supabase.rpc('create_healthcare_facilities_table');
    if (healthcareFacilitiesError) throw healthcareFacilitiesError;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// SQL functions to create tables
const createTablesSQL = `
-- Create symptom_patterns table
create or replace function create_symptom_patterns_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists symptom_patterns (
    id uuid default gen_random_uuid() primary key,
    symptom text not null,
    keywords text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;

-- Create related_symptoms table
create or replace function create_related_symptoms_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists related_symptoms (
    id uuid default gen_random_uuid() primary key,
    primary_symptom text not null,
    related_symptom text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;

-- Create condition_symptoms table
create or replace function create_condition_symptoms_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists condition_symptoms (
    id uuid default gen_random_uuid() primary key,
    condition text not null,
    symptoms text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;

-- Create medical_conditions table
create or replace function create_medical_conditions_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists medical_conditions (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    specialties text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;

-- Create specialty_mappings table
create or replace function create_specialty_mappings_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists specialty_mappings (
    id uuid default gen_random_uuid() primary key,
    specialty text not null,
    related_symptoms text[] not null,
    common_conditions text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;

-- Create medical_specialties table
create or replace function create_medical_specialties_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists medical_specialties (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    common_conditions text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;

-- Create healthcare_facilities table
create or replace function create_healthcare_facilities_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists healthcare_facilities (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    type text not null check (type in ('hospital', 'clinic')),
    specialty text[] not null,
    location jsonb not null,
    address text not null,
    contact text not null,
    pincode text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
end;
$$;
`;

// Export the SQL for manual execution if needed
export const getCreateTablesSQL = () => createTablesSQL; 
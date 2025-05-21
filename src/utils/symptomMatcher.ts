import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SpecialistMatch {
  specialty: string;
  relevance: number;
  description: string;
  commonConditions: string[];
}

export const useSymptomMatcher = () => {
  const findMatchingSpecialists = async (
    symptoms: string[],
    predictedConditions: string[]
  ): Promise<SpecialistMatch[]> => {
    try {
      // Fetch specialty mappings
      const { data: specialtyMappings, error } = await supabase
        .from('specialty_mappings')
        .select('*');

      if (error) throw error;

      // Calculate specialty relevance scores
      const specialtyScores = specialtyMappings.reduce((acc: { [key: string]: number }, mapping) => {
        // Score based on symptom matches
        const symptomMatches = symptoms.filter(s => 
          mapping.related_symptoms.includes(s)
        ).length;
        
        // Score based on condition matches
        const conditionMatches = predictedConditions.filter(c => 
          mapping.common_conditions.includes(c)
        ).length;

        // Calculate weighted score
        const score = (symptomMatches * 0.6) + (conditionMatches * 0.4);
        
        if (score > 0) {
          acc[mapping.specialty] = score;
        }
        
        return acc;
      }, {});

      // Get specialty details
      const { data: specialties, error: specialtiesError } = await supabase
        .from('medical_specialties')
        .select('*')
        .in('name', Object.keys(specialtyScores));

      if (specialtiesError) throw specialtiesError;

      // Format matches with relevance scores
      const matches = specialties.map(specialty => ({
        specialty: specialty.name,
        relevance: specialtyScores[specialty.name],
        description: specialty.description,
        commonConditions: specialty.common_conditions
      }));

      // Sort by relevance and return top matches
      return matches
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 3); // Return top 3 matches
    } catch (error) {
      console.error('Error finding matching specialists:', error);
      throw error;
    }
  };

  return {
    findMatchingSpecialists
  };
};
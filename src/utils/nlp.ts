import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SymptomAnalysis {
  primarySymptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  relatedSymptoms: string[];
}

export const useNLP = () => {
  const analyzeSymptoms = async (symptomText: string): Promise<SymptomAnalysis> => {
    try {
      // In a real implementation, this would use a proper NLP service
      // For now, we'll use a simple keyword-based approach
      const keywords = symptomText.toLowerCase().split(/\s+/);
      
      // Fetch symptom patterns from the database
      const { data: patterns, error } = await supabase
        .from('symptom_patterns')
        .select('*');

      if (error) throw error;

      // Match symptoms against patterns
      const matchedSymptoms = patterns
        .filter((pattern) => 
          keywords.some(keyword => 
            pattern.keywords.includes(keyword)
          )
        )
        .map(pattern => pattern.symptom);

      // Determine severity based on keywords
      const severityKeywords = {
        mild: ['mild', 'slight', 'minor', 'occasional'],
        moderate: ['moderate', 'regular', 'frequent'],
        severe: ['severe', 'intense', 'extreme', 'constant']
      };

      const severity = Object.entries(severityKeywords).find(([_, words]) =>
        words.some(word => keywords.includes(word))
      )?.[0] as 'mild' | 'moderate' | 'severe' || 'moderate';

      // Extract duration if present
      const durationMatch = symptomText.match(/(\d+)\s*(day|week|month|year)s?/i);
      const duration = durationMatch ? durationMatch[0] : 'unknown';

      // Find related symptoms
      const { data: relatedSymptoms, error: relatedError } = await supabase
        .from('related_symptoms')
        .select('*')
        .in('primary_symptom', matchedSymptoms);

      if (relatedError) throw relatedError;

      return {
        primarySymptoms: matchedSymptoms,
        severity,
        duration,
        relatedSymptoms: relatedSymptoms.map(s => s.related_symptom)
      };
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      throw error;
    }
  };

  return {
    analyzeSymptoms
  };
}; 
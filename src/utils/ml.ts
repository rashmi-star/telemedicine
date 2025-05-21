import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ConditionPrediction {
  condition: string;
  confidence: number;
  recommendedSpecialties: string[];
  urgency: 'low' | 'medium' | 'high';
}

export const useMLModel = () => {
  const predictCondition = async (symptoms: string[]): Promise<ConditionPrediction[]> => {
    try {
      // In a real implementation, this would use a trained ML model
      // For now, we'll use a rule-based approach with the database
      
      // Fetch condition-symptom mappings
      const { data: mappings, error } = await supabase
        .from('condition_symptoms')
        .select('*');

      if (error) throw error;

      // Calculate condition probabilities based on symptom matches
      const conditionScores = mappings.reduce((acc: { [key: string]: number }, mapping) => {
        const matchingSymptoms = symptoms.filter(s => 
          mapping.symptoms.includes(s)
        ).length;
        
        if (matchingSymptoms > 0) {
          acc[mapping.condition] = (acc[mapping.condition] || 0) + 
            (matchingSymptoms / mapping.symptoms.length);
        }
        
        return acc;
      }, {});

      // Get condition details
      const { data: conditions, error: conditionsError } = await supabase
        .from('medical_conditions')
        .select('*')
        .in('name', Object.keys(conditionScores));

      if (conditionsError) throw conditionsError;

      // Format predictions with confidence scores
      const predictions = conditions.map(condition => {
        const confidence = conditionScores[condition.name];
        const urgency: 'low' | 'medium' | 'high' = 
          confidence > 0.7 ? 'high' : 
          confidence > 0.4 ? 'medium' : 'low';

        return {
          condition: condition.name,
          confidence,
          recommendedSpecialties: condition.specialties,
          urgency
        };
      });

      // Sort by confidence and urgency
      return predictions
        .sort((a, b) => {
          if (a.urgency === b.urgency) {
            return b.confidence - a.confidence;
          }
          return a.urgency === 'high' ? -1 : 
                 b.urgency === 'high' ? 1 :
                 a.urgency === 'medium' ? -1 : 1;
        })
        .slice(0, 3); // Return top 3 predictions
    } catch (error) {
      console.error('Error predicting conditions:', error);
      throw error;
    }
  };

  return {
    predictCondition
  };
}; 
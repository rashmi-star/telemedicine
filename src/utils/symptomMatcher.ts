import { NLPProcessor } from './nlpProcessor';
import { medicalModel } from './mlModel';

interface SpecialistRecommendation {
  specialty: string;
  confidence: number;
  relatedConditions: string[];
  alternativeSpecialties?: string[];
}

class SymptomMatcher {
  private static instance: SymptomMatcher;
  private nlpProcessor: NLPProcessor;

  private specialtyMapping = {
    'heart': 'Cardiologist',
    'chest': 'Cardiologist',
    'lung': 'Pulmonologist',
    'breathing': 'Pulmonologist',
    'brain': 'Neurologist',
    'nerve': 'Neurologist',
    'headache': 'Neurologist',
    'joint': 'Orthopedist',
    'bone': 'Orthopedist',
    'muscle': 'Orthopedist',
    'skin': 'Dermatologist',
    'rash': 'Dermatologist',
    'mental': 'Psychiatrist',
    'anxiety': 'Psychiatrist',
    'depression': 'Psychiatrist',
    'hormone': 'Endocrinologist',
    'diabetes': 'Endocrinologist',
    'thyroid': 'Endocrinologist',
    'cancer': 'Oncologist',
    'tumor': 'Oncologist',
    'kidney': 'Nephrologist',
    'liver': 'Hepatologist',
    'blood': 'Hematologist',
    'immune': 'Immunologist',
    'allergy': 'Allergist',
    'stomach': 'Gastroenterologist',
    'digestive': 'Gastroenterologist',
    'eye': 'Ophthalmologist',
    'vision': 'Ophthalmologist',
    'ear': 'Otolaryngologist',
    'throat': 'Otolaryngologist',
    'nose': 'Otolaryngologist',
    'pregnancy': 'Obstetrician',
    'reproductive': 'Gynecologist',
    'urinary': 'Urologist',
    'infection': 'Infectious Disease Specialist',
    'fever': 'Infectious Disease Specialist'
  };

  private constructor() {
    this.nlpProcessor = NLPProcessor.getInstance();
  }

  public static getInstance(): SymptomMatcher {
    if (!SymptomMatcher.instance) {
      SymptomMatcher.instance = new SymptomMatcher();
    }
    return SymptomMatcher.instance;
  }

  private getSpecialtiesFromSymptoms(symptoms: string): string[] {
    const words = symptoms.toLowerCase().split(/[\s,]+/);
    const specialties = new Set<string>();
    
    words.forEach(word => {
      Object.entries(this.specialtyMapping).forEach(([keyword, specialty]) => {
        if (word.includes(keyword)) {
          specialties.add(specialty);
        }
      });
    });

    return Array.from(specialties);
  }

  public async findBestSpecialty(userSymptoms: string): Promise<SpecialistRecommendation> {
    try {
      if (!userSymptoms?.trim()) {
        return {
          specialty: 'General Practitioner',
          confidence: 1.0,
          relatedConditions: ['Please provide more information about your symptoms'],
          alternativeSpecialties: undefined
        };
      }

      // Get ML model prediction
      const prediction = await medicalModel.predict(userSymptoms);
      
      // Get additional specialties based on symptom keywords
      const keywordSpecialties = this.getSpecialtiesFromSymptoms(userSymptoms);
      
      // Combine ML prediction with keyword-based specialties
      const allSpecialties = new Set<string>([
        prediction.specialty,
        ...keywordSpecialties
      ]);

      // Get alternative specialties (excluding the main recommendation)
      const alternativeSpecialties = Array.from(allSpecialties)
        .filter(specialty => specialty !== prediction.specialty)
        .slice(0, 2);

      // Ensure we have valid conditions
      const conditions = prediction.possibleDiseases.map(d => d.name);
      if (conditions.length === 0) {
        conditions.push('Further medical evaluation recommended');
      }

      return {
        specialty: prediction.specialty,
        confidence: prediction.confidence,
        relatedConditions: conditions,
        alternativeSpecialties: alternativeSpecialties.length > 0 ? alternativeSpecialties : undefined
      };
    } catch (error) {
      console.error('Error in findBestSpecialty:', error);
      
      // Try fallback to keyword-based matching
      try {
        const keywordSpecialties = this.getSpecialtiesFromSymptoms(userSymptoms);
        
        if (keywordSpecialties.length > 0) {
          return {
            specialty: keywordSpecialties[0],
            confidence: 0.7,
            relatedConditions: ['Based on symptoms analysis'],
            alternativeSpecialties: keywordSpecialties.slice(1)
          };
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
      
      // Final fallback
      return {
        specialty: 'General Practitioner',
        confidence: 1.0,
        relatedConditions: ['Please consult a general practitioner for proper evaluation'],
        alternativeSpecialties: undefined
      };
    }
  }
}

export const symptomMatcher = SymptomMatcher.getInstance();
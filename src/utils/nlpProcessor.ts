import { ICD10Entry, icd10Dataset } from '../data/icd10Dataset';

export class NLPProcessor {
  private static instance: NLPProcessor;

  private constructor() {}

  public static getInstance(): NLPProcessor {
    if (!NLPProcessor.instance) {
      NLPProcessor.instance = new NLPProcessor();
    }
    return NLPProcessor.instance;
  }

  public preprocessText(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  public findSimilarConditions(symptoms: string): ICD10Entry[] {
    const processedSymptoms = this.preprocessText(symptoms);
    
    // Calculate similarity scores using word overlap
    const similarities = icd10Dataset.map(entry => {
      const entryWords = new Set([
        ...entry.symptoms.flatMap(s => this.preprocessText(s)),
        ...this.preprocessText(entry.description)
      ]);
      
      const matchingWords = processedSymptoms.filter(word => entryWords.has(word));
      const score = matchingWords.length / Math.sqrt(entryWords.size * processedSymptoms.length);
      
      return { entry, score };
    });

    // Return top 3 matches
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => match.entry);
  }
}
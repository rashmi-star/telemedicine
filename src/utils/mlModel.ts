import * as tf from '@tensorflow/tfjs';
import { medicalDataset } from '../data/medicalDataset';
import type { Disease, MedicalDataRecord } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

interface PatientData {
  age: number;
  gender: string;
  bloodPressure: string;
  cholesterolLevel: string;
}

class MedicalMLModel {
  private static instance: MedicalMLModel;
  private model: tf.LayersModel | null = null;
  private vocabularySize: number = 0;
  private specialties: string[] = [];
  private vocabulary: Map<string, number>;
  private isTraining: boolean = false;
  private currentDataset: Disease[] = [];
  private diseaseMapping: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;
  private hasShownInitialMessage: boolean = false;

  private constructor() {
    this.vocabulary = new Map();
    // Initialize with base vocabulary
    const baseSymptoms = [
      'fever', 'cough', 'fatigue', 'difficulty breathing', 'pain',
      'headache', 'nausea', 'vomiting', 'dizziness', 'weakness',
      'high blood pressure', 'low blood pressure', 'high cholesterol',
      'low cholesterol', 'unknown'
    ];
    baseSymptoms.forEach((symptom, index) => {
      this.vocabulary.set(symptom, index);
    });
    this.vocabularySize = this.vocabulary.size;

    // Initialize specialties
    this.specialties = [
      'General Practitioner',
      'Cardiologist',
      'Pulmonologist',
      'Neurologist',
      'Endocrinologist',
      'Infectious Disease Specialist',
      'Oncologist',
      'Psychiatrist'
    ];

    // Initialize with default dataset
    this.currentDataset = medicalDataset.map(entry => ({
      name: entry.description,
      symptoms: entry.symptoms.length > 0 ? entry.symptoms : ['unknown'],
      specialty: entry.specialty || 'General Practitioner',
      age: 0,
      gender: 'Unknown',
      outcome: 'Unknown'
    }));
  }

  public static getInstance(): MedicalMLModel {
    if (!MedicalMLModel.instance) {
      MedicalMLModel.instance = new MedicalMLModel();
    }
    return MedicalMLModel.instance;
  }

  public getHasShownInitialMessage(): boolean {
    return this.hasShownInitialMessage;
  }

  public setHasShownInitialMessage(value: boolean): void {
    this.hasShownInitialMessage = value;
  }

  private async loadSupabaseData(): Promise<Disease[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured, using default dataset');
      return this.currentDataset;
    }

    try {
      const { data, error } = await supabase
        .from('medical_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn('No data available in Supabase, using default dataset');
        return this.currentDataset;
      }

      return data.map((record: MedicalDataRecord) => {
        const symptoms = [];
        if (record.fever === 'Yes') symptoms.push('fever');
        if (record.cough === 'Yes') symptoms.push('cough');
        if (record.fatigue === 'Yes') symptoms.push('fatigue');
        if (record.difficulty_breathing === 'Yes') symptoms.push('difficulty breathing');
        
        // Add blood pressure as symptom if abnormal
        if (record.blood_pressure === 'High') {
          symptoms.push('high blood pressure');
        } else if (record.blood_pressure === 'Low') {
          symptoms.push('low blood pressure');
        }

        // Add cholesterol as symptom if abnormal
        if (record.cholesterol_level === 'High') {
          symptoms.push('high cholesterol');
        } else if (record.cholesterol_level === 'Low') {
          symptoms.push('low cholesterol');
        }

        return {
          name: record.disease,
          symptoms: symptoms.length > 0 ? symptoms : ['unknown'],
          specialty: record.specialty || this.mapDiseaseToSpecialty(record.disease),
          age: record.age,
          gender: record.gender,
          outcome: record.outcome_variable
        };
      });
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      return this.currentDataset;
    }
  }

  private mapDiseaseToSpecialty(disease: string): string {
    const lowerDisease = disease.toLowerCase();
    
    // Respiratory conditions
    if (lowerDisease.includes('asthma') || 
        lowerDisease.includes('bronchitis') || 
        lowerDisease.includes('pneumonia') ||
        lowerDisease.includes('copd')) {
      return 'Pulmonologist';
    }
    
    // Heart conditions
    if (lowerDisease.includes('heart') || 
        lowerDisease.includes('hypertension') ||
        lowerDisease.includes('coronary')) {
      return 'Cardiologist';
    }
    
    // Neurological conditions
    if (lowerDisease.includes('migraine') || 
        lowerDisease.includes('epilepsy') ||
        lowerDisease.includes('stroke')) {
      return 'Neurologist';
    }
    
    // Mental health
    if (lowerDisease.includes('depression') || 
        lowerDisease.includes('anxiety') ||
        lowerDisease.includes('bipolar')) {
      return 'Psychiatrist';
    }
    
    // Endocrine disorders
    if (lowerDisease.includes('diabetes') || 
        lowerDisease.includes('thyroid')) {
      return 'Endocrinologist';
    }
    
    // Infectious diseases
    if (lowerDisease.includes('influenza') || 
        lowerDisease.includes('pneumonia') ||
        lowerDisease.includes('infection')) {
      return 'Infectious Disease Specialist';
    }

    return 'General Practitioner';
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      try {
        // Load data from Supabase
        this.currentDataset = await this.loadSupabaseData();

        // Build initial vocabulary and disease mapping
        this.buildVocabulary();
        this.buildDiseaseMapping();
        
        // Create and compile model
        this.model = this.createModel();
        await this.model.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        });
        
        // Train on current dataset
        await this.trainOnCurrentDataset();
        
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing model:', error);
        this.isInitialized = false;
        this.model = null;
        throw new Error('Failed to initialize model');
      }
    }
  }

  public async predict(symptoms: string): Promise<{
    specialty: string;
    confidence: number;
    possibleDiseases: Array<{ name: string; probability: number }>;
  }> {
    if (!this.model || !this.isInitialized) {
      await this.ensureInitialized();
    }

    try {
      const symptomList = symptoms.toLowerCase().split(/[,\s]+/).filter(Boolean);
      if (symptomList.length === 0) {
        return {
          specialty: 'General Practitioner',
          confidence: 1.0,
          possibleDiseases: [{
            name: 'General medical consultation recommended',
            probability: 1.0
          }]
        };
      }

      const input = new Array(this.vocabularySize).fill(0);
      let hasMatchedSymptoms = false;
      
      symptomList.forEach(symptom => {
        const index = this.vocabulary.get(symptom);
        if (index !== undefined) {
          input[index] = 1;
          hasMatchedSymptoms = true;
        }
      });

      if (!hasMatchedSymptoms) {
        return {
          specialty: 'General Practitioner',
          confidence: 1.0,
          possibleDiseases: [{
            name: 'Symptoms require general evaluation',
            probability: 1.0
          }]
        };
      }

      const inputTensor = tf.tensor2d([input]);
      let prediction;
      let probabilities;

      try {
        prediction = this.model!.predict(inputTensor) as tf.Tensor;
        probabilities = await prediction.data();
      } catch (error) {
        console.error('Error during model prediction:', error);
        return {
          specialty: 'General Practitioner',
          confidence: 1.0,
          possibleDiseases: [{
            name: 'Unable to process symptoms, please consult a general practitioner',
            probability: 1.0
          }]
        };
      } finally {
        inputTensor.dispose();
        prediction?.dispose();
      }

      // Get the most likely specialty
      const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
      const specialty = this.specialties[maxIndex] || 'General Practitioner';
      const confidence = probabilities[maxIndex];

      // Find possible diseases based on symptoms
      const possibleDiseases = Array.from(this.diseaseMapping.entries())
        .map(([disease, diseaseSymptoms]) => {
          const matchingSymptoms = symptomList.filter(s => 
            diseaseSymptoms.some(ds => ds.toLowerCase().includes(s))
          );
          return {
            name: disease,
            probability: matchingSymptoms.length / Math.max(diseaseSymptoms.length, 1)
          };
        })
        .filter(d => d.probability > 0.2)
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3);

      return {
        specialty,
        confidence,
        possibleDiseases: possibleDiseases.length > 0 ? possibleDiseases : [{
          name: 'Further evaluation needed',
          probability: 1.0
        }]
      };
    } catch (error) {
      console.error('Error in predict:', error);
      return {
        specialty: 'General Practitioner',
        confidence: 1.0,
        possibleDiseases: [{
          name: 'Error analyzing symptoms, please consult a general practitioner',
          probability: 1.0
        }]
      };
    }
  }

  private async trainOnCurrentDataset(): Promise<void> {
    if (!this.model) {
      throw new Error('Model not created');
    }

    if (this.currentDataset.length === 0) {
      throw new Error('No training data available');
    }

    const inputs: number[][] = [];
    const outputs: number[][] = [];

    try {
      this.currentDataset.forEach(disease => {
        const input = this.createInputVector(disease.symptoms);
        const output = new Array(this.specialties.length).fill(0);
        const specialtyIndex = this.specialties.indexOf(disease.specialty);
        if (specialtyIndex >= 0) {
          output[specialtyIndex] = 1;
        } else {
          output[0] = 1; // Default to General Practitioner
        }
        inputs.push(input);
        outputs.push(output);
      });

      const xs = tf.tensor2d(inputs);
      const ys = tf.tensor2d(outputs);

      try {
        await this.model.fit(xs, ys, {
          epochs: 50,
          batchSize: 32,
          validationSplit: 0.2,
          shuffle: true,
          callbacks: {
            onBatchEnd: async () => {
              await tf.nextFrame(); // Prevent UI blocking
            }
          }
        });
      } finally {
        xs.dispose();
        ys.dispose();
      }
    } catch (error) {
      console.error('Error in trainOnCurrentDataset:', error);
      throw new Error('Training failed');
    }
  }

  private createInputVector(symptoms: string[]): number[] {
    const vector = new Array(this.vocabularySize).fill(0);
    symptoms.forEach(symptom => {
      const index = this.vocabulary.get(symptom.toLowerCase());
      if (index !== undefined) {
        vector[index] = 1;
      }
    });
    return vector;
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.vocabularySize],
          units: 128,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dense({
          units: this.specialties.length,
          activation: 'softmax',
          kernelInitializer: 'glorotNormal'
        })
      ]
    });

    return model;
  }

  private buildVocabulary(): void {
    const words = new Set<string>();
    this.currentDataset.forEach(disease => {
      disease.symptoms.forEach(symptom => {
        words.add(symptom.toLowerCase());
      });
    });
    
    this.vocabulary.clear();
    Array.from(words).forEach((word, index) => {
      this.vocabulary.set(word, index);
    });
    this.vocabularySize = this.vocabulary.size;

    if (this.vocabularySize === 0) {
      this.vocabulary.set('unknown', 0);
      this.vocabularySize = 1;
    }
  }

  private buildDiseaseMapping(): void {
    this.diseaseMapping.clear();
    this.currentDataset.forEach(disease => {
      this.diseaseMapping.set(disease.name, disease.symptoms);
    });
  }

  public async train(): Promise<void> {
    if (this.isTraining) {
      return;
    }

    this.isTraining = true;

    try {
      if (!this.model || !this.isInitialized) {
        await this.ensureInitialized();
      } else {
        await this.trainOnCurrentDataset();
      }
    } catch (error) {
      console.error('Error during training:', error);
      throw new Error(`Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isTraining = false;
    }
  }

  public async refreshModel(): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await supabase
        .from('medical_data')
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No data available in the database');
      }

      // Convert Supabase data to Disease format
      const diseases: Disease[] = data.map(record => ({
        name: record.disease,
        symptoms: [
          record.fever === 'Yes' ? 'fever' : '',
          record.cough === 'Yes' ? 'cough' : '',
          record.fatigue === 'Yes' ? 'fatigue' : '',
          record.difficulty_breathing === 'Yes' ? 'difficulty breathing' : ''
        ].filter(Boolean),
        specialty: record.specialty || 'General Practitioner',
        age: record.age,
        gender: record.gender,
        outcome: record.outcome_variable
      }));

      // Update dataset and retrain
      await this.updateDataset(diseases);

    } catch (error) {
      console.error('Error refreshing model:', error);
      throw new Error('Failed to refresh model with latest data');
    }
  }

  public async updateDataset(records: Disease[]): Promise<void> {
    try {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('Invalid or empty dataset provided');
      }

      const validRecords = records.map(record => ({
        ...record,
        symptoms: record.symptoms.length > 0 ? record.symptoms : ['unknown'],
        specialty: record.specialty || 'General Practitioner'
      }));

      this.currentDataset = [...this.currentDataset, ...validRecords];

      const uniqueSpecialties = new Set(this.currentDataset.map(d => d.specialty));
      this.specialties = Array.from(uniqueSpecialties);
      if (!this.specialties.includes('General Practitioner')) {
        this.specialties.unshift('General Practitioner');
      }

      this.buildVocabulary();
      this.buildDiseaseMapping();

      this.isInitialized = false;
      this.model = null;
      await this.ensureInitialized();
    } catch (error) {
      console.error('Error updating dataset:', error);
      throw new Error(`Failed to update dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const medicalModel = MedicalMLModel.getInstance();
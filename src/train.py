import csv
import sys
from typing import List, Dict, Tuple
import json
from collections import defaultdict

class MedicalPredictor:
    def __init__(self):
        self.symptoms_map: Dict[str, int] = {}
        self.diseases_map: Dict[str, int] = {}
        self.reverse_diseases_map: Dict[int, str] = {}
        self.model = None
        
    def preprocess_data(self, data: List[Dict]) -> Tuple[List[List[int]], List[int]]:
        """
        Preprocess the data by converting symptoms and diseases to numerical format
        """
        # Build symptom vocabulary
        all_symptoms = set()
        for entry in data:
            all_symptoms.update(entry['symptoms'])
        
        self.symptoms_map = {symptom: idx for idx, symptom in enumerate(sorted(all_symptoms))}
        
        # Build disease mapping
        unique_diseases = sorted(set(entry['description'] for entry in data))
        self.diseases_map = {disease: idx for idx, disease in enumerate(unique_diseases)}
        self.reverse_diseases_map = {idx: disease for disease, idx in self.diseases_map.items()}
        
        # Convert to feature vectors
        X = []
        y = []
        
        for entry in data:
            # Create symptom vector
            symptom_vector = [0] * len(self.symptoms_map)
            for symptom in entry['symptoms']:
                symptom_vector[self.symptoms_map[symptom]] = 1
            
            X.append(symptom_vector)
            y.append(self.diseases_map[entry['description']])
        
        return X, y
    
    def train(self, model_type: str = 'dt'):
        """
        Train the selected model
        """
        try:
            # Load training data
            with open('medical_dataset.csv', 'r') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    symptoms = row['symptoms'].split(';')
                    data.append({
                        'symptoms': symptoms,
                        'specialty': row['specialty'],
                        'description': row['description']
                    })
            
            # Preprocess data
            X, y = self.preprocess_data(data)
            
            # Select and train model
            if model_type == 'dt':
                from sklearn.tree import DecisionTreeClassifier
                self.model = DecisionTreeClassifier(random_state=42)
            elif model_type == 'rf':
                from sklearn.ensemble import RandomForestClassifier
                self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            else:
                from sklearn.linear_model import LogisticRegression
                self.model = LogisticRegression(random_state=42, max_iter=1000)
            
            # Train model
            self.model.fit(X, y)
            
            # Calculate and print metrics
            from sklearn.metrics import classification_report
            y_pred = self.model.predict(X)
            print("\nModel Performance:")
            print(classification_report(y, y_pred, target_names=list(self.diseases_map.keys())))
            
            return True
            
        except Exception as e:
            print(f"Error training model: {str(e)}")
            return False
    
    def predict(self, symptoms: List[str]) -> Dict:
        """
        Make prediction based on input symptoms
        """
        if not self.model:
            return {"error": "Model not trained"}
        
        try:
            # Convert symptoms to feature vector
            symptom_vector = [0] * len(self.symptoms_map)
            for symptom in symptoms:
                if symptom in self.symptoms_map:
                    symptom_vector[self.symptoms_map[symptom]] = 1
            
            # Make prediction
            prediction = self.model.predict([symptom_vector])[0]
            probabilities = self.model.predict_proba([symptom_vector])[0]
            
            # Get top 3 predictions with probabilities
            top_3 = sorted(
                [(self.reverse_diseases_map[i], prob) for i, prob in enumerate(probabilities)],
                key=lambda x: x[1],
                reverse=True
            )[:3]
            
            return {
                "prediction": self.reverse_diseases_map[prediction],
                "confidence": float(max(probabilities)),
                "top_3": [{"disease": d, "probability": float(p)} for d, p in top_3]
            }
            
        except Exception as e:
            return {"error": str(e)}

def main():
    predictor = MedicalPredictor()
    
    # Training mode
    if len(sys.argv) > 1 and sys.argv[1] == "train":
        model_type = sys.argv[2] if len(sys.argv) > 2 else "dt"
        print(f"Training model type: {model_type}")
        success = predictor.train(model_type)
        if success:
            print("Model trained successfully!")
        else:
            print("Failed to train model")
            
    # Prediction mode
    elif len(sys.argv) > 1 and sys.argv[1] == "predict":
        # First train the model
        success = predictor.train()
        if not success:
            print("Failed to train model")
            return
            
        # Get symptoms from command line
        symptoms = sys.argv[2].split(";") if len(sys.argv) > 2 else []
        if not symptoms:
            print("Please provide symptoms separated by semicolons")
            return
            
        result = predictor.predict(symptoms)
        print("\nPrediction Results:")
        print(json.dumps(result, indent=2))
        
    else:
        print("Usage:")
        print("Training: python train.py train [model_type]")
        print("  model_type options: dt (Decision Tree), rf (Random Forest), lr (Logistic Regression)")
        print("Prediction: python train.py predict 'symptom1;symptom2;symptom3'")

if __name__ == "__main__":
    main()
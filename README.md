# MedGuide

MedGuide is a smart healthcare assistant that helps you understand your medical symptoms through AI technology. It takes your symptoms as input in simple everyday language and matches them against a vast medical database to provide initial health insights. The platform aims to make preliminary health information more accessible while ensuring all sensitive health data remains secure and private.

## Core Features

- 🔍 **Smart Symptom Analysis**: 
  - Natural language input processing
  - Advanced symptom matching algorithms
  - Real-time analysis feedback

- 🏥 **Medical Dataset Integration**: 
  - Comprehensive medical database
  - ICD-10 code integration
  - Verified source information

- 🤖 **ML-Powered Predictions**: 
  - TensorFlow.js machine learning models
  - Symptom-condition correlation
  - Probability-based insights

- 📱 **Interactive Interface**: 
  - Symptom data entry form
  - Medical dataset uploader
  - Interactive mapping visualization

- 🔒 **Secure Infrastructure**: 
  - Supabase backend integration
  - Encrypted data transmission
  - Private health information protection

## Technical Architecture

### Frontend (⚛️ React + TypeScript)
- Modern React components with TypeScript
- Tailwind CSS for responsive design
- Vite for optimized development

### Backend (🗄️ Supabase)
- Secure data storage
- Real-time data synchronization
- User authentication

### AI/ML Components (🧠)
- Custom NLP processor for symptom analysis
- TensorFlow.js for prediction models
- Symptom matching algorithms

### Data Processing (📊)
- Medical dataset management
- ICD-10 code processing
- Real-time data analysis

## Project Structure
```
project/
├── src/
│   ├── components/          # React UI components
│   │   ├── DataEntryForm   # Symptom input interface
│   │   ├── DatasetUploader # Medical data management
│   │   └── Map            # Visualization component
│   ├── utils/              # Core functionality
│   │   ├── mlModel        # Machine learning implementation
│   │   ├── nlpProcessor   # Natural language processing
│   │   ├── symptomMatcher # Symptom analysis
│   │   └── DataProcessor  # Data handling
│   └── data/              # Dataset management
├── supabase/              # Database configuration
└── public/               # Static assets
```

## Getting Started

1. **Clone and Setup**
```bash
git clone https://github.com/rashmi-star/MedGuide.git
cd MedGuide
npm install
```

2. **Start Development Server**
```bash
npm run dev
```
Access the application at `http://localhost:5173` (or next available port)

⚠️ **Important Medical Disclaimer**: 
This tool is designed for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the guidance of qualified healthcare providers with any questions regarding your medical condition. 
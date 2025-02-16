# MedGuide

MedGuide is an AI-driven healthcare assistant that helps users understand their medical symptoms in simple, everyday language. By analyzing symptoms against a vast medical database, MedGuide provides initial health insights and recommends specialist doctors based on the user's location (pincode).

## Core Features

- 🔍 **Smart Symptom Analysis**: 
  - Natural language symptom description
  - AI-powered symptom matching
  - Real-time health insights

- 🗺️ **Doctor Recommendations**: 
  - Location-based specialist finding
  - Pincode-specific search
  - Specialist matching based on symptoms

- 🤖 **AI-Powered Diagnosis**: 
  - Advanced symptom analysis
  - Condition probability assessment
  - Specialist type suggestions

- 📱 **User-Friendly Interface**: 
  - Simple symptom input
  - Location-based services
  - Clear health insights display

- 🔒 **Privacy & Security**: 
  - Secure data handling
  - Private health information protection
  - Encrypted user data

## Development Setup

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm or yarn
- Git

### Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/rashmi-star/MedGuide.git
cd MedGuide
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

The application will automatically start on `http://localhost:5173`. If port 5173 is in use, it will automatically find the next available port (e.g., 5174, 5175).

### Development Notes
- The server supports hot reloading
- Press `h + enter` in the terminal for additional commands
- Use `--host` flag to expose the server to your network

## Technical Stack

### Frontend
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS
- 🛠️ Vite 5.4+

### Backend & Data
- 🗄️ Supabase
- 🤖 TensorFlow.js
- 📊 Custom NLP processing

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

⚠️ **Important Medical Disclaimer**: 
This tool is designed for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the guidance of qualified healthcare providers with any questions regarding your medical condition. 
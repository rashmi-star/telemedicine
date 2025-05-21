# SmartMed Connect

SmartMed Connect is an AI-powered healthcare platform that helps patients find the right medical specialists based on their symptoms and location. The platform uses advanced natural language processing and machine learning to analyze symptoms, predict potential conditions, and match patients with appropriate healthcare providers.

## Features

- **AI-Powered Symptom Analysis**: Advanced NLP algorithms analyze patient symptoms to identify potential conditions and severity.
- **Intelligent Specialist Matching**: Machine learning models match patients with the most suitable medical specialists based on their symptoms and medical history.
- **Location-Based Healthcare**: Interactive map interface showing nearby hospitals and clinics with real-time availability.
- **Pre-Consultation Insights**: Provides patients with relevant medical information and questions to discuss with their doctor.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Maps**: Leaflet.js for interactive healthcare facility mapping
- **AI/ML**: Custom NLP and ML models for symptom analysis and condition prediction
- **Database**: Supabase for data storage and real-time updates
- **Authentication**: Supabase Auth for secure user management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartmed-connect.git
   cd smartmed-connect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
smartmed-connect/
├── src/
│   ├── components/         # React components
│   ├── utils/             # Utility functions and hooks
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── index.html             # HTML entry point
└── package.json           # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/)
- [Supabase](https://supabase.io/) 
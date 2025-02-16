import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Loader, AlertCircle } from 'lucide-react';
import { symptomMatcher } from './utils/symptomMatcher';
import { medicalModel } from './utils/mlModel';
import { isSupabaseConfigured } from './utils/supabase';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string | React.ReactNode;
  isLoading?: boolean;
}

interface PatientData {
  age: number;
  gender: string;
  bloodPressure: string;
  cholesterolLevel: string;
}

type ChatStep = 
  | 'init'
  | 'age'
  | 'gender'
  | 'blood-pressure'
  | 'cholesterol'
  | 'symptoms'
  | 'location';

function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [modelReady, setModelReady] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [patientData, setPatientData] = useState<PatientData>({
    age: 0,
    gender: '',
    bloodPressure: 'Normal',
    cholesterolLevel: 'Normal'
  });
  const [currentStep, setCurrentStep] = useState<ChatStep>('init');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeModel = async () => {
      if (!isSupabaseConfigured) {
        setMessages([{
          id: generateMessageId(),
          type: 'bot',
          content: (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                <span>Database connection required</span>
              </div>
              <p>Please click the "Connect to Supabase" button in the top right corner to set up your database connection.</p>
            </div>
          )
        }]);
        return;
      }

      try {
        setInitializationProgress(10);
        await new Promise(resolve => setTimeout(resolve, 500));

        setInitializationProgress(30);
        await new Promise(resolve => setTimeout(resolve, 500));

        setInitializationProgress(50);
        await medicalModel.train();
        setInitializationProgress(80);

        await new Promise(resolve => setTimeout(resolve, 500));
        setInitializationProgress(100);
        setModelReady(true);

        // Add initial welcome message
        setMessages([{
          id: generateMessageId(),
          type: 'bot',
          content: (
            <div className="space-y-2">
              <p>Hello! I'm your medical assistant. I'll help you find the right specialist based on your symptoms and medical history.</p>
              <p>First, I'll need some basic information about you. What's your age?</p>
            </div>
          )
        }]);
        setCurrentStep('age');
      } catch (error) {
        console.error('Error initializing model:', error);
        setMessages([{
          id: generateMessageId(),
          type: 'bot',
          content: (
            <div className="space-y-2 text-red-600">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Error initializing the medical assistant</span>
              </div>
              <p>Please try refreshing the page. If the problem persists, contact support.</p>
            </div>
          )
        }]);
      }
    };

    initializeModel();
  }, []);

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage = { ...message, id: generateMessageId() };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleAgeInput = (input: string) => {
    const age = parseInt(input);
    if (isNaN(age) || age < 0 || age > 120) {
      addMessage({
        type: 'bot',
        content: "Please enter a valid age between 0 and 120."
      });
      return false;
    }
    
    setPatientData(prev => ({ ...prev, age }));
    addMessage({
      type: 'bot',
      content: "What's your gender? (Male/Female)"
    });
    setCurrentStep('gender');
    return true;
  };

  const handleGenderInput = (input: string) => {
    const gender = input.toLowerCase();
    if (gender !== 'male' && gender !== 'female') {
      addMessage({
        type: 'bot',
        content: "Please enter either 'Male' or 'Female'."
      });
      return false;
    }

    setPatientData(prev => ({ ...prev, gender: gender.charAt(0).toUpperCase() + gender.slice(1) }));
    addMessage({
      type: 'bot',
      content: "What's your blood pressure level? (Low/Normal/High)"
    });
    setCurrentStep('blood-pressure');
    return true;
  };

  const handleBloodPressureInput = (input: string) => {
    const bp = input.toLowerCase();
    if (!['low', 'normal', 'high'].includes(bp)) {
      addMessage({
        type: 'bot',
        content: "Please enter either 'Low', 'Normal', or 'High'."
      });
      return false;
    }

    setPatientData(prev => ({ ...prev, bloodPressure: bp.charAt(0).toUpperCase() + bp.slice(1) }));
    addMessage({
      type: 'bot',
      content: "What's your cholesterol level? (Low/Normal/High)"
    });
    setCurrentStep('cholesterol');
    return true;
  };

  const handleCholesterolInput = (input: string) => {
    const cholesterol = input.toLowerCase();
    if (!['low', 'normal', 'high'].includes(cholesterol)) {
      addMessage({
        type: 'bot',
        content: "Please enter either 'Low', 'Normal', or 'High'."
      });
      return false;
    }

    setPatientData(prev => ({ ...prev, cholesterolLevel: cholesterol.charAt(0).toUpperCase() + cholesterol.slice(1) }));
    addMessage({
      type: 'bot',
      content: (
        <div className="space-y-2">
          <p>Thank you for providing your information. Now, please tell me about your symptoms.</p>
          <p className="text-sm text-gray-600">For example: "I have a fever and cough" or "I'm experiencing headaches"</p>
        </div>
      )
    });
    setCurrentStep('symptoms');
    return true;
  };

  const handleSymptomInput = async (symptoms: string) => {
    const loadingMessageId = generateMessageId();
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      type: 'bot',
      content: <div className="flex items-center space-x-2">
        <Loader className="animate-spin" />
        <span>Analyzing your symptoms...</span>
      </div>,
      isLoading: true
    }]);

    try {
      const result = await symptomMatcher.findBestSpecialty(symptoms);
      
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      addMessage({
        type: 'bot',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                Based on your symptoms and medical profile, I recommend seeing a{' '}
                <span className="font-semibold">{result.specialty}</span>
                <span className="text-sm ml-2">
                  (Confidence: {Math.round(result.confidence * 100)}%)
                </span>
              </p>
            </div>
            
            {result.relatedConditions.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Possible related conditions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.relatedConditions.map((condition, index) => (
                    <li key={`${loadingMessageId}-condition-${index}`} className="text-gray-700">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.alternativeSpecialties && (
              <div className="text-sm text-gray-600">
                <p>You might also consider consulting:</p>
                <ul className="list-disc list-inside">
                  {result.alternativeSpecialties.map((specialty, index) => (
                    <li key={`${loadingMessageId}-specialty-${index}`}>
                      {specialty}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Your Medical Profile:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Age: {patientData.age}</li>
                <li>Gender: {patientData.gender}</li>
                <li>Blood Pressure: {patientData.bloodPressure}</li>
                <li>Cholesterol: {patientData.cholesterolLevel}</li>
              </ul>
            </div>

            <p className="mt-4">Would you like me to help you find specialists in your area? If so, please enter your ZIP code.</p>
          </div>
        )
      });
      setCurrentStep('location');
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      addMessage({
        type: 'bot',
        content: "I'm sorry, I had trouble analyzing your symptoms. Could you please rephrase them?"
      });
    }
  };

  const handleLocationInput = (zipCode: string) => {
    if (!zipCode.match(/^\d{5}$/)) {
      addMessage({
        type: 'bot',
        content: "Please enter a valid 5-digit ZIP code."
      });
      return;
    }

    const messageId = generateMessageId();
    addMessage({
      type: 'bot',
      content: (
        <div className="space-y-4">
          <h3 className="font-medium">Here are some specialists in your area:</h3>
          <div className="grid gap-4">
            {[
              {
                name: 'Dr. Sarah Johnson',
                distance: '2.3 miles',
                address: '123 Medical Center Dr',
                rating: 4.8,
                availability: 'Next available: Tomorrow',
                specialty: 'Cardiologist'
              },
              {
                name: 'Dr. Michael Chen',
                distance: '3.1 miles',
                address: '456 Healthcare Ave',
                rating: 4.9,
                availability: 'Next available: Thursday',
                specialty: 'Pulmonologist'
              },
              {
                name: 'Dr. Emily Rodriguez',
                distance: '4.0 miles',
                address: '789 Wellness Blvd',
                rating: 4.7,
                availability: 'Next available: Friday',
                specialty: 'Neurologist'
              }
            ].map((doctor, index) => (
              <div key={`${messageId}-doctor-${index}`} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    <p className="text-sm text-gray-500">{doctor.address}</p>
                    <p className="text-sm text-gray-500">{doctor.distance}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 font-medium">★ {doctor.rating}</div>
                    <p className="text-sm text-gray-500">{doctor.availability}</p>
                  </div>
                </div>
                <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors">
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Is there anything else you'd like to know?
          </p>
        </div>
      )
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.trim();
    addMessage({ type: 'user', content: userInput });
    setInput('');

    switch (currentStep) {
      case 'age':
        handleAgeInput(userInput);
        break;
      case 'gender':
        handleGenderInput(userInput);
        break;
      case 'blood-pressure':
        handleBloodPressureInput(userInput);
        break;
      case 'cholesterol':
        handleCholesterolInput(userInput);
        break;
      case 'symptoms':
        await handleSymptomInput(userInput);
        break;
      case 'location':
        handleLocationInput(userInput);
        break;
    }
  };

  if (!modelReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <Brain className="h-16 w-16 text-indigo-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              SmartMed Assistant
            </h1>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Initializing AI Model</span>
                <span>{initializationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${initializationProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                {initializationProgress < 100 
                  ? "Please wait while I initialize..."
                  : "Almost ready..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-semibold text-gray-900">SmartMed Assistant</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white shadow-md'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder={
                  currentStep === 'age' ? "Enter your age..." :
                  currentStep === 'gender' ? "Enter your gender (Male/Female)..." :
                  currentStep === 'blood-pressure' ? "Enter your blood pressure level..." :
                  currentStep === 'cholesterol' ? "Enter your cholesterol level..." :
                  currentStep === 'symptoms' ? "Describe your symptoms..." :
                  currentStep === 'location' ? "Enter your ZIP code..." :
                  "Type your message..."
                }
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useRef, useEffect } from 'react';
import { getLlamaCompletion, getAirQualityData } from '../utils/llamaApi';
import { loadMedicalDataset } from '../utils/csvLoader';
import { SpecialistList } from './SpecialistList';
import HospitalDisplay from './HospitalDisplay';
import { useMedicationData, getMedicationRecommendations, Medication } from '../utils/medicationLoader';
import MedicationRecommendations from './MedicationRecommendations';
import { pdfjs } from '../utils/pdfSetup';

// Define the different types of messages
type MessageSender = 'bot' | 'user';

interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isTyping?: boolean;
}

// Define the different steps in the conversation
type ConversationStep = 
  | 'greeting' 
  | 'askSymptoms' 
  | 'askDuration' 
  | 'askSeverity' 
  | 'askAge'
  | 'askGender'
  | 'askBloodPressure'
  | 'askCholesterol'
  | 'askLocation' 
  | 'askLocationDetails' 
  | 'processingDoc'
  | 'processing' 
  | 'showResults';

// User data we collect during the conversation
interface UserData {
  symptoms: string;
  duration: string;
  severity: string;
  location: string;
  age?: string;
  gender?: string;
  bloodPressure?: string;
  cholesterolLevel?: string;
  medicalDocument?: string; // For document content
}

export const ChatInterface: React.FC = () => {
  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);
  // Current step in the conversation
  const [currentStep, setCurrentStep] = useState<ConversationStep>('greeting');
  // User input
  const [userInput, setUserInput] = useState('');
  // Collected user data
  const [userData, setUserData] = useState<UserData>({
    symptoms: '',
    duration: '',
    severity: '',
    location: '',
    age: '',
    gender: '',
    bloodPressure: '',
    cholesterolLevel: ''
  });
  // AI analysis results
  const [aiResults, setAiResults] = useState({
    insights: '',
    conditions: [] as string[],
    specialists: [] as string[],
    healthFactors: ''
  });
  // Selected specialist for filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  // Track if greeting was already shown
  const [greetingShown, setGreetingShown] = useState(false);
  // Track if hospital data has been shown
  const [hospitalDataShown, setHospitalDataShown] = useState(false);
  
  // Medication recommendations
  const [medicationRecommendations, setMedicationRecommendations] = useState<{
    medications: Medication[],
    warnings: string[]
  }>({ medications: [], warnings: [] });
  
  // Load medication data
  const { medicationData, loading: medicationsLoading } = useMedicationData();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // One-time initialization on mount - clear any stale messages
  useEffect(() => {
    // Clear messages on component mount to prevent duplicates from hot reloading
    setMessages([]);
    setGreetingShown(false);
    setHospitalDataShown(false);
  }, []);

  // Add initial greeting - completely isolated with its own reference
  const initialGreetingRef = useRef(false);
  
  useEffect(() => {
    // Only show greeting once per session and only if not already displayed
    if (!initialGreetingRef.current && currentStep === 'greeting') {
      // Set the ref to true immediately to prevent duplicates
      initialGreetingRef.current = true;
      
      // Show typing indicator
      setIsTyping(true);
      
      // Wait before displaying messages
      setTimeout(() => {
        setIsTyping(false);
        
        // Create greeting messages as a new array
        const newMessages = [
          {
            id: `greeting-1-${Date.now()}`,
            text: "👋 Hi there! I'm your MedGuide telemedicine assistant. I can analyze your symptoms, suggest appropriate medications, help find specialists, and analyze medical documents.",
            sender: 'bot' as const,
            timestamp: new Date()
          },
          {
            id: `greeting-2-${Date.now() + 100}`,
            text: "Please describe your symptoms, or you can upload a medical document for me to analyze.",
            sender: 'bot' as const,
            timestamp: new Date(Date.now() + 100)
          }
        ];
        
        // Set messages directly
        setMessages(newMessages);
        
        // Move to symptoms step
        setCurrentStep('askSymptoms');
      }, 1000);
    }
  }, []);

  // Add a bot message to the chat
  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Add a user message to the chat
  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Add typing indicator
  const addTypingIndicator = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  // Implement symptom keyword normalization
  const normalizeSymptoms = (text: string): Record<string, boolean> => {
    const normalized: Record<string, boolean> = {};
    
    // Common symptoms and their variations (including typos)
    const symptomMappings: Record<string, string[]> = {
      'fever': ['fever', 'fver', 'temperature', 'hot', 'feverish'],
      'cough': ['cough', 'coughing', 'caugh', 'coff'],
      'fatigue': ['fatigue', 'tired', 'exhausted', 'fatigued', 'fatigueness', 'fatigure'],
      'breath': ['breath', 'breathing', 'short of breath', 'shortness of breath', 'breathlessness', 'breth'],
      'headache': ['headache', 'head ache', 'head pain', 'ache in head', 'headpain', 'hedache'],
      'throat': ['throat', 'sore throat', 'throatpain', 'troat']
    };
    
    // Check for each symptom in the text
    const lowerText = text.toLowerCase();
    for (const [symptom, variations] of Object.entries(symptomMappings)) {
      if (variations.some(v => lowerText.includes(v))) {
        normalized[symptom] = true;
      } else {
        normalized[symptom] = false;
      }
    }
    
    return normalized;
  };

  // File upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract text from PDF files
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      console.log("PDF file received, size:", file.size, "bytes");
      
      // Use PDF.js directly without relying on window.pdfjsLib
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      console.log("Successfully extracted PDF text, length:", fullText.length);
      return fullText || "No text content could be extracted from the file";
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      
      // Fallback to simple text extraction
      try {
        const text = await file.text();
        console.log("Falling back to basic text extraction, length:", text.length);
        return text || "No text content could be extracted from the file";
      } catch (innerError) {
        console.error("Fallback text extraction also failed:", innerError);
        throw new Error("Failed to extract text from the document");
      }
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    addBotMessage(`I see you've uploaded a document (${file.name}). I'll analyze this for you.`);
    
    try {
      // Extract text from the uploaded file
      let extractedContent = '';
      
      if (file.type === 'application/pdf') {
        extractedContent = await extractTextFromPdf(file);
      } else if (file.type === 'application/json') {
        const jsonContent = await file.text();
        extractedContent = `JSON CONTENT:\n${jsonContent}`;
      } else if (file.type === 'text/csv') {
        const csvContent = await file.text();
        extractedContent = `CSV CONTENT:\n${csvContent}`;
      } else {
        extractedContent = await file.text();
      }
      
      if (!extractedContent || extractedContent.trim().length < 10) {
        throw new Error("Could not extract meaningful text from the document. Please try another file.");
      }
      
      // Store the extracted content in user data
      setUserData(prev => ({ ...prev, medicalDocument: extractedContent }));
      
      // Prompt for location for environmental analysis
      addBotMessage("Thank you for providing your medical document. To provide more comprehensive analysis, could you share your location (city name or ZIP code)? This helps me analyze environmental factors that might impact your health.");
      setCurrentStep('askLocationDetails');
      
    } catch (error) {
      addBotMessage(`I had trouble processing your document: ${error instanceof Error ? error.message : 'Unknown error'}. Could you describe your symptoms instead?`);
      setCurrentStep('askSymptoms');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Process user input
  const processUserInput = async () => {
    if (!userInput.trim()) return;
    
    // Add user message
    addUserMessage(userInput);
    
    // Save input before clearing
    const input = userInput;
    
    // Clear input field
    setUserInput('');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Process file upload command
    if (input.toLowerCase().includes('upload') || input.toLowerCase().includes('document')) {
      setTimeout(() => {
        addBotMessage("You can upload a medical document by clicking the upload button in the chat box. I'll analyze it for you.");
      }, 1000);
      return;
    }
    
    // Check for hospital/doctor search intent
    if (input.toLowerCase().includes('hospital') || 
        input.toLowerCase().includes('doctor') || 
        input.toLowerCase().includes('clinic') ||
        input.toLowerCase().includes('specialist') ||
        input.toLowerCase().includes('nearby') ||
        input.toLowerCase().includes('find')) {
      
      if (!userData.location) {
        setTimeout(() => {
          addBotMessage("To help you find nearby medical facilities, I need your location. Please share your city or ZIP code.");
          setCurrentStep('askLocationDetails');
        }, 1000);
      } else {
        showNearbyFacilities();
      }
      return;
    }
    
    // Process input based on current step
    switch (currentStep) {
      case 'askSymptoms':
        // Save symptoms
        setUserData(prev => ({ ...prev, symptoms: input }));
        
        // Check if the input is long enough to be a symptom description
        if (input.length > 10) {
        setTimeout(() => {
            addBotMessage("Thank you for describing your symptoms. How long have you been experiencing them?");
          setCurrentStep('askDuration');
        }, 1000);
        } else {
          // Use Llama API for a natural conversation about symptoms
          try {
            // Build conversation history for context
            const conversationHistory = messages.slice(-6).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            }));
            
            // Add the latest user input
            conversationHistory.push({
              role: 'user',
              content: input
            });
            
            // Call Llama API for a natural response
            const response = await getLlamaCompletion("", {
              includeContextualData: {
                conversationHistory
              }
            });
            
            // Try to parse the response
            try {
              const parsedResponse = JSON.parse(response);
              setTimeout(() => {
                // If it's JSON, use the insights field
                addBotMessage(parsedResponse.insights || "Could you tell me more about your symptoms? What specifically are you experiencing?");
                
                // Stay in the same step to collect more information
                setCurrentStep('askSymptoms');
              }, 1000);
            } catch (e) {
              // If it's not JSON, use the raw response
              setTimeout(() => {
                addBotMessage(response);
                setCurrentStep('askSymptoms');
              }, 1000);
            }
          } catch (error) {
            console.error("Error calling Llama API for conversation:", error);
            setTimeout(() => {
              addBotMessage("Could you tell me more about your symptoms? What specifically are you experiencing?");
              setCurrentStep('askSymptoms');
            }, 1000);
          }
        }
        break;

      case 'askDuration':
        setUserData(prev => ({ ...prev, duration: input }));
        setTimeout(() => {
          addBotMessage("On a scale of 1-10, how would you rate the severity of your symptoms?");
          setCurrentStep('askSeverity');
        }, 1000);
        break;

      case 'askSeverity':
        setUserData(prev => ({ ...prev, severity: input }));
        setTimeout(() => {
          addBotMessage("Thank you. What's your age? This helps me provide more accurate recommendations.");
          setCurrentStep('askAge');
        }, 1000);
        break;
        
      case 'askAge':
        setUserData(prev => ({ ...prev, age: input }));
        setTimeout(() => {
          addBotMessage("What's your gender? This is relevant for certain medical conditions.");
          setCurrentStep('askGender');
        }, 1000);
        break;
        
      case 'askGender':
        setUserData(prev => ({ ...prev, gender: input }));
        setTimeout(() => {
          addBotMessage("What city or region do you live in? This helps me analyze environmental factors that might affect your health.");
          setCurrentStep('askLocation');
        }, 1000);
        break;
        
      case 'askLocation':
        setUserData(prev => ({ ...prev, location: input }));
        
        // Now that we have all the info, analyze symptoms
        analyzeSymptoms(true);
        break;
        
      case 'askLocationDetails':
        setUserData(prev => ({ ...prev, location: input }));
        
        // If we have symptoms data, analyze with location
        if (userData.symptoms) {
          analyzeSymptoms(true);
        } else {
          // Just acknowledge the location
          addBotMessage(`Thank you for providing your location (${input}). I'll now analyze your medical document along with environmental factors in your area...`);
          
          // If we have a document, analyze with location
          if (userData.medicalDocument) {
            analyzeDocument();
          } else {
            // Otherwise, ask for symptoms
        setTimeout(() => {
              addBotMessage("Could you describe your symptoms or health concerns?");
              setCurrentStep('askSymptoms');
        }, 1000);
          }
        }
        break;

      case 'showResults':
      default:
        // For any other input after analysis is complete, use Llama API for a natural conversation
        try {
          // Build conversation history for context
          const conversationHistory = messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }));
          
          // Add the latest user input
          conversationHistory.push({
            role: 'user',
            content: input
          });
          
          // Add context about previous analysis
          const prompt = `
            You are a medical assistant chatting with a patient. The patient has already shared their symptoms: "${userData.symptoms}" 
            with severity ${userData.severity}/10 for a duration of ${userData.duration}.
            
            You previously provided these insights: "${aiResults.insights}"
            
            The patient is now asking: "${input}"
            
            Please respond in a helpful, conversational way. If they're asking about specialists, medications, or nearby facilities, 
            offer to show them that information.
          `;
          
          // Call Llama API for a natural response
          const response = await getLlamaCompletion(prompt);
          
          // Try to parse the response
          try {
            const parsedResponse = JSON.parse(response);
          setTimeout(() => {
              // If it's JSON, use the insights field
              addBotMessage(parsedResponse.insights || response);
          }, 1000);
          } catch (e) {
            // If it's not JSON, use the raw response
          setTimeout(() => {
              addBotMessage(response);
          }, 1000);
          }
        } catch (error) {
          console.error("Error calling Llama API for conversation:", error);
          setTimeout(() => {
            addBotMessage("I'm here to help with any other questions you might have about your health concerns.");
          }, 1000);
        }
        break;
    }
  };

  // Analyze symptoms using Llama and the medical dataset with enhanced data
  const analyzeSymptoms = async (showFacilities: boolean) => {
    try {
      setIsLoading(true);
      
      // Prepare relevant user data for analysis
      const userHealthData = {
        symptoms: userData.symptoms,
        duration: userData.duration,
        severity: userData.severity,
        age: userData.age,
        gender: userData.gender,
        bloodPressure: userData.bloodPressure,
        cholesterolLevel: userData.cholesterolLevel
      };
      
      // Get air quality data for the user's location if available
      let airQualityData = null;
      if (userData.location) {
        airQualityData = await getAirQualityData(userData.location);
        console.log("Air quality data:", airQualityData);
      }
      
      // Check if the user has respiratory symptoms
      const hasRespiratorySymptoms = 
        userData.symptoms.toLowerCase().includes("breath") || 
        userData.symptoms.toLowerCase().includes("cough") || 
        userData.symptoms.toLowerCase().includes("asthma") ||
        userData.symptoms.toLowerCase().includes("wheez") ||
        userData.symptoms.toLowerCase().includes("respir");
      
      // Create a comprehensive prompt that includes all relevant information
      let prompt = `
        Please analyze the following patient information and provide health recommendations:
        
        Patient symptoms: ${userData.symptoms}
        Duration of symptoms: ${userData.duration}
        Severity: ${userData.severity}
        ${userData.age ? `Age: ${userData.age}` : ''}
        ${userData.gender ? `Gender: ${userData.gender}` : ''}
        ${userData.bloodPressure ? `Blood Pressure: ${userData.bloodPressure}` : ''}
        ${userData.cholesterolLevel ? `Cholesterol Level: ${userData.cholesterolLevel}` : ''}
        ${userData.location ? `Location: ${userData.location}` : ''}
        
        Please provide:
        1. Analysis of the patient's symptoms
        2. Possible conditions to consider
        3. Recommended specialists to consult
        4. Medication recommendations if appropriate
        5. Health recommendations based on the patient's symptoms and demographics
        ${airQualityData ? `6. Environmental health considerations given the air quality (AQI: ${airQualityData.aqi}, Category: ${airQualityData.category})` : ''}
        
        Return your analysis as a JSON object with the following structure:
        {
          "insights": "Detailed analysis of symptoms and potential causes",
          "conditions": ["Possible condition 1", "Possible condition 2"],
          "specialists": ["Recommended specialist 1", "Recommended specialist 2"],
          "medications": ["Medication 1", "Medication 2"],
          "healthFactors": "General health recommendations",
          "environmentalConsiderations": "Analysis of how environmental factors may affect the patient's condition"
        }
      `;
      
      // Call the Llama API with environmental data included
      const llamaResponse = await getLlamaCompletion(prompt, {
        includeEnvironmentalFactors: true,
        includeContextualData: {
          airQuality: airQualityData,
          location: userData.location,
          normalizedSymptoms: normalizeSymptoms(userData.symptoms),
          hasRespiratorySymptoms
        }
      });
      
      try {
        // Parse Llama response
        const parsedResponse = JSON.parse(llamaResponse);
        
        // Format the air quality warning if applicable
        let environmentalAlert = "";
        if (airQualityData && 
            (airQualityData.category === "Unhealthy for Sensitive Groups" || 
             airQualityData.category === "Unhealthy" || 
             airQualityData.category === "Very Unhealthy")) {
          
          if (hasRespiratorySymptoms) {
            environmentalAlert = `⚠️ IMPORTANT: The air quality in your area (${userData.location}) is currently ${airQualityData.category.toUpperCase()} with an AQI of ${airQualityData.aqi}. This may be aggravating your respiratory symptoms. ${airQualityData.cautionaryStatement}`;
          }
        }
        
        // Set AI results state
        setAiResults({
          insights: parsedResponse.insights || "Analysis complete. Please consult a healthcare professional for a proper diagnosis.",
          conditions: parsedResponse.conditions || [],
          specialists: parsedResponse.specialists || [],
          healthFactors: environmentalAlert ? 
            `${environmentalAlert}\n\n${parsedResponse.healthFactors || parsedResponse.environmentalConsiderations || ""}` : 
            (parsedResponse.healthFactors || parsedResponse.environmentalConsiderations || "")
        });
        
        // Prepare medication recommendations if medications are suggested
        if (parsedResponse.medications && parsedResponse.medications.length > 0) {
          // Get the symptoms as a string
          const symptomsText = userData.symptoms;
          
          // Get the medication names as a string
          const medicationText = parsedResponse.medications.join(", ");
          
          // Call the medication recommendation function with proper parameters
          const medicationSuggestions = getMedicationRecommendations(
            symptomsText, 
            medicationText, 
            {
              age: userData.age ? parseInt(userData.age, 10) : undefined,
              hasRespiratoryCondition: hasRespiratorySymptoms && airQualityData ? airQualityData.aqi > 100 : false
            }
          );
          
          setMedicationRecommendations(medicationSuggestions);
        }
        
        // Update current step to show results
        setCurrentStep('showResults');
        
        // Show message with environmental alert if applicable
        setTimeout(() => {
          if (environmentalAlert) {
            addBotMessage(environmentalAlert);
          }
          
          // Show the analysis message
          addBotMessage("Based on your symptoms, I've analyzed potential causes and recommendations:");
          
          // If show facilities was requested, display that option
          if (showFacilities && userData.location) {
            setTimeout(() => {
              addBotMessage("Would you like to see healthcare facilities in your area that specialize in these conditions?");
              setHospitalDataShown(true);
            }, 500);
          }
        }, 500);
        
      } catch (error) {
        console.error("Error parsing Llama response:", error, llamaResponse);
        addBotMessage("I encountered an issue analyzing your symptoms. Please try describing them differently.");
        setCurrentStep('askSymptoms');
      }
    } catch (error) {
      console.error("Error in symptom analysis:", error);
      addBotMessage("I encountered an error analyzing your symptoms. Please try again.");
      setCurrentStep('askSymptoms');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze uploaded medical document
  const analyzeDocument = async () => {
    if (!userData.medicalDocument) return;
    
    try {
      setIsLoading(true);
      
      // Get air quality data for the user's location if available
      let airQualityData = null;
      if (userData.location) {
        airQualityData = await getAirQualityData(userData.location);
        console.log("Air quality data:", airQualityData);
      }
      
      // Check if the user has respiratory symptoms based on document content
      const hasRespiratorySymptoms = userData.medicalDocument.toLowerCase().includes("breath") || 
                                    userData.medicalDocument.toLowerCase().includes("cough") || 
                                    userData.medicalDocument.toLowerCase().includes("asthma") ||
                                    userData.medicalDocument.toLowerCase().includes("wheez") ||
                                    userData.medicalDocument.toLowerCase().includes("respir");
      
      // Create a comprehensive prompt for document analysis
      const prompt = `
        I need you to analyze this medical document and extract key information.
        Extract patient details, medical findings, diagnoses, and recommendations.
        
        ${userData.location && airQualityData ? `Also consider environmental factors in the patient's location. The current air quality index (AQI) is ${airQualityData.aqi} (${airQualityData.category}). Provide specific warnings if the patient's condition could be affected by air quality.` : ''}
        
        The document content is:
        ${userData.medicalDocument}
        
        Return your analysis as a JSON object with the following structure:
        {
          "insights": "Detailed analysis of the document and potential health implications",
          "conditions": ["Condition 1", "Condition 2"],
          "specialists": ["Recommended specialist 1", "Recommended specialist 2"],
          "medications": ["Medication 1", "Medication 2"],
          "labValues": [
            {"name": "Test name", "value": "Result value", "normalRange": "Normal range", "isAbnormal": true/false}
          ],
          "environmentalFactors": "Analysis of how environmental factors may affect the patient's condition",
          "recommendations": ["Recommendation 1", "Recommendation 2"]
        }
      `;
      
      // Call the Llama API with environmental data included
      const llamaResponse = await getLlamaCompletion(prompt, {
        includeEnvironmentalFactors: true,
        extractMedicalData: true,
        includeContextualData: airQualityData ? {
          airQuality: airQualityData,
          location: userData.location,
          hasRespiratorySymptoms
        } : undefined
      });
      
      try {
        // Parse Llama response
        const parsedResponse = JSON.parse(llamaResponse);
        
        // Format the air quality warning if applicable
        let environmentalAlert = "";
        if (airQualityData && 
            (airQualityData.category === "Unhealthy for Sensitive Groups" || 
             airQualityData.category === "Unhealthy" || 
             airQualityData.category === "Very Unhealthy")) {
          
          environmentalAlert = `⚠️ IMPORTANT: The air quality in your area (${userData.location}) is currently ${airQualityData.category.toUpperCase()} with an AQI of ${airQualityData.aqi}. ${airQualityData.cautionaryStatement}`;
        }
        
        // Set AI results state
        setAiResults({
          insights: parsedResponse.insights || "Analysis complete. Please consult a healthcare professional for a proper diagnosis.",
          conditions: parsedResponse.conditions || [],
          specialists: parsedResponse.specialists || [],
          healthFactors: environmentalAlert ? 
            `${environmentalAlert}\n\n${parsedResponse.environmentalFactors || ""}` : 
            (parsedResponse.environmentalFactors || "")
        });
        
        // Update current step to show results
        setCurrentStep('showResults');
        
        // Show message with environmental alert if applicable
        setTimeout(() => {
          if (environmentalAlert) {
            addBotMessage(environmentalAlert);
          }
          
          // Show the analysis message
          addBotMessage("Here's my analysis of your medical document:");
          
          // Add lab values if available
          if (parsedResponse.labValues && parsedResponse.labValues.length > 0) {
            const abnormalValues = parsedResponse.labValues.filter((lab: any) => lab.isAbnormal);
            if (abnormalValues.length > 0) {
              const abnormalList = abnormalValues.map((lab: any) => 
                `${lab.name}: ${lab.value} (normal range: ${lab.normalRange})`
              ).join('\n- ');
              
              addBotMessage(`⚠️ The following lab values are outside the normal range:\n- ${abnormalList}`);
            }
          }
          
          // Add recommendations if available
          if (parsedResponse.recommendations && parsedResponse.recommendations.length > 0) {
            const recommendationsList = parsedResponse.recommendations.join('\n- ');
            addBotMessage(`Recommendations:\n- ${recommendationsList}`);
          }
          
          // Show hospital data option if location is available
          if (userData.location) {
            setTimeout(() => {
              addBotMessage("Would you like to see healthcare facilities in your area that specialize in these conditions?");
              setHospitalDataShown(true);
            }, 500);
          }
        }, 500);
        
    } catch (error) {
        console.error("Error parsing Llama response:", error, llamaResponse);
        addBotMessage("I encountered an issue analyzing your document. Could you describe your health concerns directly instead?");
        setCurrentStep('askSymptoms');
      }
    } catch (error) {
      console.error("Error in document analysis:", error);
      addBotMessage("I encountered an error analyzing your document. Let's try a different approach. Could you describe your symptoms?");
      setCurrentStep('askSymptoms');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to show nearby facilities
  const showNearbyFacilities = () => {
    // If hospital data is already shown, don't add it again
    if (hospitalDataShown) {
      return;
    }

    // If location is empty, skip showing facilities
    if (!userData.location) {
      console.log("⚠️ No location provided, skipping facility display");
      return;
    }
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Check if we already showed a facilities message to avoid duplication
      const facilityMessageExists = messages.some(msg => 
        msg.sender === 'bot' && 
        msg.text.includes(`healthcare facilities near ${userData.location}`)
      );
      
      if (!facilityMessageExists) {
        addBotMessage(`Here are healthcare facilities near ${userData.location}:`);
      }
      
      // Check if we already have a hospital list displayed
      const hospitalListExists = messages.some(msg => 
        msg.sender === 'bot' && 
        msg.text === '**HOSPITAL_LIST**'
      );
      
      // Only add the hospital list component if it doesn't already exist
      if (!hospitalListExists) {
        // Force a small delay to ensure the message is displayed before adding hospitals
        setTimeout(() => {
          // Create a "hospital list message" element that will display the hospitals directly in chat
          const hospitalListMessage: Message = {
            id: Date.now().toString(),
            text: '**HOSPITAL_LIST**', // Special marker that we'll replace with the hospital component
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, hospitalListMessage]);
          setHospitalDataShown(true); // Mark hospital data as shown
        }, 500);
      } else {
        // If hospital list exists but flag wasn't set, set it now
        setHospitalDataShown(true);
      }
    }, 1000);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processUserInput();
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 py-2 px-4 bg-blue-100 text-blue-900 rounded-full inline-block">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  // Modified renderMessages to handle the special hospital list marker and medication recommendations
  const renderMessages = () => {
    return (
      <>
        {messages.map(message => {
          // Special handler for the hospital list message
          if (message.sender === 'bot' && message.text === '**HOSPITAL_LIST**') {
            return (
              <div key={message.id} className="mb-4 text-left">
                <div className="inline-block max-w-[95%] rounded-lg p-4 bg-gradient-to-r from-indigo-100 to-blue-100 text-blue-900 shadow-md">
                  <HospitalDisplay pincode={userData.location} specialty={selectedSpecialty} />
                </div>
              </div>
            );
          }
          
          // Special handler for medication recommendations
          if (message.sender === 'bot' && message.text === '**MEDICATION_RECOMMENDATIONS**') {
            console.log("🔎 Found MEDICATION_RECOMMENDATIONS marker in messages, rendering component");
            console.log("💊 Available medications:", medicationRecommendations.medications.length);
            console.log("⚠️ Available warnings:", medicationRecommendations.warnings.length);
            console.log("📋 Disclaimer:", medicationData?.disclaimer ? "available" : "not available");
            
            return (
              <div key={message.id} className="mb-4 text-left">
                <div className="inline-block max-w-[95%] rounded-lg p-4 bg-gradient-to-r from-indigo-100 to-blue-100 text-blue-900 shadow-md">
                  <MedicationRecommendations 
                    medications={medicationRecommendations.medications} 
                    warnings={medicationRecommendations.warnings}
                    disclaimer={medicationData?.disclaimer || "This information is for educational purposes only and not a substitute for professional medical advice."}
                  />
                </div>
              </div>
            );
          }

          // Regular message rendering
          return (
            <div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div 
                className={`inline-block max-w-[90%] px-4 py-2 rounded-lg shadow-md ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                    : 'bg-gradient-to-r from-indigo-100 to-blue-100 text-blue-900'
                }`}
              >
                {message.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="mb-4 text-left">
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </>
    );
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(e.target.value);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🩺</span>
              <h1 className="text-white text-xl font-bold">MedGuide</h1>
            </div>
            <div className="text-white text-sm">Telemedicine & Healthcare Navigation</div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          {renderMessages()}
        </div>
      </div>

      {/* Results - specialists dropdown (only show in results phase) */}
      {currentStep === 'showResults' && aiResults.specialists.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center">
              <label htmlFor="specialty" className="mr-2 text-gray-700 font-medium">Filter by specialist:</label>
              <select
                id="specialty"
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
                className="flex-1 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {aiResults.specialists.map((specialist, index) => (
                  <option key={index} value={specialist}>{specialist}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-white border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={1}
              disabled={isLoading || isTyping}
            />
            <button
              onClick={processUserInput}
              disabled={isLoading || isTyping || !userInput.trim()}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md transition-colors ${
                isLoading || isTyping || !userInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </span> 
                : 'Send'
              }
            </button>
            <button
              onClick={handleUploadClick}
              disabled={isLoading}
              className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
              title="Upload medical document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.csv,.json"
              className="hidden"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 
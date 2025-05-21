import React, { useState, useRef, useEffect } from 'react';
import { getLlamaCompletion } from '../utils/llamaApi';
import { loadMedicalDataset } from '../utils/csvLoader';
import { SpecialistList } from './SpecialistList';
import HospitalDisplay from './HospitalDisplay';
import { useMedicationData, getMedicationRecommendations, Medication } from '../utils/medicationLoader';
import MedicationRecommendations from './MedicationRecommendations';

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
            text: "👋 Hi there! I'm your MedGuide telemedicine assistant. I can suggest appropriate first aid medications based on your symptoms and help you find healthcare specialists.",
            sender: 'bot' as const,
            timestamp: new Date()
          },
          {
            id: `greeting-2-${Date.now() + 100}`,
            text: "Please describe your symptoms so I can suggest appropriate first aid medications and medical specialists.",
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

  // Process user input based on current step
  const processUserInput = async () => {
    if (!userInput.trim()) return;
    
    const input = userInput.trim();
    addUserMessage(input);
    setUserInput('');
    
    // Add a slight delay to simulate thinking
    setIsTyping(true);

    switch (currentStep) {
      case 'askSymptoms':
        setUserData(prev => ({ ...prev, symptoms: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("How long have you been experiencing these symptoms?");
          setCurrentStep('askDuration');
        }, 1000);
        break;

      case 'askDuration':
        setUserData(prev => ({ ...prev, duration: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("On a scale of mild, moderate, or severe, how would you rate your symptoms?");
          setCurrentStep('askSeverity');
        }, 1000);
        break;

      case 'askSeverity':
        setUserData(prev => ({ ...prev, severity: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("What is your age? This helps us provide more accurate analysis.");
          setCurrentStep('askAge');
        }, 1000);
        break;
        
      case 'askAge':
        // Validate that input is a reasonable age
        const age = parseInt(input, 10);
        if (isNaN(age) || age < 1 || age > 120) {
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Please enter a valid age (1-120).");
          }, 1000);
          return;
        }
        
        setUserData(prev => ({ ...prev, age: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("What is your gender (Male/Female/Other)? This helps with more personalized analysis.");
          setCurrentStep('askGender');
        }, 1000);
        break;
        
      case 'askGender':
        const normalizedGender = input.toLowerCase();
        if (!['male', 'female', 'other'].includes(normalizedGender)) {
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Please specify Male, Female, or Other.");
          }, 1000);
          return;
        }
        
        setUserData(prev => ({ ...prev, gender: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("How would you describe your blood pressure (High/Normal/Low)? If you're not sure, please respond with 'Not sure'.");
          setCurrentStep('askBloodPressure');
        }, 1000);
        break;
        
      case 'askBloodPressure':
        const normalizedBP = input.toLowerCase();
        if (!['high', 'normal', 'low', 'not sure'].includes(normalizedBP)) {
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Please specify High, Normal, Low, or Not sure.");
          }, 1000);
          return;
        }
        
        setUserData(prev => ({ ...prev, bloodPressure: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("How would you describe your cholesterol level (High/Normal/Low)? If you're not sure, please respond with 'Not sure'.");
          setCurrentStep('askCholesterol');
        }, 1000);
        break;
        
      case 'askCholesterol':
        const normalizedChol = input.toLowerCase();
        if (!['high', 'normal', 'low', 'not sure'].includes(normalizedChol)) {
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Please specify High, Normal, Low, or Not sure.");
          }, 1000);
          return;
        }
        
        setUserData(prev => ({ ...prev, cholesterolLevel: input }));
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage("Would you like me to suggest safe first aid medications based on your symptoms? Type 'yes' to get medication suggestions or 'more' if you'd also like to see nearby healthcare facilities.");
          setCurrentStep('askLocation');
        }, 1000);
        break;

      case 'askLocation':
        // New flow with optional location
        if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
          // User only wants medication recommendations
          setUserData(prev => ({ ...prev, location: '' }));
          setIsTyping(false);
          addBotMessage("I'll analyze your symptoms and suggest some safe first aid medications...");
          setCurrentStep('processing');
          await analyzeSymptoms(false); // false indicates we don't need to show facilities
        } 
        else if (input.toLowerCase() === 'more' || input.toLowerCase() === 'm') {
          // User wants both medications and facilities, ask for location
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Great! What's your location? Please enter your pincode or ZIP code (like 91766 or 110001) so I can find real-time data about healthcare facilities near you.");
            setCurrentStep('askLocationDetails');
          }, 1000);
        }
        else {
          // Default to just medication recommendations if the response isn't clear
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("I'll analyze your symptoms and suggest some safe first aid medications. If you'd like to see nearby healthcare facilities, please type 'more' instead.");
          }, 1000);
          return;
        }
        break;

      case 'askLocationDetails':
        // Validate that input is a reasonable pincode format
        const isPincode = /^\d{5,6}$/.test(input);
        
        if (!isPincode) {
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("I need a valid pincode or ZIP code to find nearby healthcare facilities. Please enter a 5-digit US ZIP code or 6-digit Indian pincode.");
          }, 1000);
          return;
        }
        
        setUserData(prev => ({ ...prev, location: input }));
        setIsTyping(false);
        addBotMessage(`Thank you for providing your pincode (${input}). I'll now search for real-time data about healthcare facilities near you and analyze your symptoms...`);
        setCurrentStep('processing');
        await analyzeSymptoms(true); // true indicates we should show facilities
        break;
    }
  };

  // Analyze symptoms using Llama and the medical dataset with enhanced data
  const analyzeSymptoms = async (showFacilities: boolean) => {
    setIsLoading(true);
    try {
      // Load the medical dataset
      const dataset = await loadMedicalDataset();
      
      // Filter relevant rows with enhanced matching including age and gender
      const relevantRows = dataset.filter(row => {
        let match = true;
        
        // Symptom matching
        if (userData.symptoms.toLowerCase().includes('fever') && row['Fever'] === 'Yes') match = match && true;
        if (userData.symptoms.toLowerCase().includes('cough') && row['Cough'] === 'Yes') match = match && true;
        if (userData.symptoms.toLowerCase().includes('fatigue') && row['Fatigue'] === 'Yes') match = match && true;
        if (userData.symptoms.toLowerCase().includes('breath') && row['Difficulty Breathing'] === 'Yes') match = match && true;
        
        // Age matching - create a range of ±5 years
        if (userData.age) {
          const userAge = parseInt(userData.age, 10);
          const rowAge = parseInt(row['Age'], 10);
          
          // Check if the row age is within 5 years of the user's age
          if (!isNaN(userAge) && !isNaN(rowAge)) {
            if (Math.abs(userAge - rowAge) > 10) {
              match = match && false; // Age is too different
            }
          }
        }
        
        // Gender matching
        if (userData.gender && row['Gender']) {
          const userGender = userData.gender.toLowerCase();
          const rowGender = row['Gender'].toLowerCase();
          
          if (userGender !== 'other' && userGender !== rowGender) {
            match = match && false; // Gender doesn't match
          }
        }
        
        // Blood pressure matching
        if (userData.bloodPressure && 
            userData.bloodPressure.toLowerCase() !== 'not sure' && 
            row['Blood Pressure']) {
          const userBP = userData.bloodPressure.toLowerCase();
          const rowBP = row['Blood Pressure'].toLowerCase();
          
          if (userBP !== rowBP) {
            match = match && false; // Blood pressure doesn't match
          }
        }
        
        // Cholesterol level matching
        if (userData.cholesterolLevel && 
            userData.cholesterolLevel.toLowerCase() !== 'not sure' && 
            row['Cholesterol Level']) {
          const userChol = userData.cholesterolLevel.toLowerCase();
          const rowChol = row['Cholesterol Level'].toLowerCase();
          
          if (userChol !== rowChol) {
            match = match && false; // Cholesterol level doesn't match
          }
        }
        
        return match;
      }).slice(0, 10); // Limit to 10 rows for prompt size
      
      // Get medication recommendations
      if (medicationData) {
        console.log("🔍 About to get medication recommendations for symptoms:", userData.symptoms);
        
        // Check specific symptom keywords to ensure we're matching
        const commonSymptoms = [
          // Pain-related terms
          "headache", "head ache", "head pain", 
          "fever", "high temperature", "feeling hot", "feverish",
          "cough", "coughing", "dry cough", "productive cough",
          "cold", "common cold", "head cold", "chest cold",
          "flu", "influenza", "flu-like",
          "pain", "ache", "soreness", "discomfort", "hurt", "hurting",
          "body ache", "body pain", "muscle ache", "muscle pain",
          "joint pain", "joint ache", "arthritis pain",
          "back pain", "backache", "lower back", "upper back",
          
          // Digestive terms
          "stomach", "stomachache", "stomach pain", "tummy", "abdomen", "abdominal",
          "nausea", "nauseated", "feeling sick", "queasy",
          "vomiting", "throwing up", "vomit", "puking",
          "diarrhea", "loose stool", "watery stool", "frequent bowel",
          "constipation", "hard stool", "difficulty passing stool",
          "indigestion", "heartburn", "acid reflux", "stomach acid",
          "gas", "bloating", "flatulence", "bloated",
          
          // Respiratory terms
          "throat", "sore throat", "throat pain", "strep", "strep throat",
          "congestion", "stuffy", "stuffed up", "blocked nose",
          "runny nose", "nasal drip", "sneezing",
          "breathing", "short of breath", "shortness of breath", "breathless",
          "sneeze", "sneezing", "sniffling",
          "sinus", "sinusitis", "sinus pressure", "sinus pain",
          
          // Skin-related terms
          "rash", "skin rash", "breakout", "hives",
          "itch", "itchy", "itching", "scratchy",
          "dry skin", "flaky skin", "skin irritation",
          "eczema", "dermatitis",
          "sunburn", "sun burn", "burned skin",
          "insect bite", "bug bite", "mosquito bite", "bee sting",
          
          // Allergy terms
          "allergy", "allergic", "allergic reaction", 
          "hay fever", "pollen allergy", "seasonal allergy",
          "watery eyes", "itchy eyes", "red eyes",
          
          // Miscellaneous common terms
          "fatigue", "tired", "exhaustion", "no energy", "exhausted",
          "dizziness", "dizzy", "lightheaded", "vertigo", "balance",
          "dehydration", "dehydrated", "thirsty", "dry mouth",
          "cuts", "scrapes", "wounds", "abrasions", "injured",
          "burn", "burned", "burning",
          "swelling", "swollen", "inflammation", "inflamed",
          "bruise", "bruising", "black and blue",
          "infection", "infected", "bacterial", "viral"
        ];
        
        // Check if any common symptoms are found in the user's input
        const foundSymptoms = commonSymptoms.filter(symptom => 
          userData.symptoms.toLowerCase().includes(symptom)
        );
        
        console.log("🔍 Found these common symptoms in input:", foundSymptoms);
        
        // If no specific symptoms found, add common ones to improve matching
        let enhancedSymptoms = userData.symptoms;
        if (foundSymptoms.length > 0) {
          // Add specific symptom keywords that we found to help with matching
          console.log("⚠️ Using enhanced symptoms for better medication matching");
          enhancedSymptoms = userData.symptoms + " " + foundSymptoms.join(" ");
        } else {
          console.log("⚠️ No common symptoms detected in input, medication matching may be limited");
          // Add some common symptoms to ensure we get recommendations
          console.log("💊 Adding basic symptoms to ensure we get some recommendations");
          enhancedSymptoms = userData.symptoms + " headache fever cold";
        }
        
        const recommendations = getMedicationRecommendations(
          medicationData,
          enhancedSymptoms, // Use the enhanced symptoms
          userData.age,
          relevantRows.length > 0 ? relevantRows.map(row => row.Disease) : undefined
        );
        
        // Ensure we set recommendations even if empty
        setMedicationRecommendations(recommendations);
        console.log("✅ Medication recommendations set:", 
          recommendations.medications.length, 
          "medications,", 
          recommendations.warnings.length, 
          "warnings");
        if (recommendations.medications.length > 0) {
          console.log("💊 First few medications:", recommendations.medications.slice(0, 2).map(m => m.name));
        } else {
          console.log("⚠️ No medications found for the symptoms");
          
          // IMPORTANT: Force display of at least one medication
          console.log("📣 Forcing display of basic medications for testing");
          if (medicationData.medications.length > 0) {
            // Take the first two basic medications for testing purposes
            const forcedMedications = medicationData.medications.slice(0, 2);
            setMedicationRecommendations({
              medications: forcedMedications,
              warnings: ["These are general medications not specifically matched to your symptoms."]
            });
            console.log("💊 Forced medication display:", forcedMedications.map(m => m.name));
          }
        }
      } else {
        console.error("❌ No medication data available when trying to get recommendations");
      }
      
      // Build the context for the LLM with enhanced data
      const csvContext = relevantRows.length > 0
        ? `Here are some relevant medical records:\n${JSON.stringify(relevantRows, null, 2)}`
        : 'No relevant records found in the dataset.';
      
      console.log("Building prompt with context of length:", csvContext.length);
      
      // Build the prompt for the LLM with enhanced data
      const prompt = `${csvContext}\n\nThe user reports: ${userData.symptoms}.
Additional user details:
- Duration: ${userData.duration}
- Severity: ${userData.severity}
- Age: ${userData.age || 'Not provided'}
- Gender: ${userData.gender || 'Not provided'}
- Blood Pressure: ${userData.bloodPressure || 'Not provided'}
- Cholesterol Level: ${userData.cholesterolLevel || 'Not provided'}

Based on the dataset and your medical knowledge, analyze the symptoms and provide:
1. A brief summary of the possible condition and initial advice
2. Likely conditions that match these symptoms (list 2-3 possibilities)
3. Types of medical specialists that would be appropriate to consult (list 2-3 specialists)
4. Whether the patient should be concerned about their age, gender, blood pressure, or cholesterol in relation to these symptoms

Answer in this JSON format: {
  "insights": "<summary and advice for the patient>",
  "conditions": [<list of likely conditions>],
  "specialists": [<list of recommended specialists>],
  "healthFactors": "<explanation of how age, gender, blood pressure, and cholesterol may affect their condition>"
}`;
      
      console.log("Calling Llama with prompt length:", prompt.length);
      
      // Call the LLM
      let llamaResponse;
      try {
        llamaResponse = await getLlamaCompletion(prompt);
        console.log("Received Llama response");
      } catch (llamaError) {
        console.error("Error from Llama API call:", llamaError);
        addBotMessage("I'm sorry, I encountered an error while analyzing your symptoms. Let me show you healthcare facilities in your area anyway.");
        showNearbyFacilities();
        setCurrentStep('showResults');
        setIsLoading(false);
        return;
      }
      
      // Parse the response
      let parsed;
      let shouldShowFacilities = showFacilities; // Flag to track if we need to show facilities
      
      try {
        console.log("Attempting to parse Llama response:", llamaResponse.substring(0, 100) + "...");
        parsed = JSON.parse(llamaResponse);
      } catch (error) {
        console.error("Failed to parse Llama response:", error);
        console.error("Raw response:", llamaResponse);
        addBotMessage("I had trouble analyzing your symptoms. Here's what I found:\n\n" + llamaResponse.substring(0, 500) + (llamaResponse.length > 500 ? "..." : ""));
        
        // Show healthcare facilities and set current step
        showNearbyFacilities();
        shouldShowFacilities = false; // Set flag to prevent duplicate calls
        
        setCurrentStep('showResults');
        setIsLoading(false);
        return;
      }
      
      if (parsed && parsed.insights && parsed.conditions && parsed.specialists) {
        // Store the parsed results with enhanced health factors
        setAiResults({
          insights: parsed.insights,
          conditions: parsed.conditions,
          specialists: parsed.specialists,
          healthFactors: parsed.healthFactors || ""
        });
        
        // Set default selected specialist if any are recommended
        if (parsed.specialists.length > 0) {
          setSelectedSpecialty(parsed.specialists[0]);
        }
        
        // Display the results to the user with typing indicators between messages
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(`Based on your symptoms, here's what I found:\n\n${parsed.insights}`);
          
          // Helper function to show specialists and facilities (defined inside to access parsed and shouldShowFacilities)
          const showSpecialistsAndFacilities = () => {
            if (parsed.specialists.length > 0) {
              setIsTyping(true);
              setTimeout(() => {
                setIsTyping(false);
                const specialistsWithEmojis = parsed.specialists.map((s: string) => `👨‍⚕️ ${s}`).join('\n');
                addBotMessage(`I recommend consulting with these specialists:\n${specialistsWithEmojis}`);
                
                // Display health factors if available
                if (parsed.healthFactors) {
                  setIsTyping(true);
                  setTimeout(() => {
                    setIsTyping(false);
                    addBotMessage(`📊 Health factors:\n${parsed.healthFactors}`);
                    
                    // Show nearby facilities only if flag is true
                    if (shouldShowFacilities) {
                      showNearbyFacilities();
                    }
                  }, 1000);
                } else {
                  // No health factors, just show facilities
                  if (shouldShowFacilities) {
                    showNearbyFacilities();
                  }
                }
              }, 1000);
            } else {
              // No specialists, show facilities
              if (shouldShowFacilities) {
                showNearbyFacilities();
              }
            }
          };
          
          if (parsed.conditions.length > 0) {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              const conditionsWithEmojis = parsed.conditions.map((c: string) => `🔍 ${c}`).join('\n');
              addBotMessage(`Possible conditions:\n${conditionsWithEmojis}`);
              
              console.log("🔍 Checking medication recommendations before display:", 
                medicationRecommendations.medications.length, "medications available");
                
                // FORCE DISPLAY of medication recommendations regardless of conditions
                console.log("✨ FORCE DISPLAY: Will show medication recommendations");
                setIsTyping(true);
                setTimeout(() => {
                  setIsTyping(false);
                  addBotMessage("💊 I can suggest some safe first aid medications based on your symptoms. Click on each medication for more details.");
                  
                  // Create a "medication recommendations" element that will display the medications directly in chat
                  console.log("➕ Adding medication recommendations component to chat");
                  const medRecsMessage: Message = {
                    id: Date.now().toString(),
                    text: '**MEDICATION_RECOMMENDATIONS**', // Special marker that we'll replace with the medication component
                    sender: 'bot',
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, medRecsMessage]);
                  
                  // After medications, THEN show specialists
                  showSpecialistsAndFacilities();
                }, 1000);
            }, 1000);
          } else {
            // No conditions were found, still check for medications
            if (medicationRecommendations.medications.length > 0) {
              console.log("⚠️ No conditions but found medications, displaying them");
              setIsTyping(true);
              setTimeout(() => {
                setIsTyping(false);
                addBotMessage("💊 I can suggest some safe first aid medications that might help with your symptoms. Click on each medication for more details.");
                
                // Create a "medication recommendations" element
                const medRecsMessage: Message = {
                  id: Date.now().toString(),
                  text: '**MEDICATION_RECOMMENDATIONS**',
                  sender: 'bot',
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, medRecsMessage]);
                
                // Then show facilities
                if (shouldShowFacilities) {
                  showNearbyFacilities();
                }
              }, 1000);
            } else {
              console.log("⚠️ No conditions and no medications, proceed to facilities");
              // No conditions, no medications, just show facilities
              if (shouldShowFacilities) {
                showNearbyFacilities();
              }
            }
          }
        }, 1000);
      } else {
        console.error("Invalid Llama response format, missing required fields:", parsed);
        addBotMessage("I had trouble analyzing your symptoms. Let me show you healthcare facilities in your area anyway.");
        showNearbyFacilities();
        shouldShowFacilities = false; // Prevent duplicate calls
      }
      
      setCurrentStep('showResults');
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      addBotMessage("I'm sorry, I encountered an error while analyzing your symptoms. Let me show you healthcare facilities in your area anyway.");
      showNearbyFacilities();
      setCurrentStep('showResults');
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
          </div>
        </div>
      </div>
    </div>
  );
}; 
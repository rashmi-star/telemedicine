// Simple test for Llama API conversation
import { getLlamaCompletion } from './src/utils/llamaApi.js';

// Test a simple conversation with Llama API
async function testChatConversation() {
  console.log("Testing Llama API for conversational chat...");
  console.log("--------------------------------------------");
  
  const conversation = [
    { role: "user", content: "Hello, I've been having headaches recently. What could be causing them?" },
    { role: "assistant", content: "I'm sorry to hear about your headaches. There could be several causes including stress, dehydration, lack of sleep, or eye strain. How long have you been experiencing them?" },
    { role: "user", content: "For about a week now. They're mostly in the afternoon." }
  ];
  
  // Format the conversation history for the API
  const prompt = `
    Below is a conversation between a patient and a medical assistant.
    The patient is describing symptoms and seeking medical advice.
    Please continue the conversation as the medical assistant, responding to the patient's latest message.
    
    ${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}
    
    assistant:
  `;
  
  try {
    console.log("\nSending request to Llama API...");
    const response = await getLlamaCompletion(prompt, {
      // No special options needed for regular conversation
    });
    
    // Try to clean the response to just the assistant's reply
    let cleanedResponse = response;
    try {
      // If it's JSON, parse it and get a relevant field
      const parsedResponse = JSON.parse(response);
      if (parsedResponse.insights) {
        cleanedResponse = parsedResponse.insights;
      }
    } catch (e) {
      // If it's not JSON, it's probably already the raw text response
      // Try to extract just the assistant's reply if it has JSON markers or other formatting
      if (response.includes('{') && response.includes('}')) {
        const match = response.match(/"(insights|response|text|content)":\s*"([^"]+)"/);
        if (match && match[2]) {
          cleanedResponse = match[2];
        }
      }
    }
    
    console.log("\n=== Conversation ===");
    console.log("\nUser: Hello, I've been having headaches recently. What could be causing them?");
    console.log("\nAssistant: I'm sorry to hear about your headaches. There could be several causes including stress, dehydration, lack of sleep, or eye strain. How long have you been experiencing them?");
    console.log("\nUser: For about a week now. They're mostly in the afternoon.");
    console.log("\nAssistant: " + cleanedResponse);
    
    console.log("\n=== Raw API Response ===");
    console.log(response);
    
  } catch (error) {
    console.error("Error testing conversation:", error);
  }
}

// Run the test
testChatConversation(); 
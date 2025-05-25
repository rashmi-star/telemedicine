// Simple test for Llama API conversation using CommonJS format
const fs = require('fs');
const path = require('path');
const { fetch } = require('undici');

// Read the API key directly from the file
function getApiKey() {
  try {
    const apiFilePath = path.join(__dirname, 'src', 'utils', 'llamaApi.ts');
    const content = fs.readFileSync(apiFilePath, 'utf8');
    const match = content.match(/apiKey = ["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
    return "API key not found";
  } catch (error) {
    console.error("Error reading API key:", error);
    return "Error reading API key";
  }
}

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
  
  const apiKey = getApiKey();
  console.log("Using API Key:", apiKey);
  
  try {
    console.log("\nSending request to Llama API...");
    
    // Make direct API call
    const response = await fetch("https://api.llama.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: [
          { role: "system", content: "You are a helpful medical assistant designed to have natural conversations about health concerns." },
          ...conversation.map(msg => ({ role: msg.role, content: msg.content }))
        ]
      })
    });
    
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      console.log("\n❌ Llama API conversation test failed");
      return;
    }
    
    const data = await response.json();
    console.log("\nAPI response received!");
    
    // Extract the assistant's response from API result
    let assistantResponse = "";
    if (data.completion_message?.content?.text) {
      assistantResponse = data.completion_message.content.text;
    } else if (data.choices?.[0]?.message?.content) {
      assistantResponse = data.choices[0].message.content;
    } else {
      assistantResponse = "I couldn't extract a response from the API result.";
    }
    
    // Print the conversation
    console.log("\n=== Conversation ===");
    console.log("\nUser: Hello, I've been having headaches recently. What could be causing them?");
    console.log("\nAssistant: I'm sorry to hear about your headaches. There could be several causes including stress, dehydration, lack of sleep, or eye strain. How long have you been experiencing them?");
    console.log("\nUser: For about a week now. They're mostly in the afternoon.");
    console.log("\nAssistant: " + assistantResponse);
    
    console.log("\n=== API Response Structure ===");
    console.log("Response ID:", data.id || "Not found");
    console.log("Model used:", data.model || "Unknown");
    console.log("Tokens used:", data.metrics?.find(m => m.metric === "num_total_tokens")?.value || "Unknown");
    
    console.log("\n✅ Llama API conversation test succeeded!");
    
  } catch (error) {
    console.error("Error testing conversation:", error);
    console.log("\n❌ Llama API conversation test failed");
  }
}

// Run the test
testChatConversation(); 
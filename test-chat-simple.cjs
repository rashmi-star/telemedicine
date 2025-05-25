// Simple interactive test for Llama API chat
const { fetch } = require('undici');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Llama API key
const apiKey = "LLM|1050039463644017|ZZzxjun1klZ76kW0xu5Zg4BW5-o";

// Store conversation history
const conversationHistory = [
  { role: "system", content: "You are a helpful and friendly medical assistant. Respond conversationally to the user's questions about their health concerns." }
];

// Function to call Llama API
async function callLlamaAPI(messages) {
  try {
    console.log("\nSending request to Llama API...");
    
    const response = await fetch("https://api.llama.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: messages
      })
    });
    
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return "Sorry, I encountered an error. Please try again.";
    }
    
    const data = await response.json();
    
    // Extract the assistant's response
    let assistantResponse = "";
    if (data.completion_message?.content?.text) {
      assistantResponse = data.completion_message.content.text;
    } else if (data.choices?.[0]?.message?.content) {
      assistantResponse = data.choices[0].message.content;
    } else {
      assistantResponse = "I couldn't extract a response from the API result.";
    }
    
    return assistantResponse;
  } catch (error) {
    console.error("Error calling Llama API:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

// Start the chat loop
async function startChat() {
  console.log("=================================================");
  console.log("🩺 MedGuide Chat Test with Llama API");
  console.log("=================================================");
  console.log("Type your health questions and chat with the AI.");
  console.log("Type 'exit' or 'quit' to end the conversation.");
  console.log("=================================================\n");
  
  askQuestion();
}

// Ask a question and process the response
function askQuestion() {
  rl.question("You: ", async (input) => {
    // Check for exit command
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log("\nThank you for using MedGuide Chat Test. Goodbye!");
      rl.close();
      return;
    }
    
    // Add user message to history
    conversationHistory.push({ role: "user", content: input });
    
    // Call Llama API
    const response = await callLlamaAPI(conversationHistory);
    
    // Add assistant response to history
    conversationHistory.push({ role: "assistant", content: response });
    
    // Display the response
    console.log("\nMedGuide Assistant: " + response + "\n");
    
    // Continue the conversation
    askQuestion();
  });
}

// Start the chat
startChat(); 
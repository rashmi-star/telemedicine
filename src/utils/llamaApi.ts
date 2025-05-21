export async function getLlamaCompletion(userPrompt: string): Promise<string> {
  const apiKey = "LLM|1050039463644017|ZZzxjun1klZ76kW0xu5Zg4BW5-o"; // Store securely in production!
  const url = "https://api.llama.com/v1/chat/completions";
  
  // Add system message to handle typos and focus on medical advice
  const body = {
    model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages: [
      { 
        role: "system", 
        content: "You are a helpful medical assistant designed to analyze symptoms and provide recommendations for specialists. Please ignore minor typos and grammatical errors in the user's description, focusing on extracting the medical symptoms. Always provide structured, clear outputs in the exact JSON format requested." 
      },
      { role: "user", content: userPrompt }
    ]
  };

  try {
    console.log("Calling Llama API with prompt:", userPrompt.substring(0, 100) + "...");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error("Llama API error:", response.status, response.statusText);
      // Fall back to a simple default response
      return JSON.stringify({
        insights: "I couldn't analyze your symptoms in detail. It's always best to consult with a healthcare professional for a proper diagnosis.",
        conditions: ["Unknown condition"],
        specialists: ["General Practitioner", "Family Doctor"]
      });
    }

    const data = await response.json();
    console.log("Llama API response format:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Handle the correct response format from Llama API
    let responseText = "";
    if (data.completion_message?.content?.text) {
      responseText = data.completion_message.content.text;
    } else if (data.choices?.[0]?.message?.content) {
      responseText = data.choices[0].message.content;
    } else {
      console.error("Unexpected Llama API response format:", data);
      responseText = JSON.stringify({
        insights: "I couldn't analyze your symptoms in detail. It's always best to consult with a healthcare professional for a proper diagnosis.",
        conditions: ["Unknown condition"],
        specialists: ["General Practitioner", "Family Doctor"]
      });
    }
    
    console.log("Extracted response text:", responseText.substring(0, 100) + "...");
    
    // Clean up the response to extract just the JSON
    return cleanupLlamaResponse(responseText);
  } catch (error) {
    console.error("Error calling Llama API:", error);
    // Provide a fallback response if API fails
    return JSON.stringify({
      insights: "I couldn't analyze your symptoms in detail. It's always best to consult with a healthcare professional for a proper diagnosis.",
      conditions: ["Unknown condition"],
      specialists: ["General Practitioner", "Family Doctor"]
    });
  }
}

/**
 * Clean up Llama API response to extract valid JSON
 */
function cleanupLlamaResponse(text: string): string {
  try {
    // First try to parse as is (might already be valid JSON)
    JSON.parse(text);
    console.log("Response is already valid JSON");
    return text;
  } catch (e) {
    console.log("Response is not valid JSON, attempting to extract JSON");
    // Not valid JSON, try to extract JSON from the text
    try {
      // Look for JSON object pattern
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonCandidate = jsonMatch[0];
        // Verify it's valid JSON
        JSON.parse(jsonCandidate);
        console.log("Successfully extracted JSON from text");
        return jsonCandidate;
      }
      
      // Try another approach - look for a code block with JSON
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        const jsonCandidate = codeBlockMatch[1];
        // Verify it's valid JSON
        JSON.parse(jsonCandidate);
        console.log("Successfully extracted JSON from code block");
        return jsonCandidate;
      }
      
      console.log("Could not extract valid JSON, creating fallback response");
      // If we can't find JSON, create our own
      return JSON.stringify({
        insights: text.length > 100 ? text.substring(0, 100) + "..." : text,
        conditions: ["Condition unclear from response"],
        specialists: ["General Practitioner"]
      });
    } catch (e2) {
      console.error("Error during JSON extraction:", e2);
      // If we still can't parse, return a safe fallback
      return JSON.stringify({
        insights: "I received information but couldn't process it properly. Please consult a healthcare professional for proper diagnosis.",
        conditions: ["Unknown condition"],
        specialists: ["General Practitioner", "Family Doctor"]
      });
    }
  }
}
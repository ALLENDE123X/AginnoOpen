import { SearchResult } from "./search";
import { constructPrompt } from "./prompt";
import Anthropic from "@anthropic-ai/sdk";

// Track daily message count
let messageCount = 0;
let lastResetDate = new Date().toDateString();

// Reset counter if it's a new day
const checkAndResetCounter = () => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    messageCount = 0;
    lastResetDate = today;
  }
};

// Initialize Anthropic client
const initAnthropic = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not defined in environment variables");
  }
  
  return new Anthropic({
    apiKey,
  });
};

/**
 * Generate a research response using Claude 3.5 Sonnet
 */
export async function generateResearchResponse(
  query: string,
  searchResults: SearchResult[]
): Promise<string> {
  // Check daily limit
  checkAndResetCounter();
  if (messageCount >= 30) {
    throw new Error("Daily message limit of 30 reached. Please try again tomorrow.");
  }

  const anthropic = initAnthropic();
  const prompt = constructPrompt(query, searchResults);
  
  try {
    // Increment message count
    messageCount++;
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      temperature: 0.7,
      system: prompt.systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt.userPrompt,
        }
      ]
    });

    // Extract content safely by checking the type
    let responseText = "No response generated.";
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if (firstContent.type === 'text') {
        responseText = firstContent.text;
      }
    }

    return responseText;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    // Decrement counter if API call failed
    messageCount = Math.max(0, messageCount - 1);
    throw new Error("Failed to generate research response");
  }
} 
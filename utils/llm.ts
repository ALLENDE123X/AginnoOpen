import { SearchResult } from "./search";
import { constructPrompt } from "./prompt";
import OpenAI from "openai";

// Initialize OpenAI client
const initOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables");
  }
  
  return new OpenAI({
    apiKey,
  });
};

/**
 * Generate a research response using GPT-4 Turbo
 */
export async function generateResearchResponse(
  query: string,
  searchResults: SearchResult[]
): Promise<string> {
  const openai = initOpenAI();
  const prompt = constructPrompt(query, searchResults);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: prompt.systemPrompt,
        },
        {
          role: "user",
          content: prompt.userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to generate research response");
  }
} 
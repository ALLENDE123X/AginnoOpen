import { SearchResult } from "./search";
import { constructPrompt } from "./prompt";
import OpenAI from "openai";
import { AgentResponse, AgentTraceStep } from "./types";
import { performSearch } from "./search";
import { addTraceStep } from "@/app/api/trace/route";

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
 * Generate a research response using GPT-4 Turbo with ReAct-style reasoning
 */
export async function generateResearchResponse(
  query: string,
  initialSearchResults: SearchResult[],
  chatId?: string
): Promise<AgentResponse> {
  const openai = initOpenAI();
  const traceSteps: AgentTraceStep[] = [];
  
  // Step 1: Planning - Initial thought about how to approach the query
  const planningStep = await generatePlanningStep(openai, query, initialSearchResults);
  traceSteps.push(planningStep);
  
  // Send real-time update if chatId is provided
  if (chatId) {
    addTraceStep(chatId, planningStep);
  }
  
  // Step 2: Iterative tool use - Perform multiple searches as needed
  const iterativeSteps = await performIterativeResearch(openai, query, planningStep.reflection || '', traceSteps, chatId);
  
  // Step 3: Generate final output with reflection
  const finalOutput = await generateFinalOutput(openai, query, traceSteps);
  
  return {
    traceSteps,
    finalOutput
  };
}

/**
 * Generate the initial planning step
 */
async function generatePlanningStep(
  openai: OpenAI,
  query: string,
  searchResults: SearchResult[]
): Promise<AgentTraceStep> {
  const planningPrompt = `
You are a research agent tasked with answering: "${query}"

Below are initial search results:
${searchResults.map((r, i) => `${i+1}. ${r.title} - ${r.link}`).join('\n')}

Create a plan for how you'll approach this research question. What are the key aspects to investigate?
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a helpful research agent that creates detailed plans for research questions.",
      },
      {
        role: "user",
        content: planningPrompt,
      },
    ],
    temperature: 0.7,
  });

  const plan = response.choices[0]?.message?.content || "No plan generated.";
  
  return {
    thought: "I need to plan how to approach this research question.",
    action: `Initial planning for query: "${query}"`,
    observation: "Received initial search results and created a research plan.",
    reflection: plan,
    tool: "Planning"
  };
}

/**
 * Perform iterative research with multiple search queries
 */
async function performIterativeResearch(
  openai: OpenAI,
  originalQuery: string,
  plan: string,
  traceSteps: AgentTraceStep[],
  chatId?: string
): Promise<void> {
  // We'll do up to 3 iterations of search and refinement
  for (let i = 0; i < 3; i++) {
    // Generate a refined search query based on previous steps
    const refinedQuery = await generateRefinedQuery(openai, originalQuery, traceSteps);
    
    // Perform the search with the refined query
    const searchStep: AgentTraceStep = {
      thought: `I need to search for more specific information about this topic.`,
      action: `Searching for: "${refinedQuery}"`,
      observation: "Waiting for search results...",
      tool: "Web Search"
    };
    
    traceSteps.push(searchStep);
    
    // Send real-time update if chatId is provided
    if (chatId) {
      addTraceStep(chatId, searchStep);
    }
    
    try {
      // Execute the search
      const searchResults = await performSearch(refinedQuery);
      
      // Update the observation with search results
      searchStep.observation = `Found ${searchResults.length} results for refined query.`;
      
      // Send real-time update with updated observation if chatId is provided
      if (chatId) {
        addTraceStep(chatId, searchStep);
      }
      
      // Analyze the results and determine if they're helpful
      const analysisStep = await analyzeSearchResults(openai, refinedQuery, searchResults, traceSteps);
      traceSteps.push(analysisStep);
      
      // Send real-time update if chatId is provided
      if (chatId) {
        addTraceStep(chatId, analysisStep);
      }
      
      // If the analysis indicates we have enough information, break the loop
      if (analysisStep.reflection?.includes("sufficient information") || 
          analysisStep.reflection?.includes("enough information")) {
        break;
      }
    } catch (error) {
      console.error("Error during search iteration:", error);
      searchStep.observation = "Error occurred during search.";
      
      // Send real-time update with error if chatId is provided
      if (chatId) {
        addTraceStep(chatId, searchStep);
      }
      
      break;
    }
  }
}

/**
 * Generate a refined search query based on previous steps
 */
async function generateRefinedQuery(
  openai: OpenAI,
  originalQuery: string,
  traceSteps: AgentTraceStep[]
): Promise<string> {
  const traceContext = traceSteps.map((step, i) => 
    `Step ${i+1}:\nThought: ${step.thought}\nAction: ${step.action}\nObservation: ${step.observation}\nReflection: ${step.reflection || 'N/A'}`
  ).join('\n\n');
  
  const refinementPrompt = `
Original query: "${originalQuery}"

Research progress so far:
${traceContext}

Based on the research so far, generate a refined search query that will help gather more specific 
information. The new query should be more targeted and help fill gaps in the current research.

Output only the new search query text without any other explanation.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a helpful research agent that generates refined search queries.",
      },
      {
        role: "user",
        content: refinementPrompt,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() || originalQuery;
}

/**
 * Analyze search results and determine if they're helpful
 */
async function analyzeSearchResults(
  openai: OpenAI,
  query: string,
  searchResults: SearchResult[],
  traceSteps: AgentTraceStep[]
): Promise<AgentTraceStep> {
  const resultsContext = searchResults.map((r, i) => 
    `Result ${i+1}:\nTitle: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
  ).join('\n\n');
  
  const analysisPrompt = `
Search query: "${query}"

Search results:
${resultsContext}

Analyze these search results. How relevant are they to our research question? 
What new information do they provide? Do we have sufficient information now, 
or should we search for something else?
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a helpful research agent that analyzes search results for relevance and information value.",
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ],
    temperature: 0.7,
  });

  const analysis = response.choices[0]?.message?.content || "No analysis generated.";
  
  return {
    thought: "I need to evaluate if these search results are helpful for my research.",
    action: `Analyzing results from query: "${query}"`,
    observation: `Analyzed ${searchResults.length} search results for relevance.`,
    reflection: analysis,
    tool: "Analysis"
  };
}

/**
 * Generate the final comprehensive output
 */
async function generateFinalOutput(
  openai: OpenAI,
  originalQuery: string,
  traceSteps: AgentTraceStep[]
): Promise<string> {
  const traceContext = traceSteps.map((step, i) => 
    `Step ${i+1}:\nThought: ${step.thought}\nAction: ${step.action}\nObservation: ${step.observation}\nReflection: ${step.reflection || 'N/A'}`
  ).join('\n\n');
  
  const finalPrompt = `
Original research question: "${originalQuery}"

Research process:
${traceContext}

Based on all the research steps above, generate a comprehensive answer to the original question.
Your answer should:
1. Include a clear introduction
2. Present key findings with bullet points where appropriate
3. Organize information in numbered sections
4. Include relevant hyperlinks as [Title](URL) when referencing sources
5. End with a conclusion and reflection on the quality and limitations of the information

Format your response with Markdown for better readability.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a helpful research agent that produces comprehensive, well-formatted research reports.",
      },
      {
        role: "user",
        content: finalPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "No response generated.";
} 
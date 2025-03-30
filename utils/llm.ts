import { SearchResult } from "./search";
import { constructPrompt } from "./prompt";
import OpenAI from "openai";
import { AgentResponse, AgentTraceStep } from "./types";
import { performSearch } from "./search";

// Global OpenAI client to avoid re-initialization
let openaiClient: OpenAI | null = null;

// Initialize OpenAI client
const initOpenAI = () => {
  if (openaiClient) return openaiClient;
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables");
  }
  
  openaiClient = new OpenAI({
    apiKey,
  });
  
  return openaiClient;
};

// Use a faster model for less critical tasks
const FAST_MODEL = "gpt-4-turbo-preview"; // Could be replaced with gpt-3.5-turbo for even faster performance
const DEFAULT_MODEL = "gpt-4-turbo-preview";

/**
 * Generate a research response using GPT-4 Turbo with ReAct-style reasoning
 */
export async function generateResearchResponse(
  query: string,
  initialSearchResults: SearchResult[]
): Promise<AgentResponse> {
  console.time('llm-total');
  const openai = initOpenAI();
  const traceSteps: AgentTraceStep[] = [];
  
  try {
    // Step 1: Planning - Initial thought about how to approach the query
    console.time('planning-step');
    const planningStep = await generatePlanningStep(openai, query, initialSearchResults);
    console.timeEnd('planning-step');
    traceSteps.push(planningStep);
    
    // Step 2: Iterative tool use - Perform multiple searches as needed
    // Limit to just 2 iterations maximum instead of 3 to improve performance
    console.time('iterative-research');
    await performIterativeResearch(openai, query, planningStep.reflection || '', traceSteps, 2);
    console.timeEnd('iterative-research');
    
    // Step 3: Generate final output with reflection
    console.time('final-output');
    const finalOutput = await generateFinalOutput(openai, query, traceSteps);
    console.timeEnd('final-output');
    
    return {
      traceSteps,
      finalOutput
    };
  } finally {
    console.timeEnd('llm-total');
  }
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
    model: FAST_MODEL,
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
    reflection: plan
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
  maxIterations: number = 2
): Promise<void> {
  // Reduce iterations to improve performance
  for (let i = 0; i < maxIterations; i++) {
    console.time(`iteration-${i+1}`);
    
    // Generate a refined search query based on previous steps
    console.time(`refined-query-${i+1}`);
    const refinedQuery = await generateRefinedQuery(openai, originalQuery, traceSteps);
    console.timeEnd(`refined-query-${i+1}`);
    
    // Perform the search with the refined query
    const searchStep: AgentTraceStep = {
      thought: `I need to search for more specific information about this topic.`,
      action: `Searching for: "${refinedQuery}"`,
      observation: "Waiting for search results...",
    };
    
    traceSteps.push(searchStep);
    
    try {
      // Execute the search
      console.time(`search-execution-${i+1}`);
      const searchResults = await performSearch(refinedQuery);
      console.timeEnd(`search-execution-${i+1}`);
      
      // Update the observation with search results
      searchStep.observation = `Found ${searchResults.length} results for refined query.`;
      
      // Analyze the results and determine if they're helpful
      console.time(`analysis-${i+1}`);
      const analysisStep = await analyzeSearchResults(openai, refinedQuery, searchResults, traceSteps);
      console.timeEnd(`analysis-${i+1}`);
      traceSteps.push(analysisStep);
      
      // If the analysis indicates we have enough information, break the loop
      if (analysisStep.reflection?.includes("sufficient information") || 
          analysisStep.reflection?.includes("enough information")) {
        break;
      }
    } catch (error) {
      console.error("Error during search iteration:", error);
      searchStep.observation = "Error occurred during search.";
      break;
    } finally {
      console.timeEnd(`iteration-${i+1}`);
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
  // Use only the most recent steps to reduce context size
  const recentSteps = traceSteps.slice(-3);
  
  const traceContext = recentSteps.map((step, i) => 
    `Step ${traceSteps.length - recentSteps.length + i + 1}:\nThought: ${step.thought}\nAction: ${step.action}\nObservation: ${step.observation}\nReflection: ${step.reflection || 'N/A'}`
  ).join('\n\n');
  
  const refinementPrompt = `
Original query: "${originalQuery}"

Recent research progress:
${traceContext}

Based on the research so far, generate a refined search query that will help gather more specific 
information. The new query should be more targeted and help fill gaps in the current research.

Output only the new search query text without any other explanation.
`;

  const response = await openai.chat.completions.create({
    model: FAST_MODEL,
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
    max_tokens: 100 // Limit token usage for faster response
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
  // Limit the number of results to analyze to save tokens
  const resultsToAnalyze = searchResults.slice(0, 5);
  
  const resultsContext = resultsToAnalyze.map((r, i) => 
    `Result ${i+1}:\nTitle: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
  ).join('\n\n');
  
  const analysisPrompt = `
Search query: "${query}"

Top search results:
${resultsContext}

Analyze these search results. How relevant are they to our research question? 
What new information do they provide? Do we have sufficient information now, 
or should we search for something else?
`;

  const response = await openai.chat.completions.create({
    model: FAST_MODEL,
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
    max_tokens: 300 // Limit token usage for faster response
  });

  const analysis = response.choices[0]?.message?.content || "No analysis generated.";
  
  return {
    thought: "I need to evaluate if these search results are helpful for my research.",
    action: `Analyzing results from query: "${query}"`,
    observation: `Analyzed ${searchResults.length} search results for relevance.`,
    reflection: analysis
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
  // Include only essential steps to reduce context size
  const essentialSteps = [
    traceSteps[0], // Planning step
    ...traceSteps.filter(step => 
      step.action.includes("Analyzing results") && step.reflection
    ).slice(-2) // Last 2 analysis steps
  ];
  
  const traceContext = essentialSteps.map((step, i) => 
    `Step ${i+1}:\nThought: ${step.thought}\nAction: ${step.action}\nObservation: ${step.observation}\nReflection: ${step.reflection || 'N/A'}`
  ).join('\n\n');
  
  const finalPrompt = `
Original research question: "${originalQuery}"

Key research insights:
${traceContext}

Based on these research insights, generate a comprehensive answer to the original question.
Your answer should:
1. Include a clear introduction
2. Present key findings with bullet points where appropriate
3. Organize information in numbered sections when helpful
4. Include relevant details but be concise
5. End with a brief conclusion noting any limitations of the research

Respond directly to the question without disclaimers about the research process.
`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL, // Use the higher quality model for the final output
    messages: [
      {
        role: "system",
        content: "You are a helpful research assistant that generates comprehensive, well-structured answers based on research insights.",
      },
      {
        role: "user",
        content: finalPrompt,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "Unable to generate a response based on the research.";
} 
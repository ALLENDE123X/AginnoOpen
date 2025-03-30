import { SearchResult } from "./search";
import { constructPrompt } from "./prompt";
import OpenAI from "openai";
import { AgentResponse, AgentTraceStep } from "./types";
import { performSearch } from "./search";

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
  previousContext: string = ""
): Promise<AgentResponse> {
  console.time('llm-total');
  const openai = initOpenAI();
  const traceSteps: AgentTraceStep[] = [];
  
  try {
    // Step 1: Planning - Initial thought about how to approach the query
    console.time('planning-step');
    const planningStep = await generatePlanningStep(openai, query, initialSearchResults, previousContext);
    console.timeEnd('planning-step');
    traceSteps.push(planningStep);
    
    // Step 2: Iterative tool use - Perform multiple searches as needed
    // Limit to just 2 iterations maximum instead of 3 to improve performance
    console.time('iterative-research');
    await performIterativeResearch(openai, query, planningStep.reflection || '', traceSteps, 2);
    console.timeEnd('iterative-research');
    
    // Step 3: Generate final output with reflection
    console.time('final-output');
    const finalOutput = await generateFinalOutput(openai, query, traceSteps, previousContext);
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
  searchResults: SearchResult[],
  previousContext: string = ""
): Promise<AgentTraceStep> {
  const contextSection = previousContext ? 
    `\nPrevious conversation context:\n${previousContext}\n\nThis appears to be a follow-up question. Consider the previous context when planning your research.` : 
    '';

  const planningPrompt = `
You are a research agent tasked with answering: "${query}"

Below are initial search results:
${searchResults.map((r, i) => `${i+1}. ${r.title} - ${r.link}`).join('\n')}

Create a plan for how you'll approach this research question. What are the key aspects to investigate?${contextSection}
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
  maxIterations: number = 3
): Promise<void> {
  // Keep track of unsuccessful searches
  let consecutiveFailures = 0;
  
  // We'll do up to 3 iterations of search and refinement
  for (let i = 0; i < maxIterations; i++) {
    // Generate a refined search query based on previous steps
    const refinedQuery = await generateRefinedQuery(openai, originalQuery, traceSteps);
    
    // Perform the search with the refined query
    const searchStep: AgentTraceStep = {
      thought: `I need to search for more specific information about this topic.`,
      action: `Searching for: "${refinedQuery}"`,
      observation: "Waiting for search results...",
    };
    
    traceSteps.push(searchStep);
    
    try {
      // Execute the search
      const searchResults = await performSearch(refinedQuery);
      
      // Check if we got real results or mock results (mock results all have example domains)
      const hasMockResults = searchResults.every(result => 
        result.link.includes('example.com') || 
        result.link.includes('example.org') || 
        result.link.includes('example.net') || 
        result.link.includes('wikipedia.org/wiki/example')
      );
      
      if (hasMockResults) {
        consecutiveFailures++;
        searchStep.observation = `Search returned no real results (using generated placeholders instead).`;
        
        // If we've had too many failures, break the loop
        if (consecutiveFailures >= 2) {
          searchStep.observation += ` After multiple search failures, proceeding with available information.`;
          break;
        }
      } else {
        // Reset failure counter on successful search
        consecutiveFailures = 0;
        searchStep.observation = `Found ${searchResults.length} results for refined query.`;
      }
      
      // Analyze the results and determine if they're helpful
      const analysisStep = await analyzeSearchResults(openai, refinedQuery, searchResults, traceSteps);
      traceSteps.push(analysisStep);
      
      // If the analysis indicates we have enough information, break the loop
      if (analysisStep.reflection?.includes("sufficient information") || 
          analysisStep.reflection?.includes("enough information")) {
        break;
      }
    } catch (error) {
      console.error("Error during search iteration:", error);
      searchStep.observation = "Error occurred during search.";
      consecutiveFailures++;
      
      // If we've had too many failures, break the loop
      if (consecutiveFailures >= 2) {
        searchStep.observation += ` After multiple search failures, proceeding with available information.`;
        break;
      }
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

IMPORTANT: Output only the plain search query text. Do not include any quotation marks, brackets,
or other special characters around your query. Just provide the raw search terms.

For example:
Good: Atlanta best public high schools 2023 rankings
Bad: "Atlanta best public high schools 2023 rankings"
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a helpful research agent that generates refined search queries. You always output just the plain search query without any quotation marks or other decorations.",
      },
      {
        role: "user",
        content: refinementPrompt,
      },
    ],
    temperature: 0.7,
  });

  // Strip any quotes that might still be present in the response
  let refinedQuery = response.choices[0]?.message?.content?.trim() || originalQuery;
  refinedQuery = refinedQuery.replace(/^["'](.*)["']$/, '$1');
  
  return refinedQuery;
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
  // Check if these are mock results
  const hasMockResults = searchResults.every(result => 
    result.link.includes('example.com') || 
    result.link.includes('example.org') || 
    result.link.includes('example.net') || 
    result.link.includes('wikipedia.org/wiki/example')
  );

  const resultsContext = searchResults.map((r, i) => 
    `Result ${i+1}:\nTitle: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
  ).join('\n\n');
  
  const mockResultsWarning = hasMockResults ? 
    `NOTE: The search returned no actual results from the web. The results below are generated placeholders. 
    You should continue searching with different terms or consider that the information may not be readily available online.` : '';
  
  const analysisPrompt = `
Search query: "${query}"

${mockResultsWarning}

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
  
  const observation = hasMockResults ? 
    `Analyzed ${searchResults.length} placeholder results (no actual search results were found).` :
    `Analyzed ${searchResults.length} search results for relevance.`;
  
  return {
    thought: "I need to evaluate if these search results are helpful for my research.",
    action: `Analyzing results from query: "${query}"`,
    observation: observation,
    reflection: analysis
  };
}

/**
 * Generate the final comprehensive output
 */
async function generateFinalOutput(
  openai: OpenAI,
  originalQuery: string,
  traceSteps: AgentTraceStep[],
  previousContext: string = ""
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
  
  // Add previous conversation context if available
  const contextSection = previousContext ? 
    `\n\nPrevious conversation context:\n${previousContext}\n\nThis appears to be a follow-up question. Ensure your response builds on the previous conversation.` : 
    '';
  
  const finalPrompt = `
Original research question: "${originalQuery}"

Key research insights:
${traceContext}${contextSection}

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
    model: "gpt-4-turbo-preview",
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
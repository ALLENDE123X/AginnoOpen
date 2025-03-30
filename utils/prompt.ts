import { SearchResult } from "./search";
import { AgentTraceStep } from "./types";

/**
 * Constructs a prompt for the LLM based on the given parameters
 */
export function constructPrompt(
  query: string,
  searchResults: SearchResult[],
  traceSteps: AgentTraceStep[] = [],
  previousContext: string = ""
): string {
  // Format search results for inclusion in the prompt
  const resultsContext = searchResults.map((r, i) => 
    `Result ${i+1}:\nTitle: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
  ).join('\n\n');
  
  // Format trace steps if available
  const traceContext = traceSteps.length > 0 
    ? traceSteps.map((step, i) => 
        `Step ${i+1}:\nThought: ${step.thought}\nAction: ${step.action}\nObservation: ${step.observation}\nReflection: ${step.reflection || 'N/A'}`
      ).join('\n\n')
    : "";
  
  // Add previous conversation context if available
  const contextSection = previousContext 
    ? `\n\nPrevious conversation context:\n${previousContext}\n\nThis appears to be a follow-up question. Ensure your response builds on the previous conversation.` 
    : '';
  
  // Construct the final prompt
  return `
Research question: "${query}"

${searchResults.length > 0 ? `Search results:\n${resultsContext}\n\n` : ''}
${traceSteps.length > 0 ? `Research progress:\n${traceContext}\n\n` : ''}
${contextSection}

Based on the information above, provide a comprehensive answer to the research question.
`;
} 
import { SearchResult } from "./search";

interface Prompt {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Constructs a ReAct-style prompt for the AI agent
 */
export function constructPrompt(query: string, searchResults: SearchResult[]): Prompt {
  const systemPrompt = `
You are a helpful AI research agent. The user will give you a research goal. 
Plan your approach first. Use the search results provided to extract useful insights. 
Summarize the information in bullet points, add relevant hyperlinks, and finish with a 
reflection on the information's strengths or limitations.

Follow these steps in your response:
1. Begin with a brief introduction to the topic.
2. List key findings as bullet points.
3. Provide a detailed analysis with numbered sections.
4. Include relevant hyperlinks as [Title](URL) when referencing sources.
5. End with a conclusion that reflects on the information quality.

Use markdown formatting for better readability.
`;

  // Format search results for the prompt
  const formattedResults = searchResults
    .map(
      (result, index) => `
RESULT ${index + 1}:
Title: ${result.title}
URL: ${result.link}
Snippet: ${result.snippet}
`
    )
    .join("\n");

  const userPrompt = `
I need to research: ${query}

Here are the search results to help with the research:

${formattedResults}

Using the above search results, conduct thorough research on this topic and provide a 
comprehensive answer. Format your response with markdown for readability.
`;

  return {
    systemPrompt,
    userPrompt,
  };
} 
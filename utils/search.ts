/**
 * Serper.dev Search API utility
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SearchResponse {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
    num: number;
    type: string;
  };
  organic: SearchResult[];
  serpapi_pagination: {
    current: number;
    next_link: string | null;
    next: string | null;
    other_pages: Record<string, string>;
  };
}

/**
 * Performs a web search using the Serper.dev API
 */
export async function performSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not defined in environment variables");
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "us",
      hl: "en",
      num: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Search API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as SearchResponse;
  return data.organic || [];
} 
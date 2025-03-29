import { NextRequest, NextResponse } from "next/server";
import { performSearch } from "@/utils/search";
import { generateResearchResponse } from "@/utils/llm";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Valid query parameter is required" },
        { status: 400 }
      );
    }

    // 1. Perform web search
    const searchResults = await performSearch(query);

    if (!searchResults.length) {
      return NextResponse.json(
        { error: "No search results found" },
        { status: 404 }
      );
    }

    // 2. Generate research response using Claude
    try {
      const researchResponse = await generateResearchResponse(query, searchResults);
      // 3. Return the response
      return NextResponse.json({ response: researchResponse });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate research response";
      // Check if it's the daily limit error
      if (errorMessage.includes("Daily message limit")) {
        return NextResponse.json(
          { error: errorMessage },
          { status: 429 } // Too Many Requests status
        );
      }
      throw err; // Re-throw for general error handling
    }
  } catch (error) {
    console.error("Error in /api/ask route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 
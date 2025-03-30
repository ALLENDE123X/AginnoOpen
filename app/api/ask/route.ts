import { NextRequest, NextResponse } from "next/server";
import { performSearch } from "@/utils/search";
import { generateResearchResponse } from "@/utils/llm";
import { createChat, updateChat, getChat } from "@/utils/chatStore";
import { AgentResponse } from "@/utils/types";

export async function POST(request: NextRequest) {
  try {
    const { query, chatId } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Valid query parameter is required" },
        { status: 400 }
      );
    }

    // Create a new chat or use the existing one
    const currentChatId = chatId || createChat(query);

    // 1. Perform initial web search
    const searchResults = await performSearch(query);

    if (!searchResults.length) {
      return NextResponse.json(
        { error: "No search results found" },
        { status: 404 }
      );
    }

    // 2. Generate research response using ReAct-style agent loop
    const agentResponse = await generateResearchResponse(query, searchResults);

    // 3. Update the chat with the final response
    updateChat(currentChatId, agentResponse);

    // 4. Return the response with the chat ID
    return NextResponse.json({
      chatId: currentChatId,
      response: agentResponse
    });
  } catch (error) {
    console.error("Error in /api/ask route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// New endpoint to get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }
    
    const chat = getChat(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
} 
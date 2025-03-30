import { NextRequest, NextResponse } from "next/server";
import { performSearch } from "@/utils/search";
import { generateResearchResponse } from "@/utils/llm";
import { createChat, addAgentResponseToChat, addUserMessageToChat, getChat, getLatestUserMessage } from "@/utils/chatStore";
import { AgentResponse } from "@/utils/types";

// Set a timeout for the entire request
const REQUEST_TIMEOUT = 180000; // Increased from 90000 to 180000 (3 minutes)

export async function POST(request: NextRequest): Promise<Response> {
  try {
    console.time('ask-api-total');
    const { query, chatId } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Valid query parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Processing query: "${query}"`);

    // Create a new chat or add the message to an existing one
    let currentChatId = chatId;
    
    if (currentChatId) {
      // Add the new user message to the existing chat
      addUserMessageToChat(currentChatId, query);
    } else {
      // This is a new chat - create it
      currentChatId = createChat(query);
    }

    try {
      // Create a promise that will resolve with the API response
      const responsePromise = processQuery(query, currentChatId);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), REQUEST_TIMEOUT);
      });
      
      // Race the API response against the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]) as Response;
      return response;
    } catch (error) {
      console.error("Error processing request:", error);
      
      // Update the chat with error information
      const errorResponse: AgentResponse = {
        traceSteps: [{
          thought: "Error occurred during processing",
          action: "Error handling",
          observation: "An error occurred while processing your request.",
          reflection: error instanceof Error ? error.message : "Unknown error"
        }],
        finalOutput: "I apologize, but I encountered an error while processing your request. Please try again with a more specific query or check your internet connection."
      };
      
      addAgentResponseToChat(currentChatId, errorResponse);
      
      return NextResponse.json({
        chatId: currentChatId,
        response: errorResponse
      });
    } finally {
      console.timeEnd('ask-api-total');
    }
  } catch (error) {
    console.error("Error in /api/ask route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// Separate function to process the query for better organization
async function processQuery(query: string, chatId: string): Promise<NextResponse> {
  console.time('search');
  // 1. Perform initial web search
  const searchResults = await performSearch(query);
  console.timeEnd('search');

  console.log(`Search returned ${searchResults.length} results`);
  
  // Get the chat to check if this is a follow-up question
  const chat = getChat(chatId);
  let context = "";
  
  if (chat && chat.messages.length > 1) {
    // This is a follow-up question, so we should include previous conversation context
    // Format a simple context from the last few messages (up to 3 exchanges)
    const recentMessages = chat.messages.slice(-6); // Last 3 exchanges (up to 6 messages)
    
    context = recentMessages.map(msg => {
      if (msg.isUser) {
        return `User: ${msg.content}`;
      } else {
        return `Assistant: ${msg.content}`;
      }
    }).join('\n\n');
    
    console.log("Including context from previous messages");
  }
  
  // Proceed even if no search results are found - our modified search function returns mock results
  console.time('generate-response');
  // 2. Generate research response using ReAct-style agent loop
  const agentResponse = await generateResearchResponse(query, searchResults, context);
  console.timeEnd('generate-response');

  console.time('update-chat');
  // 3. Update the chat with the agent response
  addAgentResponseToChat(chatId, agentResponse);
  console.timeEnd('update-chat');

  // 4. Return the response with the chat ID
  return NextResponse.json({
    chatId: chatId,
    response: agentResponse
  });
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
"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { AgentOutput } from "@/components/AgentOutput"
import { AgentTrace } from "@/components/AgentTrace"
import { ChatHistory } from "@/components/ChatHistory"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentResponse, AgentTraceStep, ChatHistoryEntry, ChatMessage } from "@/utils/types"

export default function Home() {
  const [query, setQuery] = useState("")
  const [currentAgentResponse, setCurrentAgentResponse] = useState<AgentResponse | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [traceSteps, setTraceSteps] = useState<AgentTraceStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Fetch chat history on component mount
  useEffect(() => {
    fetchChatHistory();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  
  // Fetch chat history from the API
  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      const data = await response.json();
      setChatHistory(data.chats);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    
    // Add the user message to UI immediately
    if (currentChatId) {
      // For existing chats, just add to current messages
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: query,
        isUser: true
      };
      setMessages([...messages, userMessage]);
    }

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query,
          chatId: currentChatId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }
      
      const data = await response.json();
      
      // Update state with the response
      const chatId = data.chatId;
      setCurrentChatId(chatId);
      setCurrentAgentResponse(data.response);
      setTraceSteps(data.response.traceSteps);
      
      // Get the updated chat from the server
      await fetchChatDetails(chatId);
      
      // Refresh chat history list
      fetchChatHistory();
    } catch (err) {
      console.error("Error fetching research:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      
      // If there was an error, remove the optimistic user message
      if (currentChatId && messages.length > 0) {
        setMessages(messages.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      setQuery(""); // Clear input after sending
    }
  }
  
  // Fetch details of a specific chat
  const fetchChatDetails = async (chatId: string) => {
    try {
      const response = await fetch(`/api/ask?chatId=${chatId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch chat details");
      }
      const data = await response.json();
      const chat = data.chat;
      
      if (chat) {
        setMessages(chat.messages);
      }
    } catch (error) {
      console.error("Error fetching chat details:", error);
    }
  }

  const handleNewChat = () => {
    setQuery("")
    setCurrentAgentResponse(null)
    setTraceSteps([])
    setCurrentChatId(null)
    setError(null)
    setMessages([])
  }
  
  const handleSelectChat = async (chat: ChatHistoryEntry) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    
    // Set the most recent agent response for the trace view
    const agentMessages = chat.messages.filter(msg => !msg.isUser);
    if (agentMessages.length > 0) {
      const lastAgentMessage = agentMessages[agentMessages.length - 1];
      if (lastAgentMessage.response) {
        setCurrentAgentResponse(lastAgentMessage.response);
        setTraceSteps(lastAgentMessage.response.traceSteps);
      }
    }
    
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto py-6 px-4 flex justify-between items-center">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold">Aginno Open</h1>
            <p className="text-sm text-muted-foreground mt-1">First iteration of a general purpose AI agent</p>
          </div>
          <div className="flex-1 flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar - Chat history */}
          <div className="col-span-1">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Chat History</h2>
                <Button variant="outline" size="sm" onClick={handleNewChat}>
                  New Chat
                </Button>
              </div>
              <ChatHistory 
                chats={chatHistory} 
                onSelectChat={handleSelectChat}
                selectedChatId={currentChatId}
              />
            </Card>
          </div>
          
          {/* Main content area */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            {/* Project description card */}
            <Card className="p-6">
              <h2 className="text-xl font-medium mb-3">About Aginno Open</h2>
              <p className="text-sm text-muted-foreground mb-2">
                This is a first iteration of a general purpose AI agent with currently limited capabilities:
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 mb-4 space-y-1">
                <li>Limited to analysis, planning, and web search tools</li>
                <li>Uses the GPT-4o Mini model for cost efficiency</li>
                <li>Implements a ReAct agent loop for reasoning and action</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-4">
                This serves as a demo for an eventual general purpose AI agent that would have access to a wide variety of tools, 
                long term memory store, multiple models (both next-token and reasoning), and multiple agent loops frameworks.
              </p>
              <p className="text-sm font-medium">
                Note: If the chat randomly stops working, it's likely due to exceeding the API limit. 
                Please <a href="https://www.linkedin.com/in/pranav-lende/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">send me a DM</a> for a quick fix.
              </p>
            </Card>
            
            {/* How to Use card */}
            <Card className="p-6">
              <h2 className="text-xl font-medium mb-3">How to Use</h2>
              <ol className="text-sm text-muted-foreground list-decimal pl-5 mb-4 space-y-2">
                <li>Type your research question in the input box below</li>
                <li>Wait for the agent to search the web and analyze results</li>
                <li>Review the detailed answer provided by the AI</li>
                <li>Ask follow-up questions to explore the topic further</li>
                <li>Check the "Agent Trace" tab to see the AI's thought process</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                For best results, ask specific questions about topics that can be researched online.
                The agent works best with factual queries rather than opinion-based questions.
                Please note that responses may take up to 5 minutes to return, especially for complex research questions.
              </p>
            </Card>
            
            <Card className="p-6">
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="trace">Agent Trace</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="min-h-[500px] flex flex-col">
                  {/* Messages area */}
                  <div className="flex-1 overflow-auto mb-4 pr-2" style={{ maxHeight: '400px' }}>
                    <AgentOutput messages={messages} />
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input area */}
                  <form onSubmit={handleSubmit} className="mt-auto">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          messages.length > 0
                            ? "Ask a follow-up question..."
                            : "Ask a research question..."
                        }
                        className="flex-1"
                        disabled={isLoading}
                      />
                      <Button type="submit" disabled={isLoading || !query.trim()}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                    {error && (
                      <div className="text-sm text-red-500 mt-2">{error}</div>
                    )}
                  </form>
                </TabsContent>
                
                <TabsContent value="trace">
                  <div className="min-h-[500px]">
                    <AgentTrace traceSteps={traceSteps} isLoading={isLoading} />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Aginno Open. All rights reserved.
        </div>
      </footer>
    </div>
  )
}


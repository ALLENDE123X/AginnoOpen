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
import { AgentTrace, TraceStep } from "@/components/AgentTrace"
import { ChatHistory } from "@/components/ChatHistory"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentResponse, AgentTraceStep, ChatHistoryEntry } from "@/utils/types"

export default function Home() {
  const [query, setQuery] = useState("")
  const [currentAgentResponse, setCurrentAgentResponse] = useState<AgentResponse | null>(null)
  const [traceSteps, setTraceSteps] = useState<AgentTraceStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom when trace steps update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [traceSteps, isLoading]);
  
  // Fetch chat history on component mount
  useEffect(() => {
    fetchChatHistory();
  }, []);
  
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

  // Connect to SSE endpoint for real-time trace updates when chatId changes
  useEffect(() => {
    if (!currentChatId || !isLoading) return;
    
    const eventSource = new EventSource(`/api/trace?chatId=${currentChatId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Skip connection established message
        if (data.type === "connection_established") return;
        
        // Update trace steps with the new step
        setTraceSteps(prev => {
          // If this step already exists (has same action and observation), don't add it
          const exists = prev.some(step => 
            step.action === data.action && 
            step.observation === data.observation
          );
          
          if (exists) {
            // Replace the step with updated information
            return prev.map(step => 
              step.action === data.action ? data : step
            );
          }
          
          // Otherwise, add the new step
          return [...prev, data];
        });
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [currentChatId, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setCurrentAgentResponse(null)
    setTraceSteps([])

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
      setCurrentChatId(data.chatId);
      setCurrentAgentResponse(data.response);
      setTraceSteps(data.response.traceSteps);
      
      // Refresh chat history
      fetchChatHistory();
    } catch (err) {
      console.error("Error fetching research:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleClear = () => {
    setQuery("")
    setCurrentAgentResponse(null)
    setTraceSteps([])
    setCurrentChatId(null)
    setError(null)
  }
  
  const handleSelectChat = async (chat: ChatHistoryEntry) => {
    setCurrentChatId(chat.id);
    setQuery(chat.query);
    setCurrentAgentResponse(chat.response);
    setTraceSteps(chat.response.traceSteps);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold">Research Agent</h1>
            <p className="text-sm text-muted-foreground mt-1">Your personal AI assistant for deep web research</p>
          </div>
          <div className="flex-1 flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 overflow-auto flex">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full w-full">
          {/* Left sidebar - Chat history */}
          <div className="col-span-1 h-full overflow-y-auto">
            <Card className="p-4 h-full">
              <h2 className="text-lg font-medium mb-4">Chat History</h2>
              <ChatHistory 
                chats={chatHistory} 
                onSelectChat={handleSelectChat}
                selectedChatId={currentChatId}
              />
            </Card>
          </div>
          
          {/* Main content area */}
          <div className="col-span-1 md:col-span-3 flex flex-col h-full">
            {/* Chat area with messages and traces */}
            <div className="flex-1 overflow-y-auto mb-4 relative max-h-[calc(100vh-250px)]">
              <Card className="p-4 h-full">
                {/* Chat Messages and Traces */}
                {(!currentAgentResponse && !isLoading && !error) ? (
                  <div className="text-center text-muted-foreground flex items-center justify-center h-full">
                    Enter a research query to get started
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto h-full">
                    {error ? (
                      <div className="text-red-500 p-4 border rounded-md">
                        {error}
                      </div>
                    ) : (
                      <>
                        {/* User query */}
                        {query && (
                          <div className="flex justify-end mb-4">
                            <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[75%]">
                              <p>{query}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Agent trace steps - visible directly in the chat */}
                        {traceSteps.map((step, index) => (
                          <div key={index} className="mb-4">
                            <TraceStep step={step} index={index} />
                          </div>
                        ))}
                        
                        {/* Loading indicator */}
                        {isLoading && (
                          <div className="flex items-center my-4">
                            <div className="bg-muted p-3 rounded-lg">
                              <LoadingSpinner size={4} />
                              <p className="text-sm mt-2">Researching...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Final response */}
                        {currentAgentResponse?.finalOutput && (
                          <div className="border rounded-lg p-4 bg-card">
                            <AgentOutput agentResponse={currentAgentResponse} />
                          </div>
                        )}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </Card>
            </div>
            
            {/* Search form - always at the bottom */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Compare the best productivity tools for students"
                    className="flex-1 text-base py-6 px-4"
                    disabled={isLoading}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Researching
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleClear}
                      disabled={isLoading || (!query && !currentAgentResponse && !error)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-2 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Research Agent. All rights reserved.
        </div>
      </footer>
    </div>
  )
}


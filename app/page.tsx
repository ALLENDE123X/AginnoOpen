"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { ChatHistory } from "@/components/ChatHistory"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ChatContainer } from "@/components/ChatContainer"
import { AgentResponse, AgentTraceStep, ChatHistoryEntry } from "@/utils/types"
import { useAgentProgress } from "@/utils/useAgentProgress"

export default function Home() {
  const [query, setQuery] = useState("")
  const [currentAgentResponse, setCurrentAgentResponse] = useState<AgentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([])
  
  // Use the agent progress hook to get real-time updates
  const { traceSteps, currentStep, progress } = useAgentProgress({
    chatId: currentChatId,
    query,
    isLoading,
  });
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setCurrentAgentResponse(null)

    try {
      // Start fetching the response
      const controller = new AbortController();
      const signal = controller.signal;
      
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query,
          chatId: currentChatId
        }),
        signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }
      
      // Parse the main response
      const data = await response.json();
      setCurrentChatId(data.chatId);
      
      // Update final response
      setCurrentAgentResponse(data.response);
      
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
    setCurrentChatId(null)
    setError(null)
  }
  
  const handleSelectChat = async (chat: ChatHistoryEntry) => {
    setCurrentChatId(chat.id);
    setQuery(chat.query);
    setCurrentAgentResponse(chat.response);
  };

  // Create an agent response with the real-time trace steps
  const combinedAgentResponse: AgentResponse | null = currentAgentResponse || (traceSteps.length > 0 
    ? { traceSteps, finalOutput: "" } 
    : null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto py-6 px-4 flex justify-between items-center">
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

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar - Chat history */}
          <div className="col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Chat History</h2>
              <ChatHistory 
                chats={chatHistory} 
                onSelectChat={handleSelectChat}
                selectedChatId={currentChatId}
              />
            </Card>
          </div>
          
          {/* Main content area */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            {/* Search form */}
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
                        Researching {isLoading && progress > 0 ? `(${progress}%)` : ''}
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
                    disabled={isLoading || (!query && !combinedAgentResponse && !error)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Chat container with integrated agent trace */}
            <Card className="min-h-[300px]">
              {error ? (
                <div className="text-red-500 flex items-center justify-center h-full p-6">
                  {error}
                </div>
              ) : (
                <ChatContainer
                  query={query}
                  agentResponse={combinedAgentResponse}
                  isLoading={isLoading}
                  currentStep={currentStep}
                />
              )}
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Research Agent. All rights reserved.
        </div>
      </footer>
    </div>
  )
}


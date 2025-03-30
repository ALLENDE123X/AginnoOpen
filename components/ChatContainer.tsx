"use client";

import React from "react";
import { AgentResponse } from "@/utils/types";
import { AgentMessage } from "./AgentMessage";

interface ChatContainerProps {
  query: string;
  agentResponse: AgentResponse | null;
  isLoading: boolean;
  currentStep: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  query,
  agentResponse,
  isLoading,
  currentStep,
}) => {
  const messagesEndRef = React.useRef<null | HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [query, agentResponse, isLoading, currentStep]);

  if (!query) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Your conversation will appear here...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto max-h-[500px]">
      {/* User message */}
      <AgentMessage isUser={true} content={query} />
      
      {/* Agent response */}
      <AgentMessage 
        isUser={false} 
        content=""
        agentResponse={agentResponse}
        isLoading={isLoading}
        currentStep={currentStep}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
}; 
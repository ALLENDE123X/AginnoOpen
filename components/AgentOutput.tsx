"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { AgentResponse } from "@/utils/types";

interface AgentOutputProps {
  agentResponse: AgentResponse | null;
}

export const AgentOutput: React.FC<AgentOutputProps> = ({ agentResponse }) => {
  if (!agentResponse) {
    return (
      <div className="text-muted-foreground flex items-center justify-center h-full">
        Your results will appear here...
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>{agentResponse.finalOutput}</ReactMarkdown>
    </div>
  );
}; 
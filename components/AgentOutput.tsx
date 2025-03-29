"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface AgentOutputProps {
  content: string;
}

export const AgentOutput: React.FC<AgentOutputProps> = ({ content }) => {
  if (!content) {
    return (
      <div className="text-muted-foreground flex items-center justify-center h-full">
        Your results will appear here...
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}; 
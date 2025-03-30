"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { AgentResponse, AgentTraceStep } from "@/utils/types";

interface AgentMessageProps {
  isUser: boolean;
  content: string;
  agentResponse?: AgentResponse | null;
  isLoading?: boolean;
  currentStep?: string;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({
  isUser,
  content,
  agentResponse,
  isLoading = false,
  currentStep,
}) => {
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-4`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-3xl ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="space-y-4">
            {/* Agent's final response */}
            {agentResponse?.finalOutput && (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{agentResponse.finalOutput}</ReactMarkdown>
              </div>
            )}
            
            {/* Loading state when agent is thinking */}
            {isLoading && !agentResponse?.finalOutput && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {currentStep || "Researching..."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Agent trace shown inline */}
      {!isUser && agentResponse?.traceSteps && agentResponse.traceSteps.length > 0 && (
        <div className="mt-2 w-full space-y-2">
          <div className="text-xs text-muted-foreground mb-1">Agent trace:</div>
          {agentResponse.traceSteps.map((step, index) => (
            <TraceStep key={index} step={step} index={index} />
          ))}
        </div>
      )}
      
      {/* Show loading trace step if agent is still working */}
      {!isUser && isLoading && (
        <div className="mt-2 w-full">
          <div className="text-xs text-muted-foreground mb-1">Agent trace:</div>
          <div className="text-xs border rounded p-2 bg-card/50 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Working on next step...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// TraceStep component to display individual steps in the trace
const TraceStep: React.FC<{ step: AgentTraceStep; index: number }> = ({ 
  step, 
  index 
}) => {
  const [expanded, setExpanded] = React.useState(false);
  
  // Format timestamp or use current time
  const timestamp = step.timestamp 
    ? new Date(step.timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();
  
  return (
    <div 
      className="border rounded p-2 bg-card/50 text-xs cursor-pointer hover:bg-card/80 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center">
        <div className="font-medium">Step {index + 1}: {step.action}</div>
        <div className="text-muted-foreground text-[10px] flex items-center gap-1">
          <span>{timestamp}</span>
          <span>•</span>
          <span>{expanded ? "Click to collapse" : "Click to expand"}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-1 pt-1 border-t">
          <div>
            <span className="font-medium">💭 Thought:</span> {step.thought}
          </div>
          
          <div>
            <span className="font-medium">🔍 Action:</span> {step.action}
          </div>
          
          <div>
            <span className="font-medium">📖 Observation:</span> {step.observation}
          </div>
          
          {step.reflection && (
            <div>
              <span className="font-medium">🔄 Reflection:</span>
              <div className="whitespace-pre-wrap mt-1 border-l-2 pl-2 py-1">
                {step.reflection}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
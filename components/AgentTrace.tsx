"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { AgentTraceStep } from "@/utils/types";

interface AgentTraceProps {
  traceSteps: AgentTraceStep[];
  isLoading: boolean;
}

interface TraceStepProps {
  step: AgentTraceStep;
  index: number;
}

export const TraceStep: React.FC<TraceStepProps> = ({ 
  step, 
  index 
}) => {
  return (
    <div className="border rounded p-3 bg-card">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Step {index + 1}</h4>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">💭 Thought:</span> {step.thought}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-start gap-1">
            <span className="font-medium">🔍 Action:</span> {step.action}
          </div>
          {step.tool && (
            <div className="mt-1 ml-5 text-xs px-2 py-1 bg-secondary inline-flex self-start rounded-full">
              <span>Tool: {step.tool}</span>
            </div>
          )}
        </div>
        
        <div>
          <span className="font-medium">📖 Observation:</span> {step.observation}
        </div>
        
        {step.reflection && (
          <div>
            <span className="font-medium">🔄 Reflection:</span>
            <div className="whitespace-pre-wrap mt-1 border-l-2 pl-3 py-1 text-xs">
              {step.reflection}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AgentTrace: React.FC<AgentTraceProps> & { TraceStep: React.FC<TraceStepProps> } = ({ traceSteps, isLoading }) => {
  return (
    <div className="space-y-4 py-2">
      <h3 className="text-md font-medium">Agent Trace</h3>
      
      <div className="border rounded-md bg-muted/20 overflow-y-auto max-h-[400px]">
        {traceSteps.length === 0 && !isLoading ? (
          <div className="p-4 text-muted-foreground text-center">
            Agent trace will appear here...
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {traceSteps.map((step, index) => (
              <TraceStep key={index} step={step} index={index} />
            ))}
            
            {isLoading && (
              <div className="flex items-center text-muted-foreground gap-2 p-2 border-t pt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Working on next step...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

AgentTrace.TraceStep = TraceStep; 
import { useState, useEffect } from 'react';
import { AgentResponse, AgentTraceStep } from './types';

export interface UseAgentProgressOptions {
  chatId: string | null;
  query: string;
  isLoading: boolean;
}

export interface UseAgentProgressReturn {
  traceSteps: AgentTraceStep[];
  currentStep: string;
  progress: number; // 0-100
}

export function useAgentProgress({
  chatId,
  query,
  isLoading,
}: UseAgentProgressOptions): UseAgentProgressReturn {
  const [traceSteps, setTraceSteps] = useState<AgentTraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("Starting research...");
  const [progress, setProgress] = useState<number>(0);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear state when not loading
    if (!isLoading) {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      return;
    }

    // Don't poll if no query or chatId
    if (!query || !chatId) return;

    // Start polling for updates
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ask?chatId=${chatId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.chat?.response) return;
        
        // Update trace steps
        setTraceSteps(data.chat.response.traceSteps || []);
        
        // Update current step message
        if (data.chat.response.traceSteps.length > 0) {
          const lastStep = data.chat.response.traceSteps[data.chat.response.traceSteps.length - 1];
          setCurrentStep(lastStep.action);
          
          // Calculate progress (very rough estimate)
          // Research process: search → planning → iterative research → final output
          if (lastStep.action.includes("search")) {
            setProgress(25);
          } else if (lastStep.action.includes("plan")) {
            setProgress(50);
          } else if (lastStep.action.includes("refined")) {
            setProgress(75);
          } else if (data.chat.response.finalOutput) {
            setProgress(100);
          }
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
      }
    }, 1000); // Poll every second
    
    setPollInterval(interval);
    
    // Clean up on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [chatId, query, isLoading]);
  
  return { traceSteps, currentStep, progress };
} 
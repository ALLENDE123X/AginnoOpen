import { SearchResult } from "./search";

// Agent trace step type
export interface AgentTraceStep {
  thought: string;
  action: string;
  observation: string;
  reflection?: string;
}

// Complete agent response including all trace steps and final output
export interface AgentResponse {
  traceSteps: AgentTraceStep[];
  finalOutput: string;
}

// Chat history entry type
export interface ChatHistoryEntry {
  id: string;
  timestamp: number;
  query: string;
  response: AgentResponse;
}

// In-memory chat history store
export interface ChatStore {
  chats: Record<string, ChatHistoryEntry>;
} 
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

// Chat message type
export interface ChatMessage {
  id: string;
  timestamp: number;
  content: string;
  isUser: boolean; // true for user messages, false for agent responses
  response?: AgentResponse; // Only present for agent responses
}

// Chat history entry type
export interface ChatHistoryEntry {
  id: string;
  title: string; // First user query used as title
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

// In-memory chat history store
export interface ChatStore {
  chats: Record<string, ChatHistoryEntry>;
} 
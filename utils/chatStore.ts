import { v4 as uuidv4 } from 'uuid';
import { ChatHistoryEntry, ChatStore, AgentResponse } from './types';

// Simple in-memory store for chat history
// In a production app, this would be replaced with a database
let chatStore: ChatStore = {
  chats: {}
};

/**
 * Create a new chat session
 */
export function createChat(query: string): string {
  const chatId = uuidv4();
  chatStore.chats[chatId] = {
    id: chatId,
    timestamp: Date.now(),
    query,
    response: { traceSteps: [], finalOutput: '' }
  };
  return chatId;
}

/**
 * Update an existing chat with a response
 */
export function updateChat(chatId: string, response: AgentResponse): void {
  if (chatStore.chats[chatId]) {
    chatStore.chats[chatId].response = response;
  }
}

/**
 * Get a specific chat by ID
 */
export function getChat(chatId: string): ChatHistoryEntry | null {
  return chatStore.chats[chatId] || null;
}

/**
 * Get all chats, sorted by most recent first
 */
export function getAllChats(): ChatHistoryEntry[] {
  return Object.values(chatStore.chats).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clear all chats (for testing/development)
 */
export function clearAllChats(): void {
  chatStore.chats = {};
} 
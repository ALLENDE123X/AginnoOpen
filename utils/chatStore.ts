import { v4 as uuidv4 } from 'uuid';
import { ChatHistoryEntry, ChatStore, AgentResponse, ChatMessage } from './types';

// Simple in-memory store for chat history
// In a production app, this would be replaced with a database
let chatStore: ChatStore = {
  chats: {}
};

/**
 * Create a new chat session with initial user message
 */
export function createChat(query: string): string {
  const chatId = uuidv4();
  const messageId = uuidv4();
  const timestamp = Date.now();
  
  const initialMessage: ChatMessage = {
    id: messageId,
    timestamp,
    content: query,
    isUser: true
  };
  
  chatStore.chats[chatId] = {
    id: chatId,
    title: query,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [initialMessage]
  };
  
  return chatId;
}

/**
 * Add agent response to an existing chat
 */
export function addAgentResponseToChat(chatId: string, response: AgentResponse): void {
  if (chatStore.chats[chatId]) {
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    const agentMessage: ChatMessage = {
      id: messageId,
      timestamp,
      content: response.finalOutput,
      isUser: false,
      response
    };
    
    chatStore.chats[chatId].messages.push(agentMessage);
    chatStore.chats[chatId].updatedAt = timestamp;
  }
}

/**
 * Add user message to an existing chat
 */
export function addUserMessageToChat(chatId: string, message: string): void {
  if (chatStore.chats[chatId]) {
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    const userMessage: ChatMessage = {
      id: messageId,
      timestamp,
      content: message,
      isUser: true
    };
    
    chatStore.chats[chatId].messages.push(userMessage);
    chatStore.chats[chatId].updatedAt = timestamp;
  }
}

/**
 * Get the most recent user message from a chat
 */
export function getLatestUserMessage(chatId: string): string | null {
  const chat = chatStore.chats[chatId];
  if (!chat) return null;
  
  // Find the last user message
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].isUser) {
      return chat.messages[i].content;
    }
  }
  
  return null;
}

/**
 * Legacy method - for backward compatibility
 */
export function updateChat(chatId: string, response: AgentResponse): void {
  addAgentResponseToChat(chatId, response);
}

/**
 * Get a specific chat by ID
 */
export function getChat(chatId: string): ChatHistoryEntry | null {
  return chatStore.chats[chatId] || null;
}

/**
 * Get all chats, sorted by most recent activity first
 */
export function getAllChats(): ChatHistoryEntry[] {
  return Object.values(chatStore.chats).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Clear all chats (for testing/development)
 */
export function clearAllChats(): void {
  chatStore.chats = {};
} 
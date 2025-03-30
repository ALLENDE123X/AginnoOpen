"use client";

import React from "react";
import { ChatHistoryEntry } from "@/utils/types";
import { Card } from "./ui/card";

interface ChatHistoryProps {
  chats: ChatHistoryEntry[];
  onSelectChat: (chat: ChatHistoryEntry) => void;
  selectedChatId: string | null;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  chats,
  onSelectChat,
  selectedChatId,
}) => {
  if (chats.length === 0) {
    return (
      <div className="text-muted-foreground text-center p-4">
        Your chat history will appear here...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <ChatHistoryItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === selectedChatId}
          onClick={() => onSelectChat(chat)}
        />
      ))}
    </div>
  );
};

interface ChatHistoryItemProps {
  chat: ChatHistoryEntry;
  isSelected: boolean;
  onClick: () => void;
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
  chat,
  isSelected,
  onClick,
}) => {
  // Create a truncated summary of the title
  const truncatedTitle =
    chat.title.length > 60 ? `${chat.title.substring(0, 57)}...` : chat.title;
  
  // Get formatted date
  const date = new Date(chat.createdAt);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get message count
  const messageCount = chat.messages.length;

  return (
    <Card
      className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
        isSelected ? "border-primary" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm">{truncatedTitle}</h4>
        <span className="text-xs text-muted-foreground">
          {formattedDate}, {formattedTime}
        </span>
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        {messageCount} messages
      </div>
    </Card>
  );
}; 
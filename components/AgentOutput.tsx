"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { AgentResponse, ChatMessage } from "@/utils/types";
import { Avatar } from "@/components/ui/avatar";

interface AgentOutputProps {
  messages: ChatMessage[];
}

export const AgentOutput: React.FC<AgentOutputProps> = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center h-full">
        Your conversation will appear here...
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex ${
              message.isUser ? "flex-row-reverse" : "flex-row"
            } max-w-[80%]`}
          >
            <div
              className={`rounded-lg px-4 py-2 ${
                message.isUser
                  ? "bg-primary text-primary-foreground mr-2"
                  : "bg-muted ml-2"
              }`}
            >
              {message.isUser ? (
                <div>{message.content}</div>
              ) : (
                <div className="prose dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
            <Avatar className="h-8 w-8">
              {message.isUser ? (
                <div className="flex h-full w-full items-center justify-center bg-primary text-xs text-primary-foreground">
                  You
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                  🔍
                </div>
              )}
            </Avatar>
          </div>
        </div>
      ))}
    </div>
  );
}; 
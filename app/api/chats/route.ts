import { NextRequest, NextResponse } from "next/server";
import { getAllChats, clearAllChats } from "@/utils/chatStore";

export async function GET(request: NextRequest) {
  try {
    const chats = getAllChats();
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

// Only for development purposes - clear all chats
export async function DELETE(request: NextRequest) {
  try {
    clearAllChats();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing chats:", error);
    return NextResponse.json(
      { error: "Failed to clear chats" },
      { status: 500 }
    );
  }
} 
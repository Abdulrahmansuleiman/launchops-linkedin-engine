import { NextResponse } from "next/server";
import { generateReplySuggestions } from "@/lib/ai";

export async function POST(req: Request) {
  const { conversation } = await req.json();

  if (!conversation || !conversation.trim()) {
    return NextResponse.json({ error: "Conversation text is required" }, { status: 400 });
  }

  try {
    const replies = await generateReplySuggestions(conversation);
    return NextResponse.json({ replies });
  } catch (e: any) {
    console.error("Reply assistant error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate replies" }, { status: 500 });
  }
}

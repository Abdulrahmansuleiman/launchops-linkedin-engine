import { NextResponse } from "next/server";
import { pollUpdates, isPolling } from "@/lib/telegram";

export async function POST() {
  if (isPolling()) {
    return NextResponse.json({ status: "already_running" });
  }

  // Start polling in background (fire and forget)
  pollUpdates().catch(console.error);

  return NextResponse.json({ status: "started" });
}

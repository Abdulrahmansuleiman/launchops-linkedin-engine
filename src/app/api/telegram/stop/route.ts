import { NextResponse } from "next/server";
import { stopPolling, isPolling } from "@/lib/telegram";

export async function POST() {
  if (!isPolling()) {
    return NextResponse.json({ status: "not_running" });
  }
  stopPolling();
  return NextResponse.json({ status: "stopped" });
}

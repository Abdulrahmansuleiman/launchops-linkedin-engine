import { NextResponse } from "next/server";
import { isPolling } from "@/lib/telegram";

export async function GET() {
  return NextResponse.json({ running: isPolling() });
}

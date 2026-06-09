import { NextResponse } from "next/server";
import { searchLinkedinProfiles, scrapeLinkedinProfiles, getRunResult } from "@/lib/apify";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    switch (body.action) {
      case "search": {
        const result = await searchLinkedinProfiles({
          keywords: body.keywords,
          followerCountMin: body.followerCountMin || 5000,
          limit: body.limit || 25,
        });
        return NextResponse.json({ run: result });
      }

      case "enrich": {
        if (!body.urls?.length) {
          return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
        }
        const result = await scrapeLinkedinProfiles(body.urls);
        return NextResponse.json({ run: result });
      }

      case "getResults": {
        const result = await getRunResult(body.runId);
        return NextResponse.json({ results: result });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

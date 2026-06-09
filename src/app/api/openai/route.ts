import { NextResponse } from "next/server";
import { generatePostDrafts, analyzePost, generateOutreachMessage, getWeeklyInsights } from "@/lib/ai";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    switch (body.action) {
      case "generatePosts": {
        const result = await generatePostDrafts({
          topic: body.topic,
          tone: body.tone,
          competitorPosts: body.competitorPosts,
          pastFeedback: body.pastFeedback,
          count: body.count || 3,
        });
        return NextResponse.json(result);
      }

      case "analyzePost": {
        const result = await analyzePost(body.content);
        return NextResponse.json(result);
      }

      case "generateOutreach": {
        const result = await generateOutreachMessage({
          prospectName: body.prospectName,
          prospectCompany: body.prospectCompany,
          prospectDetail: body.prospectDetail,
          step: body.step,
          context: body.context,
        });
        return NextResponse.json(result);
      }

      case "weeklyInsights": {
        const result = await getWeeklyInsights({
          weekPosts: body.weekPosts,
          previousWeeks: body.previousWeeks,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { generatePostDrafts, analyzePost, generateOutreachMessage, getWeeklyInsights } from "@/lib/ai";
import { openai } from "@/lib/openai";

const CONTENT_SYSTEM = `You are LaunchOps AI's LinkedIn content editor. You improve posts to hit 1k+ impressions.

Rules:
- Never lead with the word AI. Use "system" or "pipeline" instead.
- No dashes (—) anywhere. Use commas or periods.
- No AI slop phrases: no "game-changer", "leverage", "innovative", "seamlessly"
- Hook must be 8 words or fewer
- Short paragraphs (1-2 lines max)
- Keep the core message and story intact
- Improve hook strength, scannability, and CTA clarity
- Never change the factual claims or specific numbers`;

export async function POST(req: Request) {
  const body = await req.json();

  try {
    switch (body.action) {
      case "generatePosts": {
        const result = await generatePostDrafts({
          topic: body.topic,
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

      case "polishPost": {
        const res = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: CONTENT_SYSTEM },
            { role: "user", content: `Rewrite and improve this LinkedIn post. Make it stronger, more scannable, and more likely to hit 1k+ impressions. Keep the core message intact.

Return as JSON with: "improvedContent" (the rewritten post), "score" (new score out of 100), "changes" (what you improved).

Original post:
${body.content}` },
          ],
          response_format: { type: "json_object" },
        });
        const result = JSON.parse(res.choices[0].message.content || "{}");
        return NextResponse.json(result);
      }

      case "generateOutreach": {
        const result = await generateOutreachMessage({
          prospectName: body.prospectName,
          prospectCompany: body.prospectCompany,
          prospectLocation: body.prospectLocation,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePostDrafts } from "@/lib/ai";

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) throw new Error("No account found");
  return account.id;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weekLabel = searchParams.get("weekLabel");
  const status = searchParams.get("status");
  const stage = searchParams.get("stage");

  const where: any = {};
  if (weekLabel) where.weekLabel = weekLabel;
  if (status) where.status = status;
  if (stage) where.stage = stage;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "generate") {
    const day = body.day || "Monday";
    const weekLabel = body.weekLabel || `W${getWeekNumber(new Date())}-${day}`;

    // Fetch past metrics from published posts (actual performance data)
    const pastPosts = await prisma.post.findMany({
      where: { status: "PUBLISHED", impressions: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { topic: true, impressions: true, likes: true, comments: true, content: true, score: true, impressionPrediction: true, feedbackRating: true, feedbackNotes: true },
    });

    let pastPerformance = "";

    if (pastPosts.length > 0) {
      const highPerf = pastPosts.filter(p => (p.impressions || 0) >= 5000);
      const lowPerf = pastPosts.filter(p => (p.impressions || 0) < 3000);

      if (highPerf.length > 0) {
        pastPerformance += "POSTS THAT PERFORMED WELL (5K+ impressions — replicate these patterns):\n";
        pastPerformance += highPerf.map(p =>
          `- Topic: "${p.topic}", Impressions: ${p.impressions}, Likes: ${p.likes}, Comments: ${p.comments}, Score: ${p.score}`
        ).join("\n");
        pastPerformance += "\n\n";
      }

      if (lowPerf.length > 0) {
        pastPerformance += "POSTS THAT UNDERPERFORMED (under 3K impressions — learn from mistakes):\n";
        pastPerformance += lowPerf.map(p =>
          `- Topic: "${p.topic}", Impressions: ${p.impressions}, Likes: ${p.likes}, Comments: ${p.comments}, Score: ${p.score}`
        ).join("\n");
        pastPerformance += "\n";
        pastPerformance += "ANALYSIS: Posts under 3K generally have weak hooks (>8 words, no tension), no re-hook, weak CTA, or too much fluff. Avoid these patterns.\n\n";
      }
    }

    const pastFeedbackEntries = await prisma.post.findMany({
      where: { feedbackRating: { not: null }, feedbackNotes: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { feedbackRating: true, feedbackNotes: true, topic: true, score: true, impressionPrediction: true },
    });

    const feedbackText = pastFeedbackEntries.length > 0
      ? "User feedback from published posts:\n" + pastFeedbackEntries.map(
          (f) => `- Rating: ${f.feedbackRating}, Notes: "${f.feedbackNotes}", Topic: "${f.topic || "N/A"}"`
        ).join("\n")
      : "";

    const pastFeedback = [pastPerformance, feedbackText].filter(Boolean).join("\n\n");

    let drafts;
    try {
      drafts = await generatePostDrafts({
        topic: body.topic,
        count: body.count || 3,
        day,
        pastFeedback,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "AI generation failed" }, { status: 502 });
    }

    const accountId = await getDefaultAccountId();
    const posts = [];

    // Delete existing posts for this day after successful generation
    await prisma.post.deleteMany({ where: { weekLabel, status: "DRAFT", aiGenerated: true } });

    for (const draft of drafts.drafts || []) {
      const post = await prisma.post.create({
        data: {
          accountId,
          content: draft.content,
          topic: body.topic,
          stage: "SCRIPTING",
          status: "DRAFT",
          score: draft.score,
          scoreReason: draft.scoreAnalysis,
          impressionPrediction: draft.impressionPrediction,
          weekLabel,
          aiGenerated: true,
        },
      });
      posts.push(post);
    }

    return NextResponse.json({ drafts: posts }, { status: 201 });
  }

  const accountId = await getDefaultAccountId();
  const post = await prisma.post.create({
    data: {
      accountId,
      content: body.content,
      topic: body.topic,
      status: body.status || "DRAFT",
      score: body.score,
      weekLabel: body.weekLabel,
    },
  });

  return NextResponse.json(post, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;

  const post = await prisma.post.update({
    where: { id },
    data,
  });

  return NextResponse.json(post);
}

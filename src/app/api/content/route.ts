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

  const where: any = {};
  if (weekLabel) where.weekLabel = weekLabel;
  if (status) where.status = status;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "generate") {
    const day = body.day || "Monday";
    const weekLabel = body.weekLabel || `W${getWeekNumber(new Date())}-${day}`;

    // Delete existing posts for this day before generating fresh ones
    await prisma.post.deleteMany({ where: { weekLabel, status: "DRAFT", aiGenerated: true } });

    const drafts = await generatePostDrafts({
      topic: body.topic,
      count: body.count || 3,
      day,
    });

    if (!drafts.drafts || drafts.drafts.length === 0) {
      return NextResponse.json({ error: "AI returned no drafts" }, { status: 502 });
    }

    const accountId = await getDefaultAccountId();
    const posts = [];
    for (const draft of drafts.drafts || []) {
      const post = await prisma.post.create({
        data: {
          accountId,
          content: draft.content,
          topic: body.topic,
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

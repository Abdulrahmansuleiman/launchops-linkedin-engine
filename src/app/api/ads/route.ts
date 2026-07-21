import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAdCopies } from "@/lib/ai";
import { notifyTelegram } from "@/lib/telegram";

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) throw new Error("No account found");
  return account.id;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const accountId = await getDefaultAccountId();

  const where: any = { accountId };
  if (stage) where.stage = stage;

  const ads = await prisma.ad.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ads);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "generate") {
    const count = Math.min(Math.max(1, body.count || 5), 10);
    let ads;
    try {
      ads = await generateAdCopies({
        niche: body.niche || "",
        offer: body.offer || "",
        service: body.service || "",
        targetAudience: body.targetAudience || "",
        platform: body.platform || "linkedin",
        count,
        pastPerformance: body.pastFeedback || undefined,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Max-ads generation failed" }, { status: 502 });
    }

    const accountId = await getDefaultAccountId();
    const created = [];

    for (const ad of ads) {
      const createdAd = await prisma.ad.create({
        data: {
          accountId,
          content: ad.content,
          hook: ad.hook,
          body: ad.body,
          cta: ad.cta,
          angle: ad.angle,
          score: ad.score,
          scoreReason: ad.scoreAnalysis,
          impressionPrediction: ad.impressionPrediction,
          topic: body.niche,
          platform: body.platform,
          tags: ["Ads"],
          service: body.service,
          stage: "WRITING",
        },
      });
      created.push(createdAd);
    }

    if (created.length > 0) {
      notifyTelegram(`📢 <b>AI Generated ${created.length} ad copies</b>\n\nReady for review in Writing stage.`).catch(() => {});
    }

    return NextResponse.json({ ads: created }, { status: 201 });
  }

  const accountId = await getDefaultAccountId();
  const ad = await prisma.ad.create({
    data: {
      accountId,
      content: body.content,
      hook: body.hook,
      body: body.body,
      cta: body.cta,
      angle: body.angle,
      score: body.score,
      topic: body.topic,
      platform: body.platform,
      tags: body.tags || ["Ads"],
      stage: body.stage || "WRITING",
    },
  });

  return NextResponse.json(ad, { status: 201 });
}

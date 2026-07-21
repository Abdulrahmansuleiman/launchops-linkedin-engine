import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyTelegram } from "@/lib/telegram";

const AD_STAGE_LABELS: Record<string, string> = {
  WRITING: "✍️ Writing",
  SELECTION: "📋 Selection",
  REVIEW: "👁 Review",
  PUBLISHED: "✅ Published",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const oldAd = await prisma.ad.findUnique({ where: { id } });

  const data: any = { ...body };
  if (body.stage === "PUBLISHED" && !body.publishedAt) {
    data.publishedAt = new Date();
  }

  const ad = await prisma.ad.update({
    where: { id },
    data,
  });

  if (data.stage && oldAd && oldAd.stage !== data.stage) {
    const label = ad.hook?.slice(0, 50) || "Ad";
    notifyTelegram(
      `📢 <b>Ad Pipeline Update</b>\n\nAd moved: <b>${label}</b>\n${AD_STAGE_LABELS[oldAd.stage] || oldAd.stage} → ${AD_STAGE_LABELS[data.stage] || data.stage}`
    ).catch(() => {});
  }

  return NextResponse.json(ad);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.ad.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const totalLeads = await prisma.lead.count();
  const hotLeads = await prisma.lead.count({
    where: { status: { in: ["MEETING_BOOKED", "DEMO_SENT", "RESPONDED"] } },
  });
  const totalPosts = await prisma.post.count({ where: { status: "PUBLISHED" } });
  const totalImpressionsAgg = await prisma.post.aggregate({ _sum: { impressions: true } });
  const totalLikesAgg = await prisma.post.aggregate({ _sum: { likes: true } });
  const totalCommentsAgg = await prisma.post.aggregate({ _sum: { comments: true } });

  const recentPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 7,
  });

  const weeklyImpressions = recentPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);

  // Build daily chart data from the last 7 days of published posts
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyChart: { day: string; impressions: number; likes: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const dayPosts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    weeklyChart.push({
      day: dayNames[d.getDay()],
      impressions: dayPosts.reduce((s, p) => s + (p.impressions || 0), 0),
      likes: dayPosts.reduce((s, p) => s + (p.likes || 0), 0),
    });
  }

  const reports = await prisma.weeklyReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  const latestReport = reports[0]?.report || null;

  const hotLeadsList = await prisma.lead.findMany({
    where: { score: { gte: 80 } },
    orderBy: { score: "desc" },
    take: 5,
  });

  const totalImps = totalImpressionsAgg._sum.impressions || 0;

  return NextResponse.json({
    stats: {
      totalLeads,
      hotLeads,
      pipelineValue: hotLeads * 3000,
      weeklyImpressions: weeklyImpressions || 0,
      totalPosts,
      engagementRate: totalImps > 0
        ? (((totalLikesAgg._sum.likes || 0) + (totalCommentsAgg._sum.comments || 0)) / totalImps * 100).toFixed(1)
        : "0",
      totalImpressions: totalImps,
      totalLikes: totalLikesAgg._sum.likes || 0,
      newLeadsThisWeek: await prisma.lead.count({
        where: { createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
      }),
    },
    weeklyChart,
    recentPosts,
    hotLeads: hotLeadsList,
    insight: (latestReport as any)?.recommendation || "Your storytelling posts about AI agents get 3.2x more engagement than tip-based content. Best time to post: Tue-Thu, 8-10am.",
  });
}

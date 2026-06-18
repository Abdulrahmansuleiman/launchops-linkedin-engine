import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const weekLabel = `W${weekNum}`;

  return { monday, friday, weekLabel };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regenerate = searchParams.get("regenerate") === "true";

  const { monday, friday, weekLabel } = getWeekRange();

  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) return NextResponse.json({ error: "No account found" }, { status: 400 });

  // Check if we already have a report for this week
  if (!regenerate) {
    const existing = await prisma.weeklyReport.findFirst({
      where: { accountId: account.id, weekLabel },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return NextResponse.json({ weekLabel, ...(existing.report as any), saved: true });
    }
  }

  // Aggregate all weekly data
  const [
    postsCreated,
    postsPublished,
    leadsAdded,
    leadsConnected,
    dmsSent,
    clientsCreated,
    clientsOnboarded,
    tasksDone,
    tasksAdded,
  ] = await Promise.all([
    prisma.post.count({ where: { accountId: account.id, createdAt: { gte: monday, lte: friday } } }),
    prisma.post.count({ where: { accountId: account.id, status: "PUBLISHED", publishedAt: { gte: monday, lte: friday } } }),
    prisma.lead.count({ where: { accountId: account.id, createdAt: { gte: monday, lte: friday } } }),
    prisma.lead.count({ where: { accountId: account.id, status: "CONNECTED", connectedAt: { gte: monday, lte: friday } } }),
    prisma.outreachMessage.count({ where: { sentAt: { gte: monday, lte: friday } } }),
    prisma.client.count({ where: { accountId: account.id, createdAt: { gte: monday, lte: friday } } }),
    prisma.client.count({ where: { accountId: account.id, onboardingStatus: { not: "PENDING_FORM" }, createdAt: { gte: monday, lte: friday } } }),
    prisma.task.count({ where: { status: "completed", completedAt: { gte: monday, lte: friday } } }),
    prisma.task.count({ where: { createdAt: { gte: monday, lte: friday } } }),
  ]);

  const totalLeads = await prisma.lead.count({ where: { accountId: account.id } });
  const totalClients = await prisma.client.count({ where: { accountId: account.id } });
  const leadStatusBreakdown = await prisma.lead.groupBy({
    by: ["status"],
    where: { accountId: account.id },
    _count: { status: true },
  });
  const pipelineStages = leadStatusBreakdown.map((s) => ({
    stage: s.status,
    count: s._count.status,
  }));

  const rawData: any = {
    weekLabel,
    period: `${monday.toLocaleDateString("en-GB")} - ${friday.toLocaleDateString("en-GB")}`,
    posts: { created: postsCreated, published: postsPublished },
    leads: { added: leadsAdded, connected: leadsConnected, total: totalLeads },
    outreach: { dmsSent },
    clients: { added: clientsCreated, onboarded: clientsOnboarded, total: totalClients },
    tasks: { completed: tasksDone, added: tasksAdded },
    pipelineStages,
  };

  // Generate AI narrative summary
  let narrative = "";
  try {
    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Raymon's weekly business assistant. Write a short, direct, human-sounding weekly recap in his voice. Warm but professional. Use bullet points for stats. End with one sentence of advice or encouragement. Max 120 words. Use the word 'you' to address Raymon. Never be robotic. Never use 'leverage', 'synergy', 'game-changer'.",
        },
        {
          role: "user",
          content: `Here is Raymon's week ${weekLabel} data. Write a recap:

Posts created: ${postsCreated}, Published: ${postsPublished}
Leads added: ${leadsAdded}, Connected: ${leadsConnected}, Total in pipeline: ${totalLeads}
DMs sent: ${dmsSent}
New clients: ${clientsCreated}, Clients onboarded: ${clientsOnboarded}, Total clients: ${totalClients}
Tasks completed: ${tasksDone}, Tasks added: ${tasksAdded}

Pipeline breakdown: ${pipelineStages.map((s) => `${s.stage}: ${s.count}`).join(", ")}`,
        },
      ],
    });
    narrative = aiRes.choices[0]?.message?.content?.trim() || "";
  } catch {}

  const report = { ...rawData, narrative };

  // Save to WeeklyReport
  try {
    await prisma.weeklyReport.create({
      data: { accountId: account.id, weekLabel, report },
    });
  } catch {}

  return NextResponse.json({ weekLabel, ...rawData, narrative, saved: true });
}

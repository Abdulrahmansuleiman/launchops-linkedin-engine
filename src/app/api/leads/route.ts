import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeAndWait } from "@/lib/apify";
import { qualifyLead } from "@/lib/ai";

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) throw new Error("No account found. Create an account first.");
  return account.id;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (status && status !== "all") where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { score: "desc" },
    take: 100,
  });

  return NextResponse.json(leads);
}

async function findDuplicate(body: any) {
  const conditions: any[] = [];
  if (body.linkedinUrl) {
    conditions.push({ linkedinUrl: { equals: body.linkedinUrl, mode: "insensitive" } });
  }
  if (body.name) {
    conditions.push({ name: { equals: body.name, mode: "insensitive" } });
  }
  if (body.linkedinUrl && body.name) {
    conditions.push({
      AND: [
        { linkedinUrl: { equals: body.linkedinUrl, mode: "insensitive" } },
        { name: { equals: body.name, mode: "insensitive" } },
      ],
    });
  }
  if (conditions.length === 0) return null;
  return prisma.lead.findFirst({ where: { OR: conditions } });
}

async function mergeLead(existing: any, body: any, score: number, scoreReason: string | null, scoreComponents: any) {
  const data: any = {};
  if (body.linkedinUrl && !existing.linkedinUrl) data.linkedinUrl = body.linkedinUrl;
  if (body.name && !existing.name) data.name = body.name;
  if (body.headline && !existing.headline) data.headline = body.headline;
  if (body.company && !existing.company) data.company = body.company;
  if (body.location && !existing.location) data.location = body.location;
  if (body.profilePicture && !existing.profilePicture) data.profilePicture = body.profilePicture;
  if (body.followerCount) data.followerCount = parseInt(body.followerCount);
  if (score > (existing.score || 0)) {
    data.score = score;
    if (scoreReason) data.scoreReason = scoreReason;
    if (scoreComponents) data.scoreComponents = scoreComponents;
  }
  data.status = existing.status || "NEW";

  const updated = await prisma.lead.update({
    where: { id: existing.id },
    data,
  });
  return updated;
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "import") {
    const profileUrls: string[] = body.profileUrls || [];

    if (!profileUrls.length) {
      return NextResponse.json({ error: "No profile URLs provided" }, { status: 400 });
    }

    let scraped: any[];
    try {
      scraped = await scrapeAndWait(profileUrls);
    } catch (e: any) {
      return NextResponse.json({
        error: "LinkedIn scraping failed",
        detail: e.message || "Unknown Apify error",
        hint: "Check that APIFY_API_KEY is set correctly on Vercel and Apify credits are available"
      }, { status: 502 });
    }

    const accountId = await getDefaultAccountId();
    const created: any[] = [];
    const merged: any[] = [];

    for (const profile of scraped) {
      const existing = await findDuplicate({
        linkedinUrl: profile.profileUrl,
        name: profile.name,
      });
      if (existing) {
        const updated = await prisma.lead.update({
          where: { id: existing.id },
          data: {
            name: profile.name || existing.name,
            headline: profile.headline || existing.headline,
            company: profile.company || existing.company,
            location: profile.location || existing.location,
            followerCount: profile.followerCount || existing.followerCount,
          },
        });
        merged.push(updated);
        continue;
      }

      const lead = await prisma.lead.create({
        data: {
          accountId,
          linkedinUrl: profile.profileUrl,
          name: profile.name,
          headline: profile.headline,
          company: profile.company,
          location: profile.location,
          followerCount: profile.followerCount,
          score: 50,
          status: "NEW",
        },
      });
      created.push(lead);
    }

    return NextResponse.json({
      imported: created.length,
      merged: merged.length,
      leads: [...created, ...merged],
    }, { status: 201 });
  }

  const accountId = await getDefaultAccountId();

  let score = body.score || 0;
  let scoreReason: string | null = null;
  let scoreComponents: any = null;

  if (body.linkedinUrl || body.headline || body.company) {
    try {
      const qualification = await qualifyLead({
        name: body.name || "Unknown",
        headline: body.headline,
        company: body.company,
        location: body.location,
        linkedinUrl: body.linkedinUrl,
      });
      if (qualification && typeof qualification.score === "number") {
        score = qualification.score;
        scoreReason = qualification.scoreReason || null;
        scoreComponents = {
          strengths: qualification.strengths || [],
          concerns: qualification.concerns || [],
          verdict: qualification.verdict || "warm",
        };
      }
    } catch (e) {
      console.error("Lead qualification failed:", e);
    }
  }

  const existing = await findDuplicate(body);
  if (existing) {
    const lead = await mergeLead(existing, body, score, scoreReason, scoreComponents);
    return NextResponse.json({ ...lead, merged: true }, { status: 200 });
  }

  const lead = await prisma.lead.create({
    data: {
      accountId,
      linkedinUrl: body.linkedinUrl,
      name: body.name,
      headline: body.headline,
      company: body.company,
      location: body.location,
      profilePicture: body.profilePicture,
      followerCount: body.followerCount ? parseInt(body.followerCount) : undefined,
      score,
      scoreReason,
      ...(scoreComponents ? { scoreComponents } : {}),
      status: "NEW",
    },
  });
  return NextResponse.json({ ...lead, merged: false }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  if (body.action === "markConnected") {
    const updated = await prisma.lead.update({
      where: { id: body.leadId },
      data: { status: "CONNECTED", connectedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "updateStatus") {
    const updated = await prisma.lead.update({
      where: { id: body.leadId },
      data: { status: body.status },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "wipeAll") {
    await prisma.outreachMessage.deleteMany({});
    await prisma.outreachSequence.deleteMany({});
    await prisma.leadActivity.deleteMany({});
    await prisma.pipelineEntry.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.contentIdea.deleteMany({});
    await prisma.competitorPost.deleteMany({});
    await prisma.weeklyReport.deleteMany({});
    await prisma.lead.deleteMany({});
    return NextResponse.json({ wiped: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

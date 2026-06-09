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
    const created = [];

    for (const profile of scraped) {
      const existing = await prisma.lead.findFirst({
        where: { linkedinUrl: profile.profileUrl },
      });
      if (existing) continue;

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

    return NextResponse.json({ imported: created.length, leads: created }, { status: 201 });
  }

  const accountId = await getDefaultAccountId();

  let score = body.score || 0;
  let scoreReason = null;
  let scoreComponents = null;

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

  const lead = await prisma.lead.create({
    data: {
      accountId,
      linkedinUrl: body.linkedinUrl,
      name: body.name,
      headline: body.headline,
      company: body.company,
      location: body.location,
      profilePicture: body.profilePicture,
      score,
      scoreReason,
      ...(scoreComponents ? { scoreComponents } : {}),
      status: "NEW",
    },
  });
  return NextResponse.json(lead, { status: 201 });
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

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

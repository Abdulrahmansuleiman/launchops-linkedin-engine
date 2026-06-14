import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchLinkedinProfiles, scrapeLinkedinProfile } from "@/lib/scraper";
import { qualifyLead } from "@/lib/ai";

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "search") {
    const keywords = body.keywords || "founder CEO owner entrepreneur";
    const limit = Math.min(body.limit || 20, 50);

    let searchResults: { title: string; link: string; snippet: string }[];
    try {
      const res = await searchLinkedinProfiles(keywords, limit);
      searchResults = res.items;
    } catch (e: any) {
      return NextResponse.json({
        error: "Lead search failed",
        detail: e.message,
        hint: "Make sure GOOGLE_API_KEY and GOOGLE_CX are set in .env"
      }, { status: 502 });
    }

    if (searchResults.length === 0) {
      return NextResponse.json({ leads: [] });
    }

    // Parse basic data from Google search snippets
    const profiles = searchResults.map((item) => ({
      name: item.title.replace(/\s*-\s*LinkedIn.*$/, "").replace(/\s*\|\s*LinkedIn.*$/, "").trim() || "Unknown",
      headline: item.snippet ? item.snippet.split(".")[0]?.trim() || item.snippet.slice(0, 120) : "",
      company: "",
      location: "",
      profileUrl: item.link,
      imageUrl: "",
      followerCount: 0,
      about: item.snippet || "",
    }));

    // Enrich top profiles with ScraperAPI (parallel, 3 at a time)
    const scrapeBatch = Math.min(profiles.length, 15);
    const enrichedProfiles: any[] = [];

    for (let i = 0; i < scrapeBatch; i += 3) {
      const batch = profiles.slice(i, i + 3);
      const scraped = await Promise.allSettled(
        batch.map(async (p) => {
          try {
            const detail = await scrapeLinkedinProfile(p.profileUrl);
            return {
              ...p,
              name: detail.name || p.name,
              headline: detail.headline || p.headline,
              company: detail.company || p.company,
              followerCount: detail.followerCount || p.followerCount,
              about: detail.about || p.about,
              imageUrl: detail.imageUrl || p.imageUrl,
            };
          } catch {
            return p;
          }
        })
      );
      for (const s of scraped) {
        if (s.status === "fulfilled") enrichedProfiles.push(s.value);
        else enrichedProfiles.push(batch[enrichedProfiles.length % 3]);
      }
    }

    // Append any remaining beyond scrape batch (using Google snippet data only)
    for (let i = scrapeBatch; i < profiles.length; i++) {
      enrichedProfiles.push(profiles[i]);
    }

    const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
    const existingLeads = account ? await prisma.lead.findMany({
      where: { accountId: account.id },
      select: { linkedinUrl: true, name: true },
    }) : [];

    const enriched = [];
    const batchSize = 5;

    for (let i = 0; i < enrichedProfiles.length; i += batchSize) {
      const batch = enrichedProfiles.slice(i, i + batchSize);
      const qualified = await Promise.all(
        batch.map(async (profile: any) => {
          const defaultScore = profile.followerCount > 0 ? Math.min(Math.round(profile.followerCount / 200), 60) : 30;
          let aiScore = { score: defaultScore, scoreReason: null as string | null, strengths: [] as string[], concerns: [] as string[], verdict: "warm" as string };

          try {
            const q = await qualifyLead({
              name: profile.name || "Unknown",
              headline: profile.headline,
              company: profile.company,
              location: profile.location,
              linkedinUrl: profile.profileUrl,
              followerCount: profile.followerCount,
            });
            if (q && typeof q.score === "number") {
              aiScore = {
                score: q.score,
                scoreReason: q.scoreReason || null,
                strengths: q.strengths || [],
                concerns: q.concerns || [],
                verdict: q.verdict || "warm",
              };
            }
          } catch {}

          const exists = existingLeads.find(
            (l) =>
              (l.linkedinUrl && profile.profileUrl && l.linkedinUrl.toLowerCase() === profile.profileUrl.toLowerCase()) ||
              (l.name && profile.name && l.name.toLowerCase() === profile.name.toLowerCase())
          );

          return {
            name: profile.name || "Unknown",
            headline: profile.headline || "",
            company: profile.company || "",
            location: profile.location || "",
            linkedinUrl: profile.profileUrl || "",
            profilePicture: profile.imageUrl || "",
            followerCount: profile.followerCount || 0,
            about: profile.about || "",
            ...aiScore,
            alreadyExists: !!exists,
            existingStatus: null,
            existingScore: null,
          };
        })
      );
      enriched.push(...qualified);
    }

    enriched.sort((a, b) => b.score - a.score);

    return NextResponse.json({ leads: enriched });
  }

  if (body.action === "import") {
    const leads: any[] = body.leads || [];
    if (!leads.length) return NextResponse.json({ error: "No leads to import" }, { status: 400 });

    const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
    if (!account) return NextResponse.json({ error: "No account found" }, { status: 400 });

    const imported: any[] = [];
    const skipped: any[] = [];

    for (const item of leads) {
      const orConditions: any[] = [];
      if (item.linkedinUrl) {
        orConditions.push({ linkedinUrl: { equals: item.linkedinUrl, mode: "insensitive" as const } });
      }
      if (item.name) {
        orConditions.push({ name: { equals: item.name, mode: "insensitive" as const } });
      }

      const existing = orConditions.length > 0
        ? await prisma.lead.findFirst({ where: { OR: orConditions } })
        : null;

      if (existing) {
        skipped.push({ name: item.name, reason: "Already in pipeline", id: existing.id });
        continue;
      }

      let score = item.score || 50;
      let scoreReason: string | null = item.scoreReason || null;
      let scoreComponents: any = null;

      if (!item.scoreReason) {
        try {
          const q = await qualifyLead({
            name: item.name,
            headline: item.headline,
            company: item.company,
            location: item.location,
            linkedinUrl: item.linkedinUrl,
            followerCount: item.followerCount,
          });
          if (q && typeof q.score === "number") {
            score = q.score;
            scoreReason = q.scoreReason || null;
            scoreComponents = {
              strengths: q.strengths || [],
              concerns: q.concerns || [],
              verdict: q.verdict || "warm",
            };
          }
        } catch {}
      }

      const lead = await prisma.lead.create({
        data: {
          accountId: account.id,
          linkedinUrl: item.linkedinUrl || null,
          name: item.name || "Unknown",
          headline: item.headline || null,
          company: item.company || null,
          location: item.location || null,
          profilePicture: item.profilePicture || null,
          followerCount: item.followerCount || null,
          enrichmentData: item.about ? { about: item.about } : undefined,
          score,
          scoreReason,
          ...(scoreComponents ? { scoreComponents } : {}),
          status: "NEW",
        },
      });

      imported.push(lead);
    }

    return NextResponse.json({ imported: imported.length, skipped: skipped.length, skippedDetails: skipped, leads: imported }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchLinkedinProfiles, getRunResult } from "@/lib/apify";
import { qualifyLead } from "@/lib/ai";

function apifyFetch(path: string) {
  return fetch(`https://api.apify.com/v2${path}?token=${process.env.APIFY_API_KEY}`, {
    headers: { "Content-Type": "application/json" },
  }).then((r) => {
    if (!r.ok) throw new Error(`Apify API error: ${r.status} ${r.statusText}`);
    return r.json();
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "search") {
    const keywords = body.keywords || "founder CEO owner entrepreneur";
    const limit = Math.min(body.limit || 25, 50);

    let run: any;
    try {
      run = await searchLinkedinProfiles({ keywords, limit, followerCountMin: body.followerCountMin || 0 });
    } catch (e: any) {
      return NextResponse.json({
        error: "LinkedIn search failed",
        detail: e.message || "Unknown Apify error",
        hint: "Check APIFY_API_KEY is set and the scrapepilot actor is rented at console.apify.com"
      }, { status: 502 });
    }

    const runId = run.data?.id;
    if (!runId) return NextResponse.json({ error: "No run ID returned from Apify" }, { status: 502 });

    const pollMs = 3000;
    const maxWait = 180000;
    const started = Date.now();

    let results: any[] = [];
    while (Date.now() - started < maxWait) {
      const statusRes = await apifyFetch(`/actor-runs/${runId}`);
      const status = statusRes.data?.status;
      if (status === "SUCCEEDED") {
        results = await getRunResult(runId);
        break;
      }
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED_OUT") {
        return NextResponse.json({
          error: `Apify run ${status}`,
          detail: statusRes.data?.errorMessage || "Unknown"
        }, { status: 502 });
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    if (results.length === 0) {
      return NextResponse.json({ error: "Search returned no results" }, { status: 404 });
    }

    const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
    const existingLeads = account ? await prisma.lead.findMany({
      where: { accountId: account.id },
      select: { linkedinUrl: true, name: true, score: true, scoreReason: true, status: true },
    }) : [];

    const enriched = [];
    const batchSize = 5;

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const qualified = await Promise.all(
        batch.map(async (profile: any) => {
          const score = profile.followerCount > 0 ? Math.min(Math.round(profile.followerCount / 200), 60) : 30;
          let aiScore = { score, scoreReason: null as string | null, strengths: [] as string[], concerns: [] as string[], verdict: "warm" as string };

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
            existingStatus: exists?.status || null,
            existingScore: exists?.score || null,
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

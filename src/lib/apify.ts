const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_BASE = "https://api.apify.com/v2";

async function apifyFetch(path: string, options?: RequestInit) {
  const url = `${APIFY_BASE}${path}?token=${APIFY_API_KEY}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`Apify API error: ${res.status} ${await res.text()}`);
  return res.json();
}

export interface ScrapedProfile {
  name?: string;
  headline?: string;
  company?: string;
  location?: string;
  profileUrl?: string;
  username?: string;
  followerCount?: number;
  about?: string;
  imageUrl?: string;
}

// Uses scrapepilot/linkedin-profile-scraper---no-login-public-data
// No cookies, no login required. Only public profile data.
export async function scrapeLinkedinProfiles(
  inputs: string[],
  options?: { keyword?: string; maxResults?: number }
) {
  const run = await apifyFetch(
    "/acts/scrapepilot~linkedin-profile-scraper---no-login-public-data/runs",
    {
      method: "POST",
      body: JSON.stringify({
        profile_urls: inputs,
        keyword: options?.keyword || "",
        max_results: options?.maxResults || inputs.length,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
        },
      }),
    }
  );
  return run;
}

export async function scrapeLinkedinPosts(urls: string[]) {
  const run = await apifyFetch("/acts/vdrm~linkedin-post-scraper/runs", {
    method: "POST",
    body: JSON.stringify({ urls }),
  });
  return run;
}

export async function searchLinkedinProfiles(query: {
  keywords: string;
  followerCountMin?: number;
  limit?: number;
}) {
  const run = await apifyFetch(
    "/acts/scrapepilot~linkedin-profile-scraper---no-login-public-data/runs",
    {
      method: "POST",
      body: JSON.stringify({
        profile_urls: [],
        keyword: query.keywords,
        max_results: query.limit || 25,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
        },
      }),
    }
  );
  return run;
}

export async function getRunResult(runId: string) {
  return apifyFetch(`/actor-runs/${runId}/dataset/items`);
}

// Start scrape and wait for completion with polling
export async function scrapeAndWait(
  profileUrls: string[],
  options?: { keyword?: string; maxResults?: number; pollIntervalMs?: number; maxWaitMs?: number }
): Promise<ScrapedProfile[]> {
  const run = await scrapeLinkedinProfiles(profileUrls, options);
  const runId = run.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  const pollMs = options?.pollIntervalMs ?? 2000;
  const maxWait = options?.maxWaitMs ?? 120000;
  const started = Date.now();

  while (Date.now() - started < maxWait) {
    const statusRes = await apifyFetch(`/actor-runs/${runId}`);
    const status = statusRes.data?.status;
    if (status === "SUCCEEDED") {
      return getRunResult(runId);
    }
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED_OUT") {
      throw new Error(`Apify run ${status}: ${statusRes.data?.errorMessage || "Unknown"}`);
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error("Apify scrape timed out waiting for results");
}

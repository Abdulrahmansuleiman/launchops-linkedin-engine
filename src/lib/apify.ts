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

export async function scrapeLinkedinProfiles(urls: string[]) {
  const run = await apifyFetch("/acts/curious_coder~linkedin-profile-scraper/runs", {
    method: "POST",
    body: JSON.stringify({ urls }),
  });
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
  const run = await apifyFetch("/acts/petr_cermak~linkedin-search-scraper/runs", {
    method: "POST",
    body: JSON.stringify({
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query.keywords)}`,
      maxResults: query.limit || 25,
    }),
  });
  return run;
}

export async function getRunResult(runId: string) {
  return apifyFetch(`/actor-runs/${runId}/dataset/items`);
}

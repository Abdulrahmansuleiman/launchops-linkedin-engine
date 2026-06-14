import * as cheerio from "cheerio";

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

// Google Custom Search API — finds LinkedIn profiles by keyword (free, 100 queries/day)
export async function searchLinkedinProfiles(
  keywords: string,
  limit: number = 20
): Promise<{ items: { title: string; link: string; snippet: string }[] }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    throw new Error("GOOGLE_API_KEY and GOOGLE_CX must be set in .env");
  }

  const query = `site:linkedin.com/in ${keywords}`;
  const num = Math.min(limit, 10);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${num}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    throw new Error(`Google Search API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return { items: data.items || [] };
}

// ScraperAPI — fetches and parses a LinkedIn profile page (free 5000/month)
export async function scrapeLinkedinProfile(url: string): Promise<ScrapedProfile> {
  const apiKey = process.env.SCRAPERAPI_KEY;
  if (!apiKey) {
    throw new Error("SCRAPERAPI_KEY must be set in .env");
  }

  const proxyUrl = `http://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}&country_code=us&render=false`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    throw new Error(`ScraperAPI error: ${res.status}`);
  }

  const html = await res.text();
  return parseLinkedinHtml(html, url);
}

function parseLinkedinHtml(html: string, url: string): ScrapedProfile {
  const $ = cheerio.load(html);

  const name = $("h1").first().text().trim() || undefined;
  const headline = $("div.text-body-medium").first().text().trim() || undefined;

  let followerCount: number | undefined;
  const followerText = $('a[href*="folower"] span, a[href*="folower"]').text() || "";
  const match = followerText.match(/([\d,.]+)\s*followers?/i);
  if (match) {
    followerCount = parseFloat(match[1].replace(/,/g, "")) || undefined;
  }

  // Try to find about section
  let about: string | undefined;
  const aboutSection = $('#about ~ div, section:contains("About") p, div:contains("About") p').first();
  if (aboutSection.length) {
    about = aboutSection.text().trim() || undefined;
  }

  // Fallback: parse <meta> and JSON-LD
  let company: string | undefined;
  const jsonld = $('script[type="application/ld+json"]').html();
  if (jsonld) {
    try {
      const parsed = JSON.parse(jsonld);
      if (parsed.name) name ?? parsed.name;
      if (parsed.jobTitle) headline ?? parsed.jobTitle;
      if (parsed.worksFor?.name) company = parsed.worksFor.name;
    } catch {}
  }

  const imageUrl = $('img[class*="profile"]').first().attr("src") || $('img[alt*="photo"]').first().attr("src") || undefined;

  // Extract username from URL
  const username = url.match(/linkedin\.com\/in\/([^/?]+)/)?.[1] || undefined;

  return {
    name,
    headline,
    company,
    profileUrl: url,
    username,
    followerCount,
    about,
    imageUrl,
  };
}

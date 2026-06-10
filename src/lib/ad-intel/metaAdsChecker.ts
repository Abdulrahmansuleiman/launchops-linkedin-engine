import { randomDelay } from "@/utils/delays"
import { logger } from "@/utils/logger"
import type { AdPreview } from "./types"
import * as cheerio from "cheerio"

const MAX_RETRIES = 3
const BASE_URL = "https://www.facebook.com/ads/library"

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
]

function pickHeaders() {
  return {
    "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: "https://www.facebook.com/",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }
}

interface ScrapeResult {
  runningAds: boolean
  adsFound: number
  ads: AdPreview[]
}

async function attemptSearch(query: string, attempt: number): Promise<ScrapeResult | null> {
  const encoded = encodeURIComponent(query)
  const url = `${BASE_URL}/?active_status=active&ad_type=all&country=ALL&q=${encoded}`

  logger.info(`Fetching: ${url} (attempt ${attempt + 1}/${MAX_RETRIES})`)

  const response = await fetch(url, {
    headers: pickHeaders(),
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    logger.warn(`HTTP ${response.status} for "${query}"`)
    if (response.status === 429 || response.status === 403) {
      return null
    }
    throw new Error(`Meta Ad Library returned HTTP ${response.status}`)
  }

  const html = await response.text()
  return parseHtml(html, url)
}

function parseHtml(html: string, sourceUrl: string): ScrapeResult | null {
  const $ = cheerio.load(html)

  const pageTitle = $("title").text().toLowerCase()
  if (pageTitle.includes("login") || pageTitle.includes("log in")) {
    throw new Error("Meta Ad Library returned a login page. Try again later or use a different network.")
  }

  const bodyText = $("body").text().toLowerCase()

  if (bodyText.includes("sorry") && (bodyText.includes("block") || bodyText.includes("automated"))) {
    throw new Error("Meta blocked the request. Try again later.")
  }

  const adData = extractFromScripts($, html)
  if (adData !== null) return adData

  const adCountFromText = extractFromBodyText(bodyText)
  if (adCountFromText !== null) return adCountFromText

  return null
}

function extractFromScripts($: cheerio.CheerioAPI, rawHtml: string): ScrapeResult | null {
  const scripts = $("script")
  let allJsonText = ""

  scripts.each((_, el) => {
    const content = $(el).html() || ""
    allJsonText += content + "\n"
  })

  const patterns = [
    /"totalCount"\s*[:=]\s*(\d+)/i,
    /"count"\s*[:=]\s*(\d+)/i,
    /"num_ads"\s*[:=]\s*(\d+)/i,
    /"activeAds"\s*[:=]\s*(\d+)/i,
    /"adsCount"\s*[:=]\s*(\d+)/i,
    /"adCount"\s*[:=]\s*(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = allJsonText.match(pattern)
    if (match) {
      const count = parseInt(match[1], 10)
      if (count > 0) {
        return { runningAds: true, adsFound: count, ads: [] }
      }
    }
  }

  const noResultPatterns = [
    /"noResult"/i,
    /"noAds"/i,
    /"isEmpty"\s*[:=]\s*true/i,
    /"hasResult"\s*[:=]\s*false/i,
    /"totalCount"\s*[:=]\s*0/i,
    /"count"\s*[:=]\s*0/i,
  ]

  for (const pattern of noResultPatterns) {
    if (pattern.test(allJsonText)) {
      return { runningAds: false, adsFound: 0, ads: [] }
    }
  }

  return null
}

function extractFromBodyText(bodyText: string): ScrapeResult | null {
  const activeAdPatterns = [
    /(\d+)\s*active\s*ads?/i,
    /(\d+)\s*advertisements?\s*found/i,
    /(\d+)\s*results?\s*found/i,
    /showing\s*(\d+)/i,
  ]

  for (const pattern of activeAdPatterns) {
    const match = bodyText.match(pattern)
    if (match) {
      const count = parseInt(match[1], 10)
      if (count > 0) {
        return { runningAds: true, adsFound: count, ads: [] }
      }
    }
  }

  const noResultPhrases = [
    "no results",
    "no ads",
    "no active ads",
    "no results found",
    "nothing to show",
    "try different search",
  ]

  if (noResultPhrases.some((p) => bodyText.includes(p))) {
    return { runningAds: false, adsFound: 0, ads: [] }
  }

  return null
}

export async function checkMetaAds(
  queries: string[],
): Promise<{ runningAds: boolean; adsFound: number; adLibraryUrl: string; ads: AdPreview[] }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const query of queries) {
      try {
        await randomDelay(1000, 3000)
        const result = await attemptSearch(query, attempt)
        if (result === null) {
          logger.warn(`Rate limited or blocked for "${query}", retrying...`)
          await randomDelay(3000, 6000)
          continue
        }
        const encoded = encodeURIComponent(query)
        return {
          runningAds: result.runningAds,
          adsFound: result.adsFound,
          adLibraryUrl: `${BASE_URL}/?active_status=active&ad_type=all&country=ALL&q=${encoded}`,
          ads: result.ads,
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        logger.warn(`Attempt ${attempt + 1} failed for "${query}":`, lastError.message)
        await randomDelay(2000, 4000)
      }
    }
  }

  if (lastError) throw lastError

  const firstQuery = queries[0] || ""
  const encoded = encodeURIComponent(firstQuery)
  return {
    runningAds: false,
    adsFound: 0,
    adLibraryUrl: `${BASE_URL}/?active_status=active&ad_type=all&country=ALL&q=${encoded}`,
    ads: [],
  }
}

import type { Page } from "playwright"
import { createContext, closeBrowser } from "@/utils/browser"
import { randomDelay } from "@/utils/delays"
import { logger } from "@/utils/logger"
import type { AdPreview } from "./types"

const MAX_RETRIES = 3
const BASE_URL = "https://www.facebook.com/ads/library"

async function attemptSearch(
  query: string,
  retryCount: number,
): Promise<{ runningAds: boolean; adsFound: number; ads: AdPreview[] }> {
  const context = await createContext()
  const page = await context.newPage()

  try {
    const encoded = encodeURIComponent(query)
    const url = `${BASE_URL}/?active_status=active&ad_type=all&country=ALL&q=${encoded}`

    logger.info(`Navigating to Meta Ad Library for: "${query}" (attempt ${retryCount + 1}/${MAX_RETRIES})`)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    await randomDelay(3000, 5000)

    const hasAds = await detectAds(page)
    if (hasAds) {
      const ads = await extractAds(page)
      return { runningAds: ads.length > 0, adsFound: ads.length, ads }
    }

    const noResults = await detectNoResults(page)
    if (noResults) {
      return { runningAds: false, adsFound: 0, ads: [] }
    }

    await randomDelay(2000, 4000)
    const retryHasAds = await detectAds(page)
    if (retryHasAds) {
      const ads = await extractAds(page)
      return { runningAds: ads.length > 0, adsFound: ads.length, ads }
    }

    return { runningAds: false, adsFound: 0, ads: [] }
  } finally {
    await page.close().catch(() => {})
  }
}

async function detectAds(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-pagelet="root"]', { timeout: 8000 }).catch(() => {})
    await randomDelay(1000, 2000)

    const adCards = page.locator('[role="article"]')
    const count = await adCards.count().catch(() => 0)
    if (count > 0) return true

    const headings = page.locator("h4, h5, strong")
    const headingCount = await headings.count().catch(() => 0)
    for (let i = 0; i < Math.min(headingCount, 10); i++) {
      const text = await headings.nth(i).textContent().catch(() => "")
      if (text?.toLowerCase().includes("active")) return true
    }

    try {
      await page.waitForFunction(
        () => {
          const body = document.body.innerText.toLowerCase()
          return body.includes("active") || document.querySelectorAll('[role="article"]').length > 0
        },
        { timeout: 5000 },
      )
      return true
    } catch {
      return false
    }
  } catch {
    return false
  }
}

async function detectNoResults(page: Page): Promise<boolean> {
  try {
    const body = await page.evaluate(() => document.body.innerText.toLowerCase())

    const noResultPhrases = [
      "no results",
      "no ads",
      "no active ads",
      "no results found",
      "nothing to show",
      "try different",
      "no matching ads",
    ]

    return noResultPhrases.some((phrase) => body.includes(phrase))
  } catch {
    return false
  }
}

async function extractAds(page: Page): Promise<AdPreview[]> {
  try {
    const ads = await page.evaluate(() => {
      const cards: AdPreview[] = []
      const articles = document.querySelectorAll('[role="article"]')
      articles.forEach((article) => {
        const text = article.textContent?.trim() || ""
        if (text.length > 10) {
          cards.push({
            adText: text.slice(0, 300),
            cta: "",
            landingPage: "",
            image: "",
            status: "active",
            startDate: undefined,
          })
        }
      })
      return cards
    })

    return ads.slice(0, 10)
  } catch {
    return []
  }
}

export async function checkMetaAds(
  queries: string[],
): Promise<{ runningAds: boolean; adsFound: number; adLibraryUrl: string; ads: AdPreview[] }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const query of queries) {
      try {
        const result = await attemptSearch(query, attempt)
        if (result.adsFound > 0) {
          const encoded = encodeURIComponent(query)
          return {
            runningAds: true,
            adsFound: result.adsFound,
            adLibraryUrl: `${BASE_URL}/?active_status=active&ad_type=all&country=ALL&q=${encoded}`,
            ads: result.ads,
          }
        }
        if (result.runningAds === false && result.ads.length === 0) {
          const encoded = encodeURIComponent(query)
          return {
            runningAds: false,
            adsFound: 0,
            adLibraryUrl: `${BASE_URL}/?active_status=active&ad_type=all&country=ALL&q=${encoded}`,
            ads: [],
          }
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

process.on("SIGINT", async () => {
  await closeBrowser()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await closeBrowser()
  process.exit(0)
})

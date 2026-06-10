import { extractCompanyInfo, detectInputType } from "./linkedinExtractor"
import { normalizeCompanyName } from "./companyNormalizer"
import { checkMetaAds } from "./metaAdsChecker"
import { logger } from "@/utils/logger"
import type { AdIntelResult } from "./types"

export async function runAdIntel(input: string): Promise<AdIntelResult> {
  const start = Date.now()
  logger.info(`Starting Ad Intel check for: "${input}"`)

  try {
    const companyInfo = await extractCompanyInfo(input)
    logger.info(`Identified company: "${companyInfo.companyName}"`)

    const queries = normalizeCompanyName(companyInfo.companyName)
    if (queries.length === 0) {
      return {
        success: false,
        companyName: input.trim(),
        runningAds: false,
        adsFound: 0,
        adLibraryUrl: "",
        ads: [],
        error: "Could not identify a valid company name from that input.",
      }
    }

    logger.info(`Search variations: ${queries.join(", ")}`)

    const result = await checkMetaAds(queries)

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    logger.info(`Completed in ${elapsed}s — runningAds: ${result.runningAds}, adsFound: ${result.adsFound}`)

    return {
      success: true,
      companyName: companyInfo.companyName,
      runningAds: result.runningAds,
      adsFound: result.adsFound,
      adLibraryUrl: result.adLibraryUrl,
      ads: result.ads,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error("Ad Intel check failed:", message)

    return {
      success: false,
      companyName: input.trim(),
      runningAds: false,
      adsFound: 0,
      adLibraryUrl: "",
      ads: [],
      error: `Failed to check ads: ${message}`,
    }
  }
}

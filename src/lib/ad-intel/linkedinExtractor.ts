import type { CompanyInfo, InputType } from "./types"

export function detectInputType(input: string): InputType {
  const trimmed = input.trim().toLowerCase()
  if (trimmed.includes("linkedin.com")) return "linkedin"
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes(".")) return "website"
  return "company"
}

export function extractFromLinkedInUrl(url: string): CompanyInfo | null {
  const trimmed = url.trim()
  const patterns = [
    /linkedin\.com\/company\/([^/?]+)/i,
    /linkedin\.com\/school\/([^/?]+)/i,
    /linkedin\.com\/showcase\/([^/?]+)/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      const name = match[1]
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
      return { companyName: name }
    }
  }

  return null
}

export function extractFromWebsiteUrl(url: string): CompanyInfo | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
    const hostname = parsed.hostname.replace(/^www\./, "")
    const parts = hostname.split(".")
    const name = parts[0]
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    return { companyName: name, website: parsed.hostname }
  } catch {
    return null
  }
}

export async function extractCompanyInfo(input: string): Promise<CompanyInfo> {
  const type = detectInputType(input)

  if (type === "linkedin") {
    const result = extractFromLinkedInUrl(input)
    if (result) return result
  }

  if (type === "website") {
    const result = extractFromWebsiteUrl(input)
    if (result) return result
  }

  return { companyName: input.trim() }
}

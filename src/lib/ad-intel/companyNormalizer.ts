const SUFFIXES = [
  "inc",
  "llc",
  "ltd",
  "limited",
  "technologies",
  "technology",
  "group",
  "corporation",
  "corp",
  "solutions",
  "software",
  "systems",
  "global",
  "international",
  "digital",
  "online",
  "media",
  "agency",
  "studio",
  "labs",
  "hq",
  "co",
  "company",
]

export function normalizeCompanyName(raw: string): string[] {
  const base = raw.trim()
  if (!base) return []

  const cleaned = base.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim()

  let stripped = cleaned
  for (const suffix of SUFFIXES) {
    const regex = new RegExp(`\\s+${suffix}$`, "i")
    stripped = stripped.replace(regex, "")
  }

  const variations = new Set<string>()
  variations.add(base)
  variations.add(cleaned)
  if (stripped !== cleaned) {
    variations.add(stripped)
  }
  if (stripped.includes(" ")) {
    variations.add(stripped.replace(/\s+/g, ""))
  }
  if (stripped.includes("-")) {
    variations.add(stripped.replace(/-/g, ""))
  }

  return [...variations].filter(Boolean).slice(0, 4)
}

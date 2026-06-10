export interface AdPreview {
  adText: string
  cta: string
  landingPage: string
  image: string
  status: string
  startDate?: string
}

export interface AdIntelResult {
  success: boolean
  companyName: string
  runningAds: boolean
  adsFound: number
  adLibraryUrl: string
  ads: AdPreview[]
  error?: string
}

export interface CompanyInfo {
  companyName: string
  website?: string
}

export type InputType = "linkedin" | "website" | "company"

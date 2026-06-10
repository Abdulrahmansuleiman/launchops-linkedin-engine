import { NextRequest, NextResponse } from "next/server"
import { runAdIntel } from "@/lib/ad-intel"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = body?.input?.trim()

    if (!input) {
      return NextResponse.json(
        { success: false, error: "Please provide a company name, website URL, or LinkedIn URL." },
        { status: 400 },
      )
    }

    if (input.length > 500) {
      return NextResponse.json(
        { success: false, error: "Input is too long. Please shorten it." },
        { status: 400 },
      )
    }

    const result = await runAdIntel(input)

    if (!result.success) {
      return NextResponse.json(result, { status: 422 })
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, companyName: "", runningAds: false, adsFound: 0, adLibraryUrl: "", ads: [], error: message },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Ad Intel API is ready." })
}

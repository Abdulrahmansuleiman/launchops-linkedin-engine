import { Search } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full mb-4" style={{ background: "var(--badge-bg)" }}>
        <Search className="w-8 h-8" style={{ color: "var(--muted)" }} />
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Check if a business is running Meta ads
      </h3>
      <p className="text-sm max-w-md" style={{ color: "var(--muted)" }}>
        Enter a LinkedIn company URL, website URL, or company name to search the Meta Ad Library for active ads.
      </p>
    </div>
  )
}

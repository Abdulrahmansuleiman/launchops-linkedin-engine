export default function Loading() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Ad Intel
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Check if a business is running Meta ads
        </p>
      </div>
      <div className="flex gap-2">
        <div
          className="flex-1 h-10 rounded-lg animate-pulse"
          style={{ background: "var(--card-border)" }}
        />
        <div
          className="h-10 w-24 rounded-lg animate-pulse"
          style={{ background: "var(--card-border)" }}
        />
      </div>
      <div
        className="rounded-xl p-6 animate-pulse space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <div className="h-5 w-48 rounded" style={{ background: "var(--card-border)" }} />
        <div className="h-4 w-32 rounded" style={{ background: "var(--card-border)" }} />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-20 rounded-lg" style={{ background: "var(--card-border)" }} />
          <div className="h-20 rounded-lg" style={{ background: "var(--card-border)" }} />
        </div>
      </div>
    </div>
  );
}

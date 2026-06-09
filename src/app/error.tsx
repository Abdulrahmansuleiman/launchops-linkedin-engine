"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          Something went wrong
        </h1>
        <div
          className="p-4 rounded-lg text-sm font-mono whitespace-pre-wrap break-all"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
        >
          {error.message}
          {"\n\n"}
          {error.stack}
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#2563eb", color: "white", border: "none" }}
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

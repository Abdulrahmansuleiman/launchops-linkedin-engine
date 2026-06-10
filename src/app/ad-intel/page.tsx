"use client";

import { useState, useCallback } from "react";
import { SearchForm } from "./components/SearchForm";
import { ResultsCard } from "./components/ResultsCard";
import { EmptyState } from "./components/EmptyState";
import type { AdIntelResult } from "@/lib/ad-intel/types";


export default function AdIntelPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdIntelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ad-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data: AdIntelResult = await res.json();
      if (!res.ok) throw new Error(data.error || `Search failed (${res.status})`);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

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

      <SearchForm onSearch={handleSearch} loading={loading} />

      {loading && (
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
      )}

      {error && (
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <p className="text-sm" style={{ color: "#f87171" }}>
            {error}
          </p>
        </div>
      )}

      {result && !loading && <ResultsCard result={result} />}

      {!result && !loading && !error && <EmptyState />}
    </div>
  );
}

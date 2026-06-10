"use client";

import { CheckCircle2, XCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdIntelResult } from "@/lib/ad-intel/types";

interface ResultsCardProps {
  result: AdIntelResult;
}

export function ResultsCard({ result }: ResultsCardProps) {
  if (!result.success && result.error) {
    return (
      <div
        className="rounded-xl p-6 mt-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#f87171" }} />
          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Search failed
            </h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {result.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-6 mt-4 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            {result.companyName}
          </h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Meta Ad Library results
          </p>
        </div>
        {result.runningAds ? (
          <Badge variant="success" className="text-sm px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
            Running Ads
          </Badge>
        ) : (
          <Badge variant="default" className="text-sm px-3 py-1">
            <XCircle className="w-3.5 h-3.5 mr-1 inline" />
            No Active Ads
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 rounded-lg text-center"
          style={{ background: "var(--badge-bg)" }}
        >
          <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {result.adsFound}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Active Ads Found
          </p>
        </div>
        <div
          className="p-4 rounded-lg text-center"
          style={{ background: "var(--badge-bg)" }}
        >
          <p className="text-sm font-medium mt-2" style={{ color: "var(--foreground)" }}>
            {result.runningAds ? "Yes" : "No"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Running Ads
          </p>
        </div>
      </div>

      {result.adLibraryUrl && (
        <a
          href={result.adLibraryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "#3b82f6" }}
        >
          <ExternalLink className="w-4 h-4" />
          View in Meta Ad Library
        </a>
      )}
    </div>
  );
}

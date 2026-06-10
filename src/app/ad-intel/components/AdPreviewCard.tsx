"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdPreview } from "@/lib/ad-intel/types";

interface AdPreviewCardProps {
  ad: AdPreview;
  index: number;
}

export function AdPreviewCard({ ad, index }: AdPreviewCardProps) {
  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Ad #{index + 1}
        </span>
        <Badge variant={ad.status === "active" ? "success" : "default"} className="text-[10px]">
          {ad.status}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed line-clamp-4" style={{ color: "var(--foreground)" }}>
        {ad.adText || "No ad text available"}
      </p>
      {ad.cta && (
        <p className="text-xs font-medium" style={{ color: "#3b82f6" }}>
          CTA: {ad.cta}
        </p>
      )}
      {ad.landingPage && (
        <a
          href={ad.landingPage}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
          style={{ color: "#3b82f6" }}
        >
          <ExternalLink className="w-3 h-3" />
          Landing Page
        </a>
      )}
      {ad.startDate && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Started: {ad.startDate}
        </p>
      )}
    </div>
  );
}

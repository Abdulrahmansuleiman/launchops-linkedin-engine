"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Trash2,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Megaphone,
  Copy,
  Check,
} from "lucide-react";
import { getAds, generateAds, updateAd, deleteAd } from "@/lib/api";
import type { Ad } from "@/lib/api";

const STAGES = ["WRITING", "SELECTION", "REVIEW", "PUBLISHED"];

const STAGE_LABELS: Record<string, string> = {
  WRITING: "Writing",
  SELECTION: "Selection",
  REVIEW: "Review",
  PUBLISHED: "Published",
};

const STAGE_COLORS: Record<string, string> = {
  WRITING: "#6366f1",
  SELECTION: "#f59e0b",
  REVIEW: "#06b6d4",
  PUBLISHED: "#22c55e",
};

const SERVICES = [
  { value: "", label: "All services" },
  { value: "Text AI Agent", label: "Text AI Agent" },
  { value: "Voice AI Agent", label: "Voice AI Agent" },
  { value: "Whitelabling System", label: "Whitelabling System" },
  { value: "Reactivation Voice Agent", label: "Reactivation Voice Agent" },
];

const PLATFORMS = ["linkedin", "facebook"];

export default function AdsPage() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate form
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [service, setService] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("linkedin");
  const [adCount, setAdCount] = useState(5);

  const queryClient = useQueryClient();

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["ads"],
    queryFn: () => getAds(),
  });

  const grouped = STAGES.map((stage) => ({
    stage,
    ads: ads.filter((a) => a.stage === stage),
  }));

  const handleGenerate = async () => {
    if (!niche.trim() || !offer.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      await generateAds({
        niche: niche.trim(),
        offer: offer.trim(),
        service,
        targetAudience: targetAudience.trim() || "Business owners, founders, agency owners",
        platform,
        count: adCount,
      });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setShowGenerate(false);
      setNiche("");
      setOffer("");
      setService("");
      setTargetAudience("");
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const moveStage = async (id: string, stage: string) => {
    await updateAd(id, { stage } as any);
    queryClient.invalidateQueries({ queryKey: ["ads"] });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) await moveStage(id, stage);
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDelete = async (id: string) => {
    await deleteAd(id);
    queryClient.invalidateQueries({ queryKey: ["ads"] });
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return "var(--muted)";
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Ads
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Write, review, and publish ad copy with Max-ads
          </p>
        </div>
        <Button onClick={() => setShowGenerate(true)} disabled={generating}>
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? "Generating..." : "Generate Ads"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "#451a1a", color: "#f87171", border: "1px solid #7f1d1d" }}>
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {grouped.map(({ stage, ads: stageAds }) => (
          <div
            key={stage}
            className={`rounded-xl flex flex-col min-h-[400px] transition-all duration-200 ${
              dragOverStage === stage ? "scale-[1.02]" : ""
            }`}
            style={{
              background: "var(--card)",
              border: `1px solid ${dragOverStage === stage ? STAGE_COLORS[stage] : "var(--card-border)"}`,
            }}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div
              className="px-4 py-3 rounded-t-xl flex items-center justify-between"
              style={{ borderBottom: `2px solid ${STAGE_COLORS[stage]}` }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: STAGE_COLORS[stage], color: "#fff" }}
                >
                  {stageAds.length}
                </span>
              </div>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {stageAds.length === 0 ? (
                <div
                  className="flex items-center justify-center h-32 rounded-lg text-sm"
                  style={{
                    color: "var(--muted)",
                    border: "2px dashed var(--card-border)",
                  }}
                >
                  {stage === "WRITING" ? "Generate ads to start" : "Drop ads here"}
                </div>
              ) : (
                stageAds.map((ad) => (
                  <div
                    key={ad.id}
                    className={`rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      draggingId === ad.id ? "opacity-50 rotate-2" : ""
                    } ${expandedId === ad.id ? "" : "hover:shadow-md"}`}
                    style={{
                      background: "var(--card-alt, var(--card))",
                      border: "1px solid var(--card-border)",
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ad.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setExpandedId(expandedId === ad.id ? null : ad.id)}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 mt-1 shrink-0" style={{ color: "var(--muted)" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium"
                            style={{ background: "#2563eb", color: "#fff" }}
                          >
                            Ads
                          </span>
                          {ad.angle && (
                            <span
                              className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium"
                              style={{
                                background: "var(--card-border)",
                                color: "var(--muted)",
                              }}
                            >
                              {ad.angle}
                            </span>
                          )}
                          {ad.platform && (
                            <span
                              className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium capitalize"
                              style={{
                                background: ad.platform === "linkedin" ? "#0a66c2" : "#1877f2",
                                color: "#fff",
                              }}
                            >
                              {ad.platform}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold leading-tight mb-1" style={{ color: "var(--foreground)" }}>
                          {ad.hook || "No hook"}
                        </p>

                        {expandedId === ad.id && (
                          <div className="mt-2 space-y-2">
                            <div
                              className="text-sm rounded-lg p-3 whitespace-pre-wrap leading-relaxed"
                              style={{
                                background: "var(--card)",
                                border: "1px solid var(--card-border)",
                                color: "var(--foreground)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ad.content}
                            </div>

                            {ad.scoreReason && (
                              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                                {ad.scoreReason}
                              </p>
                            )}

                            {ad.impressionPrediction && (
                              <p className="text-xs" style={{ color: "#22c55e" }}>
                                Predicted: {ad.impressionPrediction}
                              </p>
                            )}

                            <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleCopy(ad.content, ad.id)}
                              >
                                {copiedId === ad.id ? (
                                  <Check className="w-3 h-3 mr-1" />
                                ) : (
                                  <Copy className="w-3 h-3 mr-1" />
                                )}
                                {copiedId === ad.id ? "Copied" : "Copy"}
                              </Button>
                              {stage === "SELECTION" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  style={{ color: "#06b6d4" }}
                                  onClick={async () => {
                                    await moveStage(ad.id, "REVIEW");
                                  }}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Send to Review
                                </Button>
                              )}
                              {stage === "REVIEW" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  style={{ color: "#22c55e" }}
                                  onClick={async () => {
                                    await moveStage(ad.id, "PUBLISHED");
                                  }}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Publish
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs ml-auto"
                                style={{ color: "#ef4444" }}
                                onClick={async () => handleDelete(ad.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}

                        {expandedId !== ad.id && (
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                            {ad.content?.replace(ad.hook || "", "").trim().substring(0, 120)}...
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1 shrink-0 ml-1">
                        <span
                          className="text-xs font-bold"
                          style={{ color: scoreColor(ad.score) }}
                        >
                          {ad.score ?? "—"}
                        </span>
                        <button
                          className="p-0.5"
                          style={{ color: "var(--muted)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(expandedId === ad.id ? null : ad.id);
                          }}
                        >
                          {expandedId === ad.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowGenerate(false)}
        >
          <div
            className="rounded-xl w-full max-w-lg p-6 space-y-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" style={{ color: "#2563eb" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  Max-ads — Generate Ad Copy
                </h2>
              </div>
              <button
                onClick={() => setShowGenerate(false)}
                style={{ color: "var(--muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Niche / Topic *
                </label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "var(--card-alt, var(--background))",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  placeholder="e.g. Solar installation, Dental clinic, Real estate agency"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Offer *
                </label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "var(--card-alt, var(--background))",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  placeholder="e.g. AI voice agent that books appointments 24/7"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Service
                </label>
                <select
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "var(--card-alt, var(--background))",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  {SERVICES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Target Audience
                </label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "var(--card-alt, var(--background))",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  placeholder="Business owners, founders, agency owners"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                    Platform
                  </label>
                  <select
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--card-alt, var(--background))",
                      border: "1px solid var(--card-border)",
                      color: "var(--foreground)",
                    }}
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook / Meta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                    Variations ({adCount})
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={adCount}
                    onChange={(e) => setAdCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowGenerate(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleGenerate}
                disabled={generating || !niche.trim() || !offer.trim()}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Max-ads is writing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {adCount} Ads
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
